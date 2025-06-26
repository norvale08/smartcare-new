/*import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import 'dotenv/config';

const app = express();

// Winston Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// CORS Configuration
const CORS_APPS = [
  'http://localhost:3000',  // Next.js dev server
  'http://localhost:3001',  // Alternative port
  ...(process.env.WEB_APP_URL ? [process.env.WEB_APP_URL] : [])
].filter(Boolean);

// Middleware
app.use(helmet());
app.use(cors({
  origin: CORS_APPS,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint (excluded from global prefix)
app.get('/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API is running successfully'
  });
});

// Test endpoint for API connection
app.get('/', (req, res) => {
    res.json({ 
    message: 'Welcome to SmartCare API',
    version: '1.0.0',
    endpoints: {
      health: '/status',
      api: '/api/v1/*'
    }
  });

});

// Global prefix for API routes
app.use('/api/v1', (req, res, next) => {
  // Your future API routes will go here
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.info('Application started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/status`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/v1/test`);
});

export default app;*/