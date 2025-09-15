import express from 'express';
import { connectMongoDB } from './lib/mongodb';
import cors from 'cors';
import dotenv from "dotenv"
import authRoute from "./routes/auth"
import loginRoute from './routes/login'
import emergencyRoutes from './routes/emergency';
import medicalRoutes from './routes/medical';
import analyzeRoute from './routes/analyze';
import vitalsRoute from './routes/vitals';

dotenv.config();

const app = express();

app.get('/favicon.ico', (_req, res) => res.status(204).end());


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

app.use(cors());
app.use(express.json());
const PORT = 3001;
connectMongoDB();

app.get('/', (_req, res) => {
  res.send('backend is running');
});

app.use('/api/auth', authRoute)
app.use('/api/login',loginRoute)
app.use('/api/emergency', emergencyRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/analyze', analyzeRoute);
app.use('/api/vitals', vitalsRoute);




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for http://localhost:3000`);
});

export default app;