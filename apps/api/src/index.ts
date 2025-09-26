//index.ts
import express from 'express';
import cors from 'cors'; // ✅ ADD THIS IMPORT
import session from "express-session";
import dotenv from "dotenv";
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
import doctorsRoutes from "./routes/doctors";
import logoutRoute from './routes/logout';
/* import messagesRouter from './routes/messages'; */
import doctorDashboardRouter from './routes/doctorDashboardRoutes';




dotenv.config();

const app = express();

// ✅ CRITICAL: Convert PORT to number for app.listen()
const PORT = parseInt(process.env.PORT || '8000', 10);

// ✅ CORS CONFIGURATION - MUST BE BEFORE OTHER MIDDLEWARE
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://smartcare-new-web.vercel.app', // ✅ Your Vercel URL
];

// Add FRONTEND_URL from environment if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// ✅ SESSION SETUP
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

// ✅ Health check endpoints for Render
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

// ✅ ROUTES
app.use('/api/auth', authRoute);
app.use('/api/login', loginRoute);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/profile', profileRoutes);
app.use("/api/upload", uploadRoute);
app.use('/api/diabetesVitals', diabetesRoutes);
app.use('/api/hypertensionVitals', hypertensionRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/userStatus', userStatusRouter);
app.use ('/api/doctors',doctorsRoutes)
app.use('/api/logout', logoutRoute);
/* app.use('/api/messages', messagesRouter); */
app.use('/api/doctorDashboard', doctorDashboardRouter);



// 404 handler
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

// ✅ CRITICAL: Bind to 0.0.0.0 for Render deployment
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for allowed origins`);
});

// ✅ Graceful shutdown for production
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;