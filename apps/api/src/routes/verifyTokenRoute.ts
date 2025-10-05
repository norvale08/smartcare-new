import express from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

/**
 * Validate a JWT token.
 * If valid, respond with user info.
 * If invalid, it will be blocked by the verifyToken middleware.
 */
router.get("/", verifyToken, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    message: "Token valid",
    user: req.user,
  });
});

export default router;
