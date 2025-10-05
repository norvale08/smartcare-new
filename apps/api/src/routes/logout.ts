import express from "express";

const router = express.Router();

// Destroy session and clear JWT cookie (if using one)
router.post("/", async (req, res) => {
  try {
    // Destroy session if exists
    if (req.session) {
      req.session.destroy(() => {});
    }

    // Clear token cookie (in case you used cookies)
    res.clearCookie("token");

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
});

export default router;
