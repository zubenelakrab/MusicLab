import express from 'express';
import cors from 'cors';
import patternsRouter from './routes/patterns.js';
import projectsRouter from './routes/projects.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/patterns', patternsRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`MusicLab server running on http://localhost:${PORT}`);
});
