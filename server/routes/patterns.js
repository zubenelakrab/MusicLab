import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as store from '../db/store.js';

const router = Router();
const COLLECTION = 'patterns';

function handleStoreError(res, err) {
  console.error('Patterns store error:', err);
  return res.status(500).json({ error: 'Storage error' });
}

router.get('/', async (req, res) => {
  try {
    const patterns = await store.getAll(COLLECTION);
    res.json(patterns);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pattern = await store.getById(COLLECTION, req.params.id);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json(pattern);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.post('/', async (req, res) => {
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
  try {
    await store.create(COLLECTION, pattern);
    res.status(201).json(pattern);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const body = req.body;

  // Validate body is an object
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  // Cannot change id
  if (body.id !== undefined && body.id !== req.params.id) {
    return res.status(400).json({ error: 'Cannot change id' });
  }

  try {
    const updated = await store.update(COLLECTION, req.params.id, body);
    if (!updated) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json(updated);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await store.remove(COLLECTION, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.status(204).send();
  } catch (err) {
    return handleStoreError(res, err);
  }
});

export default router;
