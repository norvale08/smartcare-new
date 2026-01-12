// FILE: apps/api/src/app.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import session from "express-session";
import { connectMongoDB } from './lib/mongodb';

import authRoute from "./routes/auth";
import loginRoute from './routes/login';
import emergencyRoutes from './routes/emergency';
import diabetesRoutes from "./routes/diabetesVitals";
import userStatusRouter from './routes/userStatus';
import profileRoutes from './routes/patient';
import uploadRoute from "./routes/upload";
import hypertensionRoutes from './routes/hypertensionVitals';
import medicationsRoutes from './routes/medications';
import diabetesAiRoutes from "./routes/diabetesAi";
import LifestyleRoutes from "./routes/diabetesLifestyle";
import hypertensionLifestyle from "./routes/hypertensionLifestyle";
import hypertensionDiet from "./routes/hypertensionDiet";
import doctorDashboardRouter from './routes/doctorDashboardRoutes';
import logoutRoute from "./routes/logout";
import verifyTokenRoute from "./routes/verifyTokenRoute";
import diabetesFoodRoute from "./routes/diabetesFood"
import adminRoutes from './routes/admin';
import doctorMeRoutes from './routes/doctorme';
import patientSearchRoute from "./routes/patientSearch";
import assignPatientRoute from "./routes/assignPatients";
import patientRequestsRoute from './routes/patientRequests';
import doctorSearchRoutes from "./routes/doctorSearch";
import doctorRequestsRoute from "./routes/doctorsRequests";
import doctorManagementRoutes from "./routes/doctorManagement";
import patientAssignedDoctorsRoute from "./routes/patientAssignedDoctors";
import notificationsRouter from './routes/notifications';
import patientVitalsRouter from './routes/patientVitals';
import messagesRouter from './routes/messages';

import doctorsRoutes from "./routes/doctors";
import comprehensiveFeedbackRoutes from "./routes/comprehensiveFeedback";

import medicationPrescriptionRoutes from './routes/medicationPrescription';
import medicationReminderRoutes from './routes/medicationReminders';
import patientMedicationsRoutes from './routes/patientMedications';
import medicineRoutes from './routes/medicine';
import appointmentRoutes from "./routes/appointments";
import reportRoutes from "./routes/reports";
import speechRoutes from './routes/groqSpeechRoutes';
import pythonSpeechRoutes from './routes/speech.routes';
import relativeSetupRoutes from './routes/relative-setup';
import relativePatientRouter from './routes/relativePatient'

// import patientDetailsRoute from "./routes/patientDetails";
import sendEmailRouter from './routes/send-email';
import adminDoctorsRoutes from './routes/adminDoctors';  // Add this line
import adminPatientsRoutes from './routes/adminPatients';
import adminDoctorAssignmentsRouter from './routes/admin/doctorAssignments';

dotenv.config();


const app = express();


const PORT = parseInt(process.env.PORT || '8000', 10);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://smartcare-new-web.vercel.app', 
];


if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// FIXED: Updated CORS configuration to include Cache-Control header
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',  // Added this
    'Pragma',         // Added this
    'Expires'         // Added this
  ],
  exposedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// SESSION SETUP
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      httpOnly: true,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectMongoDB();


app.get('/', (_req, res) => {
  res.json({
    message: 'SmartCare API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});


app.use('/api/auth', authRoute);
app.use('/api/login', loginRoute);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/profile', profileRoutes);
app.use("/api/upload", uploadRoute);
app.use('/api/diabetesVitals', diabetesRoutes);
app.use('/api/hypertensionVitals', hypertensionRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/userStatus', userStatusRouter);
app.use("/api/doctors/search", doctorSearchRoutes);
app.use('/api/doctors', doctorsRoutes); 
app.use("/api/diabetesAi", diabetesAiRoutes);
app.use('/api/lifestyle', LifestyleRoutes);
app.use('/api/hypertension/lifestyle', hypertensionLifestyle);
app.use('/api/hypertension/diet', hypertensionDiet);
app.use('/api/hypertension/diet', hypertensionDiet);
app.use('/api/doctorDashboard', doctorDashboardRouter);
app.use("/api/verifyToken", verifyTokenRoute);
app.use( "/api/diabeticFood", diabetesFoodRoute);
app.use('/api/admin/doctors', adminDoctorsRoutes); 
app.use('/api/admin/patients', adminPatientsRoutes); 
app.use('/api/admin/doctor-assignments', adminDoctorAssignmentsRouter);
app.use('/api/admin',adminRoutes);
app.use('/api/doctor/me', doctorMeRoutes);
app.use("/api/patients/search", patientSearchRoute);
app.use("/api/doctor/assign-patient", assignPatientRoute);
app.use('/api/patient', patientRequestsRoute);
app.use('/api/doctor', doctorRequestsRoute);
app.use('/api/doctor/manage', doctorManagementRoutes);
app.use('/api/patient', patientAssignedDoctorsRoute);
app.use('/api/notifications', notificationsRouter);
app.use('/api/patient/vitals', patientVitalsRouter);
app.use('/api/messages', messagesRouter);
app.use("/api", comprehensiveFeedbackRoutes);
// app.use('/api/patient/details', patientDetailsRoute);

app.use('/api/medications/prescribe', medicationPrescriptionRoutes);
app.use('/api/medications/reminders', medicationReminderRoutes);
app.use('/api/medications/patient', patientMedicationsRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/python-speech', pythonSpeechRoutes);
app.use('/api/relative-setup', relativeSetupRoutes);
app.use('/api/relative', relativePatientRouter);
app.use('/api', sendEmailRouter);


app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// CRITICAL: Bind to 0.0.0.0 for Render deployment
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for allowed origins`);
});

// Graceful shutdown for production
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
