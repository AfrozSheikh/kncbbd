// app.js (main server)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const projectRoutes = require('./routes/projectRoutes'); // your existing
const youtubeRoutes = require('./routes/youtubeRoutes'); // new

const app = express();
const __dirname = path.resolve();

app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Static (if you have build from React)
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/youtube', youtubeRoutes);

// Serve React app for all other routes (use regex to avoid interfering with API)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// DB connect (existing)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Mongo connection error:', err);
    // decide: do not crash immediately in dev, but in prod you might want process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
