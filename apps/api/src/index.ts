// FILE: apps/api/src/index.ts
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
import sendEmailRouter from './routes/send-email';
import adminDoctorsRoutes from './routes/adminDoctors';
import adminPatientsRoutes from './routes/adminPatients';
import adminDoctorAssignmentsRouter from './routes/admin/doctorAssignments';

dotenv.config();

console.log('🔧 Initializing SmartCare API...');
console.log('📍 PORT from env:', process.env.PORT || 'NOT SET (will use 10000)');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔗 MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✓' : 'NOT SET ✗');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗');
console.log('🔑 SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET ✓' : 'NOT SET ✗');

const app = express();

// Enable garbage collection in production
if (process.env.NODE_ENV === 'production' && global.gc) {
  setInterval(() => {
    if (global.gc) global.gc();
  }, 30000);
}

// Render uses port 10000 by default, fallback to 8000 for local
const PORT = parseInt(process.env.PORT || '10000', 10);

// Define allowed origins including Vercel preview URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://smartcare-new-web.vercel.app',
  'https://smartcare-speech-service.onrender.com'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.WEB_APP_URL) {
  allowedOrigins.push(process.env.WEB_APP_URL);
}
if (process.env.PYTHON_SERVICE_URL){
  allowedOrigins.push(process.env.PYTHON_SERVICE_URL);
}

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/smartcare-new-[a-z0-9]+-894rispers-projects\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV !== 'production' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    console.log('⚠️  CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With'
  ],
  exposedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', cors());

// Reduce payload size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// SESSION SETUP
if (!process.env.SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not set!');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
    },
  })
);

// Health check endpoints FIRST
app.get('/', (_req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    message: 'SmartCare API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    }
  });
});

app.get('/health', (_req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    }
  });
});

console.log('📋 Registering routes...');

// Register all routes
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
app.use('/api/doctorDashboard', doctorDashboardRouter);
app.use("/api/verifyToken", verifyTokenRoute);
app.use("/api/diabeticFood", diabetesFoodRoute);
app.use('/api/admin/doctors', adminDoctorsRoutes); 
app.use('/api/admin/patients', adminPatientsRoutes); 
app.use('/api/admin/doctor-assignments', adminDoctorAssignmentsRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor/me', doctorMeRoutes);
app.use("/api/patients/search", patientSearchRoute);
app.use("/api/doctor/assign-patient", assignPatientRoute);
app.use('/api/patient', patientRequestsRoute);
app.use('/api/doctor', doctorRequestsRoute);
app.use('/api/doctor/manage', doctorManagementRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/patient/vitals', patientVitalsRouter);
app.use('/api/messages', messagesRouter);
app.use("/api", comprehensiveFeedbackRoutes);
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

console.log('✅ Routes registered');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

console.log(`🚀 Starting server on 0.0.0.0:${PORT}...`);

// Start server FIRST, then connect to MongoDB
const server = app.listen(PORT, "0.0.0.0", () => {
  const memUsage = process.memoryUsage();
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for allowed origins`);
  console.log(`💾 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.rss / 1024 / 1024)}MB RSS`);
  
  // Connect to MongoDB AFTER server starts
  connectMongoDB()
    .then(() => {
      console.log('✅ MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err);
      console.log('⚠️  Server running without database connection');
    });
});

// Handle server errors
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;