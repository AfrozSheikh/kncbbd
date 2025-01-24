const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const Project = require('../models/Project');

const router = express.Router();

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a project
router.post('/upload', upload.single('image'), async (req, res) => {
    const { title, description, technologiesUsed, password } = req.body;

    // Check password
    const validPassword = bcrypt.compareSync(password, bcrypt.hashSync(process.env.PASSWORD, 10));
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload_stream(
            { folder: 'kodenurons-collaborations', resource_type: 'image' },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Error:', error);
                    return res.status(500).json({ error: 'Image upload failed' });
                }

                // Save the project to the database
                const project = new Project({
                    title,
                    image: result.secure_url, // Cloudinary URL
                    description,
                    technologiesUsed,
                });

                await project.save();
                res.status(201).json({ message: 'Project uploaded successfully', project });
            }
        );

        // Write the file buffer to the Cloudinary stream
        result.end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
