import express from 'express';
import session from "express-session" // ✅ ADD THIS
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

// ✅ CORS HEADERS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
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
const PORT = 3001;
connectMongoDB();

app.get('/', (_req, res) => {
  res.send('backend is running');
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

app.listen(PORT,"0.0.0.0" ,() => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for http://localhost:3000`);
});

export default app;
