// routes/appointments.ts
import express from "express";
import Appointment, { IAppointment } from "../models/Appointment";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  type?: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate: string;
  duration?: number;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

interface UpdateAppointmentRequest {
  type?: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate?: string;
  duration?: number;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

// Create new appointment
router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    console.log("=== APPOINTMENT CREATION REQUEST ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    
    const { 
      patientId,
      doctorId,
      type,
      scheduledDate,
      duration,
      notes,
      status
    }: CreateAppointmentRequest = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !scheduledDate) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields",
        required: ["patientId", "doctorId", "scheduledDate"]
      });
    }

    await connectMongoDB();

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      type: type || 'follow-up',
      scheduledDate: new Date(scheduledDate),
      duration: duration || 30,
      notes: notes || '',
      status: status || 'scheduled'
    });

    console.log("Appointment created successfully:", appointment._id);
    
    // Populate the appointment with patient and doctor details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName fullName email phoneNumber')
      .populate('doctorId', 'firstName lastName fullName specialization');

    res.status(201).json({ 
      success: true,
      message: "Appointment scheduled successfully", 
      appointment: populatedAppointment
    });
  } catch (err: any) {
    console.error("Appointment creation error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
});

// Get appointments for a patient
router.get("/patient/:patientId", async (req: express.Request, res: express.Response) => {
  try {
    const { patientId } = req.params;
    
    console.log("=== FETCHING PATIENT APPOINTMENTS ===");
    console.log("Patient ID:", patientId);

    await connectMongoDB();

    const appointments = await Appointment.find({ patientId })
      .populate('patientId', 'firstName lastName fullName email phoneNumber')
      .populate('doctorId', 'firstName lastName fullName specialization')
      .sort({ scheduledDate: -1 });

    console.log(`Found ${appointments.length} appointments for patient`);

    res.status(200).json({ 
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err: any) {
    console.error("Get patient appointments error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Get appointments for a doctor
router.get("/doctor/:doctorId", async (req: express.Request, res: express.Response) => {
  try {
    const { doctorId } = req.params;
    
    console.log("=== FETCHING DOCTOR APPOINTMENTS ===");
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'firstName lastName fullName email phoneNumber condition')
      .populate('doctorId', 'firstName lastName fullName specialization')
      .sort({ scheduledDate: -1 });

    console.log(`Found ${appointments.length} appointments for doctor`);

    res.status(200).json({ 
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err: any) {
    console.error("Get doctor appointments error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Get all appointments (for admin)
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    console.log("=== FETCHING ALL APPOINTMENTS ===");
    
    await connectMongoDB();

    const appointments = await Appointment.find()
      .populate('patientId', 'firstName lastName fullName email phoneNumber condition')
      .populate('doctorId', 'firstName lastName fullName specialization hospital')
      .sort({ scheduledDate: -1 });

    console.log(`Found ${appointments.length} total appointments`);

    res.status(200).json({ 
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err: any) {
    console.error("Get all appointments error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Get single appointment by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    console.log("=== FETCHING SINGLE APPOINTMENT ===");
    console.log("Appointment ID:", id);

    await connectMongoDB();

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'firstName lastName fullName email phoneNumber condition')
      .populate('doctorId', 'firstName lastName fullName specialization hospital');

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found" 
      });
    }

    console.log("Appointment found:", appointment._id);

    res.status(200).json({ 
      success: true,
      appointment
    });
  } catch (err: any) {
    console.error("Get appointment error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Update appointment
router.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const {
      type,
      scheduledDate,
      duration,
      notes,
      status
    }: UpdateAppointmentRequest = req.body;

    console.log("=== UPDATING APPOINTMENT ===");
    console.log("Appointment ID:", id);
    console.log("Update data:", req.body);

    await connectMongoDB();

    const updateData: any = {};
    if (type) updateData.type = type;
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (duration) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('patientId', 'firstName lastName fullName email phoneNumber')
    .populate('doctorId', 'firstName lastName fullName specialization');

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found" 
      });
    }

    console.log("Appointment updated successfully:", appointment._id);

    res.status(200).json({ 
      success: true,
      message: "Appointment updated successfully", 
      appointment
    });
  } catch (err: any) {
    console.error("Appointment update error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
});

// Delete appointment
router.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    console.log("=== DELETING APPOINTMENT ===");
    console.log("Appointment ID:", id);

    await connectMongoDB();

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found" 
      });
    }

    console.log("Appointment deleted successfully:", id);

    res.status(200).json({ 
      success: true,
      message: "Appointment deleted successfully" 
    });
  } catch (err: any) {
    console.error("Delete appointment error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Get upcoming appointments for a patient
router.get("/patient/:patientId/upcoming", async (req: express.Request, res: express.Response) => {
  try {
    const { patientId } = req.params;
    
    console.log("=== FETCHING UPCOMING PATIENT APPOINTMENTS ===");
    console.log("Patient ID:", patientId);

    await connectMongoDB();

    const now = new Date();
    const appointments = await Appointment.find({ 
      patientId, 
      scheduledDate: { $gte: now },
      status: 'scheduled'
    })
    .populate('patientId', 'firstName lastName fullName email phoneNumber')
    .populate('doctorId', 'firstName lastName fullName specialization')
    .sort({ scheduledDate: 1 }); // ascending order

    console.log(`Found ${appointments.length} upcoming appointments`);

    res.status(200).json({ 
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err: any) {
    console.error("Get upcoming appointments error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

// Get upcoming appointments for a doctor
router.get("/doctor/:doctorId/upcoming", async (req: express.Request, res: express.Response) => {
  try {
    const { doctorId } = req.params;
    
    console.log("=== FETCHING UPCOMING DOCTOR APPOINTMENTS ===");
    console.log("Doctor ID:", doctorId);

    await connectMongoDB();

    const now = new Date();
    const appointments = await Appointment.find({ 
      doctorId, 
      scheduledDate: { $gte: now },
      status: 'scheduled'
    })
    .populate('patientId', 'firstName lastName fullName email phoneNumber condition')
    .populate('doctorId', 'firstName lastName fullName specialization')
    .sort({ scheduledDate: 1 }); // ascending order

    console.log(`Found ${appointments.length} upcoming appointments`);

    res.status(200).json({ 
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (err: any) {
    console.error("Get upcoming doctor appointments error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
});

export default router;