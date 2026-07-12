import { readFile, writeFile, access, rename } from 'fs/promises';
import { constants } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const collectionLocks = new Map();

function getFilePath(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readCollection(collection) {
  const filePath = getFilePath(collection);
  if (!(await exists(filePath))) {
    return [];
  }
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error parsing ${collection}.json:`, err);
    throw new Error(`Failed to read ${collection} collection`);
  }
}

function withCollectionLock(collection, task) {
  const previous = collectionLocks.get(collection) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(task);

  collectionLocks.set(collection, next);
  return next.finally(() => {
    if (collectionLocks.get(collection) === next) {
      collectionLocks.delete(collection);
    }
  });
}

async function writeCollection(collection, data) {
  const filePath = getFilePath(collection);
  // Write to a temp file then atomically rename so a crash mid-write can't
  // leave a truncated/corrupt JSON file.
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    await writeFile(tmpPath, JSON.stringify(data, null, 2));
    await rename(tmpPath, filePath);
  } catch (err) {
    console.error(`Error writing ${collection}.json:`, err);
    throw new Error(`Failed to write ${collection} collection`);
  }
}

export async function getAll(collection) {
  return readCollection(collection);
}

export async function getById(collection, id) {
  const items = await readCollection(collection);
  return items.find(item => item.id === id);
}

export async function create(collection, item) {
  return withCollectionLock(collection, async () => {
    const items = await readCollection(collection);
    items.push(item);
    await writeCollection(collection, items);
    return item;
  });
}

export async function update(collection, id, updates) {
  return withCollectionLock(collection, async () => {
    const items = await readCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    await writeCollection(collection, items);
    return items[index];
  });
}

export async function remove(collection, id) {
  return withCollectionLock(collection, async () => {
    const items = await readCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    await writeCollection(collection, items);
    return true;
  });
}
