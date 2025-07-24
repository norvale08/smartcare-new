import express, { Response, Request } from 'express';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';

const router = express.Router();

router.get('/', verifyToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const {
    isFirstLogin,
    profileCompleted,
    selectedDiseases,
    patientProfileId
  } = user;

  res.status(200).json({
    message: 'User status fetched successfully',
    isFirstLogin,
    profileCompleted,
    selectedDiseases,
    patientProfileId
  });
});

export default router;