const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true }, // Path to the uploaded image
    description: { type: String, required: true },
    technologiesUsed: { type: String, required: true },
});

module.exports = mongoose.model('Project', projectSchema);
