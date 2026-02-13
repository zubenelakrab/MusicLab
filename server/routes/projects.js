import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as store from '../db/store.js';

const router = Router();
const COLLECTION = 'projects';

router.get('/', (req, res) => {
  const projects = store.getAll(COLLECTION);
  res.json(projects);
});

router.get('/:id', (req, res) => {
  const project = store.getById(COLLECTION, req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

router.post('/', (req, res) => {
  const { name, bpm, tracks } = req.body;

  // Validate input
  if (name !== undefined && (typeof name !== 'string' || name.length > 200)) {
    return res.status(400).json({ error: 'name must be a string (max 200 chars)' });
  }
  if (bpm !== undefined && (typeof bpm !== 'number' || bpm < 20 || bpm > 400)) {
    return res.status(400).json({ error: 'bpm must be a number between 20 and 400' });
  }
  if (tracks !== undefined && !Array.isArray(tracks)) {
    return res.status(400).json({ error: 'tracks must be an array' });
  }

  const project = {
    id: uuidv4(),
    name: name || 'Untitled Project',
    bpm: bpm || 120,
    tracks: tracks || [],
    createdAt: Date.now()
  };
  store.create(COLLECTION, project);
  res.status(201).json(project);
});

router.put('/:id', (req, res) => {
  const body = req.body;

  // Validate body is an object
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  // Cannot change id
  if (body.id !== undefined && body.id !== req.params.id) {
    return res.status(400).json({ error: 'Cannot change id' });
  }

  const updated = store.update(COLLECTION, req.params.id, body);
  if (!updated) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(COLLECTION, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(204).send();
});

export default router;
