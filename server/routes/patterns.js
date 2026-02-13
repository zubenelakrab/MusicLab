import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as store from '../db/store.js';

const router = Router();
const COLLECTION = 'patterns';

router.get('/', (req, res) => {
  const patterns = store.getAll(COLLECTION);
  res.json(patterns);
});

router.get('/:id', (req, res) => {
  const pattern = store.getById(COLLECTION, req.params.id);
  if (!pattern) {
    return res.status(404).json({ error: 'Pattern not found' });
  }
  res.json(pattern);
});

router.post('/', (req, res) => {
  const { name, code, params, tags } = req.body;

  // Validate input
  if (name !== undefined && (typeof name !== 'string' || name.length > 200)) {
    return res.status(400).json({ error: 'name must be a string (max 200 chars)' });
  }
  if (code !== undefined && (typeof code !== 'string' || code.length > 10000)) {
    return res.status(400).json({ error: 'code must be a string (max 10000 chars)' });
  }
  if (params !== undefined && (typeof params !== 'object' || params === null || Array.isArray(params))) {
    return res.status(400).json({ error: 'params must be an object' });
  }
  if (tags !== undefined && !Array.isArray(tags)) {
    return res.status(400).json({ error: 'tags must be an array' });
  }

  const pattern = {
    id: uuidv4(),
    name: name || 'Untitled',
    code: code || 'sound("bd")',
    params: params || { bpm: 120, gain: 0.8 },
    tags: tags || [],
    createdAt: Date.now()
  };
  store.create(COLLECTION, pattern);
  res.status(201).json(pattern);
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
    return res.status(404).json({ error: 'Pattern not found' });
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(COLLECTION, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Pattern not found' });
  }
  res.status(204).send();
});

export default router;
