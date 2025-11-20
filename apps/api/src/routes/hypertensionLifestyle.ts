import { Router, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { generateLifestyleRecommendations, updateLifestyle } from "../services/HypertensionAI"; 
// Import from the correct service file

const router = Router();

router.get(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.userId; // ✅ strongly typed now
      const result = await generateLifestyleRecommendations(userId);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/update",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.userId;
      const updates = req.body;

      const updatedLifestyle = await updateLifestyle(userId, updates);

      if (!updatedLifestyle) {
        return res
          .status(500)
          .json({ error: "Failed to update lifestyle" });
      }

      res.json(updatedLifestyle);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
