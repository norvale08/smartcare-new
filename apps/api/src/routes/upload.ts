import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { UploadApiOptions } from "cloudinary";
import cloudinary from "../lib/cloudinary";

const router = express.Router();

// ✅ Properly typed storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file): Promise<UploadApiOptions> => ({
    folder: "profile_pictures",
    allowed_formats: ["jpg", "jpeg", "png"],
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
  }),
});

const upload = multer({ storage });

// ✅ Upload endpoint
router.post("/", upload.single("picture"), (req, res) => {
  try {
    const file = req.file as Express.Multer.File & { path?: string };
    res.status(200).json({ url: file?.path });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
