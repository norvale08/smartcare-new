import express from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();


router.get("/", verifyToken, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    message: "Token valid",
    user: req.user,
  });
});

export default router;
