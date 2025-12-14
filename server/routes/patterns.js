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
  const updated = store.update(COLLECTION, req.params.id, req.body);
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
