// routes/reports.ts
import express from "express";
import { connectMongoDB } from "../lib/mongodb";
import Appointment from "../models/appointment";
import User from "../models/user";

const router = express.Router();

interface GenerateReportRequest {
  patientId: string;
  type: 'comprehensive' | 'vitals' | 'medications' | 'progress';
  format: 'pdf' | 'excel' | 'csv';
  dateRange: string;
  includeVitals?: boolean;
  includeMedications?: boolean;
  includeAppointments?: boolean;
  customStartDate?: string;
  customEndDate?: string;
}

// Test endpoint to verify reports route is working
router.get("/test", async (req: express.Request, res: express.Response) => {
  try {
    
    res.status(200).json({
      success: true,
      message: "Reports API is working!",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Test endpoint error:", err);
    res.status(500).json({
      success: false,
      message: "Test endpoint failed"
    });
  }
});

// Generate patient report
router.post("/generate", async (req: express.Request, res: express.Response) => {
  try {
    

    const {
      patientId,
      type,
      format,
      dateRange,
      includeVitals = true,
      includeMedications = true,
      includeAppointments = true,
      customStartDate,
      customEndDate
    }: GenerateReportRequest = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    await connectMongoDB();

    // Get patient information
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Calculate date range
    const getDateRange = () => {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'last-7-days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last-30-days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last-90-days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'last-6-months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'last-year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (customStartDate) {
            startDate = new Date(customStartDate);
          }
          break;
        default:
          startDate.setDate(now.getDate() - 30); // Default to 30 days
      }

      const endDate = customEndDate ? new Date(customEndDate) : now;
      return { startDate, endDate };
    };

    const { startDate, endDate } = getDateRange();

    

    // Collect report data
    const reportData: any = {
      patient: {
        id: patient._id,
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        age: patient.age,
        gender: patient.gender,
        condition: patient.condition
      },
      generatedAt: new Date().toISOString(),
      reportType: type,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      sections: {
        vitals: includeVitals,
        medications: includeMedications,
        appointments: includeAppointments
      }
    };

    // Fetch appointments if requested
    if (includeAppointments) {
      const appointments = await Appointment.find({
        patientId,
        scheduledDate: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('doctorId', 'fullName specialization')
      .sort({ scheduledDate: -1 });

      reportData.appointments = appointments;
      
    }

    // Add vitals data if requested
    if (includeVitals) {
      try {
        // Try to fetch vitals data from different endpoints
        const vitalsEndpoints = [
          `/api/patient/vitals/${patientId}`,
          `/api/diabetesVitals/patient/${patientId}`,
          `/api/hypertensionVitals/patient/${patientId}`
        ];

        let vitalsData = null;
        
        // In a real implementation, you would fetch actual vitals data here
        // For now, we'll add a placeholder
        reportData.vitals = {
          note: "Vitals data collection would be implemented here",
          totalReadings: 0,
          available: false
        };
        
       
      } catch (vitalsError) {
        
        reportData.vitals = {
          note: "Vitals data not available",
        //   error: vitalsError.message
        };
      }
    }

    // Add medications data if requested
    if (includeMedications) {
      try {
        // Try to fetch medications data
        // In a real implementation, you would fetch from your medications collection
        reportData.medications = {
          note: "Medications data collection would be implemented here",
          totalMedications: 0,
          available: false
        };
        
        
      } catch (medsError) {
        
        reportData.medications = {
          note: "Medications data not available",
        //   error: medsError.message
        };
      }
    }

   

    // Handle different formats
    if (format === 'csv') {
      // Generate CSV
      const csvData = convertToCSV(reportData);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="patient-report-${patient.fullName}-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csvData);
      
    } else if (format === 'pdf') {
      // For PDF, return JSON with download info
      // In production, you would generate actual PDF using libraries like pdfkit or puppeteer
      return res.status(200).json({
        success: true,
        message: "PDF report data generated successfully. PDF download would be implemented in production.",
        data: reportData,
        format: 'pdf',
        downloadAvailable: false,
        timestamp: new Date().toISOString()
      });
      
    } else if (format === 'excel') {
      // For Excel, return JSON with download info
      // In production, you would generate actual Excel using libraries like exceljs
      return res.status(200).json({
        success: true,
        message: "Excel report data generated successfully. Excel download would be implemented in production.",
        data: reportData,
        format: 'excel',
        downloadAvailable: false,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Default JSON response
      return res.status(200).json({
        success: true,
        message: "Report generated successfully",
        data: reportData,
        format: format,
        downloadAvailable: format === 'csv', // Only CSV downloads are implemented
        timestamp: new Date().toISOString()
      });
    }

  } catch (err: any) {
    console.error(" Error generating report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: err.message
    });
  }
});

// Download generated report
router.get("/download/:reportId", async (req: express.Request, res: express.Response) => {
  try {
    const { reportId } = req.params;
   
    
    // This would serve the actual generated file
    // For now, it's a placeholder that returns the report data
    res.status(200).json({
      success: true,
      message: "Download endpoint - in production this would serve the actual file",
      reportId: reportId,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error downloading report:", err);
    res.status(500).json({
      success: false,
      message: "Error downloading report"
    });
  }
});

// Get report status
router.get("/status/:reportId", async (req: express.Request, res: express.Response) => {
  try {
    const { reportId } = req.params;
    
    res.status(200).json({
      success: true,
      reportId: reportId,
      status: "completed", // Would track actual status in production
      downloadUrl: `/api/reports/download/${reportId}`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error getting report status:", err);
    res.status(500).json({
      success: false,
      message: "Error getting report status"
    });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data: any): string => {
  try {
    const headers = ['Field', 'Value'];
    const rows = [];

    // Add patient info
    rows.push(['PATIENT HEALTH REPORT', '']);
    rows.push(['', '']);
    rows.push(['Patient Information', '']);
    rows.push(['Name', data.patient.fullName]);
    rows.push(['Email', data.patient.email]);
    rows.push(['Phone', data.patient.phoneNumber]);
    rows.push(['Age', data.patient.age]);
    rows.push(['Gender', data.patient.gender]);
    rows.push(['Condition', data.patient.condition]);
    rows.push(['', '']);
    
    // Add report info
    rows.push(['Report Information', '']);
    rows.push(['Report Type', data.reportType]);
    rows.push(['Generated At', new Date(data.generatedAt).toLocaleString()]);
    rows.push(['Date Range', `${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`]);
    rows.push(['', '']);

    // Add sections info
    rows.push(['Included Sections', '']);
    rows.push(['Vital Signs', data.sections.vitals ? 'Yes' : 'No']);
    rows.push(['Medications', data.sections.medications ? 'Yes' : 'No']);
    rows.push(['Appointments', data.sections.appointments ? 'Yes' : 'No']);
    rows.push(['', '']);

    // Add appointments if available
    if (data.appointments && data.appointments.length > 0) {
      rows.push(['APPOINTMENTS', '']);
      rows.push(['Date', 'Type', 'Doctor', 'Status', 'Notes']);
      data.appointments.forEach((apt: any) => {
        rows.push([
          new Date(apt.scheduledDate).toLocaleString(),
          apt.type,
          apt.doctorId?.fullName || 'N/A',
          apt.status,
          apt.notes || ''
        ]);
      });
      rows.push(['', '']);
      rows.push(['Total Appointments', data.appointments.length.toString()]);
    } else {
      rows.push(['APPOINTMENTS', 'No appointments found in the selected date range']);
    }

    rows.push(['', '']);
    rows.push(['Report Generated By', 'SmartCare System']);
    rows.push(['Generated On', new Date().toLocaleString()]);

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    console.error("Error converting to CSV:", error);
    return "Error generating CSV report";
  }
};

// Get available report types
router.get("/types", async (req: express.Request, res: express.Response) => {
  try {
    const reportTypes = [
      {
        id: 'comprehensive',
        name: 'Comprehensive Health Report',
        description: 'Complete overview including all patient data',
        supports: ['pdf', 'excel', 'csv']
      },
      {
        id: 'vitals',
        name: 'Vitals Summary',
        description: 'Detailed vital signs history and trends',
        supports: ['pdf', 'csv']
      },
      {
        id: 'medications',
        name: 'Medication History',
        description: 'Complete medication and prescription history',
        supports: ['pdf', 'excel', 'csv']
      },
      {
        id: 'progress',
        name: 'Progress Report',
        description: 'Treatment progress and outcomes',
        supports: ['pdf', 'csv']
      }
    ];

    res.status(200).json({
      success: true,
      reportTypes: reportTypes
    });
  } catch (err: any) {
    console.error("Error getting report types:", err);
    res.status(500).json({
      success: false,
      message: "Error getting report types"
    });
  }
});

// Health check for reports service
router.get("/health", async (req: express.Request, res: express.Response) => {
  try {
    await connectMongoDB();
    
    res.status(200).json({
      success: true,
      message: "Reports service is healthy",
      timestamp: new Date().toISOString(),
      database: "Connected",
      endpoints: {
        generate: "POST /api/reports/generate",
        download: "GET /api/reports/download/:id",
        status: "GET /api/reports/status/:id",
        types: "GET /api/reports/types",
        test: "GET /api/reports/test"
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Reports service health check failed",
      error: err.message
    });
  }
});

export default router;