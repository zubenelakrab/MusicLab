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
  const updated = store.update(COLLECTION, req.params.id, req.body);
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
