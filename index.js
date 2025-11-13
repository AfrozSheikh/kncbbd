// src/index.js
import 'dotenv/config'; // loads .env automatically
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// import routes (they must be ESM exports default)
import projectRoutes from './routes/projectRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Static build (if exists)
const buildPath = path.join(__dirname, '..', 'build'); // adjust if build at root/build
app.use(express.static(buildPath));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/youtube', youtubeRoutes);

// Fallback to React app (avoid if no frontend build)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Connect DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Mongo connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
