import express from 'express';
import jwt from 'jsonwebtoken';
import { connectMongoDB } from '../../lib/mongodb';
import User from '../../models/user';
import AssignmentLog from '../../models/assignmentLog';

declare global {
  namespace Express {
    interface Request {
      adminId: string;
    }
  }
}

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Assign doctor to patient
router.post('/assign-doctor', authenticateAdmin, async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    
    await connectMongoDB();

    const [doctor, patient] = await Promise.all([
      User.findById(doctorId),
      User.findById(patientId)
    ]);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if already assigned
    if (patient.assignedDoctor === doctorId) {
      return res.status(400).json({ message: 'Doctor already assigned to patient' });
    }

    // Update patient and doctor records
    patient.assignedDoctor = doctorId;
    await patient.save();

    if (!doctor.assignedPatients.includes(patientId)) {
      doctor.assignedPatients.push(patientId);
      await doctor.save();
    }

    // Log assignment
    const logEntry = new AssignmentLog({
      adminId: req.adminId,
      doctorId,
      patientId,
      action: 'assignment',
      timestamp: new Date()
    });
    await logEntry.save();

    res.status(200).json({ 
      message: 'Doctor assigned successfully',
      doctorId,
      patientId
    });

  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error assigning doctor',
      error: error.message 
    });
  }
});

// Unassign doctor from patient
router.post('/unassign-doctor', authenticateAdmin, async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    
    await connectMongoDB();

    const [doctor, patient] = await Promise.all([
      User.findById(doctorId),
      User.findById(patientId)
    ]);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Remove assignment
    patient.assignedDoctor = null;
    await patient.save();

    doctor.assignedPatients = doctor.assignedPatients.filter((id: any) => id.toString() !== patientId);
    await doctor.save();

    // Log unassignment
    const logEntry = new AssignmentLog({
      adminId: req.adminId,
      doctorId,
      patientId,
      action: 'unassignment',
      timestamp: new Date()
    });
    await logEntry.save();

    res.status(200).json({ 
      message: 'Doctor unassigned successfully',
      doctorId,
      patientId
    });

  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error unassigning doctor',
      error: error.message 
    });
  }
});

// Bulk assign patients to doctor
router.post('/bulk-assign', authenticateAdmin, async (req, res) => {
  try {
    const { doctorId, patientIds } = req.body;
    
    await connectMongoDB();

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const results = await Promise.all(
      patientIds.map(async (patientId: string) => {
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
          return { patientId, success: false, message: 'Patient not found' };
        }

        // Update assignment
        patient.assignedDoctor = doctorId;
        patient.assignmentSource = 'admin';
        await patient.save();

        // Add to doctor's assigned patients if not already there
        if (!doctor.assignedPatients.includes(patientId)) {
          doctor.assignedPatients.push(patientId);
          await doctor.save();
        }

        // Log assignment
        const logEntry = new AssignmentLog({
          adminId: req.adminId,
          doctorId,
          patientId,
          action: 'assignment',
          timestamp: new Date()
        });
        await logEntry.save();

        return { patientId, success: true };
      })
    );

    res.status(200).json({ results });

  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error performing bulk assignment',
      error: error.message 
    });
  }
});

// Get assignment history
router.get('/assignment-history', authenticateAdmin, async (req, res) => {
  try {
    await connectMongoDB();
    
    const history = await AssignmentLog.find()
      .populate('adminId', 'fullName email')
      .populate('doctorId', 'fullName specialization')
      .populate('patientId', 'fullName')
      .sort({ timestamp: -1 });

    res.status(200).json({ history });
    
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching assignment history',
      error: error.message 
    });
  }
});

export default router;