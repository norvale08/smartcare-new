// apps/backend/src/routes/location.ts
import express, { Request, Response } from 'express';

const router = express.Router();

interface LocationRequest {
  user: {
    name: string;
    phone: string;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
  };
  hospital: {
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
    };
    vicinity: string;
  };
  emergency: boolean;
}

// POST endpoint to receive location data
router.post('/send-location', async (req: Request, res: Response) => {
  try {
    const locationData: LocationRequest = req.body;

    // Validate required fields
    if (!locationData.user || !locationData.hospital) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

   


    return res.status(200).json({
      success: true,
      message: 'Location received successfully',
      data: {
        userId: locationData.user.name,
        hospitalName: locationData.hospital.name,
        emergency: locationData.emergency
      }
    });
  } catch (error) {
    console.error('Error processing location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET endpoint to retrieve patient locations (for hospital dashboard)
router.get('/patient-locations', async (req: Request, res: Response) => {
  try {
    
    return res.status(200).json({
      success: true,
      data: [] // Return your database results here
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;