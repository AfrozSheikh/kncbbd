// routes/projectRoutes.js  (ESM VERSION)

import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Project from "../models/Project.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper – Upload buffer to Cloudinary
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "kodenurons-collaborations",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Upload Project
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { title, description, technologiesUsed, password } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title & description are required" });
    }

    // 🔐 FIXED PASSWORD CHECK
    const isValid = process.env.PASSWORD_HASH
      ? bcrypt.compareSync(password, process.env.PASSWORD_HASH)
      : password === process.env.PASSWORD;

    if (!isValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer);

    // Store to MongoDB
    const project = new Project({
      title,
      image: uploadResult.secure_url,
      description,
      technologiesUsed: Array.isArray(technologiesUsed)
        ? technologiesUsed
        : technologiesUsed?.split(",").map((t) => t.trim()) || [],
    });

    await project.save();

    res
      .status(201)
      .json({ message: "Project uploaded successfully", project });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
