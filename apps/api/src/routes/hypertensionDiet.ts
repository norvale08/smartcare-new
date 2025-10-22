import { Router, Response, NextFunction } from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { generateDietRecommendations } from "../services/HypertensionAI";

const router = Router();

router.get(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.userId;
      const result = await generateDietRecommendations(userId);

      // Wrap the result in a data property to match expected format
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
