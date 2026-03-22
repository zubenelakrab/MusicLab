import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hydrateStoredProject,
  toCanonicalProject,
  validateProjectPayload,
} from '../server/lib/projectPayload.js';

test('validateProjectPayload rejects malformed arrangement payloads', () => {
  const invalid = validateProjectPayload({
    name: 'Broken',
    bpm: 120,
    arrangement: {
      lengthBars: 0,
      groove: { swing: 200 },
    },
  });

  assert.equal(invalid.valid, false);
  assert.match(invalid.errors[0], /lengthBars|groove\.swing/);
});

test('toCanonicalProject stores tracks inside arrangement and clamps loop end', () => {
  const project = toCanonicalProject({
    name: 'Session',
    bpm: 124,
    tracks: [{ id: 'track-1', name: 'Drums', clips: [] }],
    arrangement: {
      lengthBars: 32,
      loopEnabled: true,
      loopStart: 12,
      loopEnd: 10,
      groove: { swing: 15, humanize: 4 },
    },
  }, { id: 'project-1', createdAt: 1000 });

  assert.equal(project.id, 'project-1');
  assert.equal(project.arrangement.tracks.length, 1);
  assert.equal(project.arrangement.loopEnd, 13);
  assert.deepEqual(project.arrangement.groove, { swing: 15, humanize: 4 });
});

test('hydrateStoredProject upgrades legacy stored records', () => {
  const hydrated = hydrateStoredProject({
    id: 'legacy-1',
    name: 'Legacy',
    bpm: 100,
    tracks: [{ id: 'track-1', name: 'Bass', clips: [] }],
    groove: { swing: 8, humanize: 2 },
    createdAt: 10,
  });

  assert.equal(hydrated.arrangement.tracks.length, 1);
  assert.deepEqual(hydrated.arrangement.groove, { swing: 8, humanize: 2 });
  assert.equal(hydrated.version, '2.1');
});
