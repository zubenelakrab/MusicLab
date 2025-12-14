import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

function getFilePath(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const filePath = getFilePath(collection);
  if (!existsSync(filePath)) {
    return [];
  }
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeCollection(collection, data) {
  const filePath = getFilePath(collection);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function getAll(collection) {
  return readCollection(collection);
}

export function getById(collection, id) {
  const items = readCollection(collection);
  return items.find(item => item.id === id);
}

export function create(collection, item) {
  const items = readCollection(collection);
  items.push(item);
  writeCollection(collection, items);
  return item;
}

export function update(collection, id, updates) {
  const items = readCollection(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  writeCollection(collection, items);
  return items[index];
}

export function remove(collection, id) {
  const items = readCollection(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  writeCollection(collection, items);
  return true;
}
