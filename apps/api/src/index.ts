import express from 'express';
import session from "express-session";
import { connectMongoDB } from './lib/mongodb';
import dotenv from "dotenv";
import authRoute from "./routes/auth";
import loginRoute from './routes/login';
import emergencyRoutes from './routes/emergency';
import diabetesRoutes from "./routes/diabetesVitals";
import userStatusRouter from './routes/userStatus';
import profileRoutes from './routes/patient';
import uploadRoute from "./routes/upload";
import hypertensionRoutes from './routes/hypertensionVitals';
import medicationsRoutes from './routes/medications';

dotenv.config();

const app = express();

// ✅ CRITICAL: Convert PORT to number for app.listen()
const PORT = parseInt(process.env.PORT || '3001', 10);

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

// ✅ CORS HEADERS - Updated for production
app.use((req, res, next) => {
  // Allow multiple origins for development and production
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-frontend-domain.com', // Replace with your actual frontend domain
    process.env.FRONTEND_URL // Set this in Render environment variables
  ].filter(Boolean); // Remove undefined values
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.sendStatus(200);
    return;
  }

  console.log(`${req.method} ${req.path} from origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());

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