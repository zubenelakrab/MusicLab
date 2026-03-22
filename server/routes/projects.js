import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as store from '../db/store.js';
import {
  hydrateStoredProject,
  toCanonicalProject,
  validateProjectPayload,
} from '../lib/projectPayload.js';

const router = Router();
const COLLECTION = 'projects';

function handleStoreError(res, err) {
  console.error('Projects store error:', err);
  return res.status(500).json({ error: 'Storage error' });
}

router.get('/', async (req, res) => {
  try {
    const projects = await store.getAll(COLLECTION);
    res.json(projects.map(hydrateStoredProject));
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await store.getById(COLLECTION, req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(hydrateStoredProject(project));
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.post('/', async (req, res) => {
  const validation = validateProjectPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  const project = toCanonicalProject(req.body, {
    id: uuidv4(),
    createdAt: Date.now(),
  });

  try {
    await store.create(COLLECTION, project);
    res.status(201).json(project);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const body = req.body;
  const validation = validateProjectPayload(body, { partial: true });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors[0] });
  }

  // Cannot change id
  if (body.id !== undefined && body.id !== req.params.id) {
    return res.status(400).json({ error: 'Cannot change id' });
  }

  try {
    const existing = await store.getById(COLLECTION, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await store.update(
      COLLECTION,
      req.params.id,
      toCanonicalProject(body, existing)
    );

    res.json(updated);
  } catch (err) {
    return handleStoreError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await store.remove(COLLECTION, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (err) {
    return handleStoreError(res, err);
  }
});

export default router;
