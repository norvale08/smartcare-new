import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    isFirstLogin: boolean;
    profileCompleted: boolean;
    selectedDiseases: string[];
    patientProfileId: string;
    // Add other fields you expect from the JWT payload
    [key: string]: any;
  };
}

export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(403).json({ error: 'No token provided' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-default-secret';
    const decoded = jwt.verify(token, secret) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
