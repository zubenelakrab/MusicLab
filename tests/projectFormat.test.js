import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertLegacyLayerProject,
  createProjectDocument,
  PROJECT_VERSION,
} from '../client/src/project/projectFormat.js';

test('createProjectDocument serializes arrangement metadata and tracks', () => {
  const arrangement = {
    id: 'project-1',
    name: 'Demo',
    lengthBars: 64,
    loopEnabled: true,
    loopStart: 8,
    loopEnd: 16,
    groove: { swing: 22, humanize: 9 },
    tracks: [{
      id: 'track-1',
      name: 'Drums',
      color: '#00d4aa',
      muted: false,
      solo: false,
      height: 120,
      params: { gain: 0.8, pan: 0, cutoff: 8000 },
      groove: { swing: 11, humanize: 4 },
      automation: {
        gain: { enabled: true, min: 0, max: 1, points: [{ bar: 0, value: 0.8 }] },
      },
      clips: [{
        id: 'clip-1',
        patternId: null,
        name: 'Intro',
        startBar: 0,
        durationBars: 4,
        color: '#00d4aa',
        layers: [{ id: 'layer-1', name: 'Main', code: 'bd sd', muted: false, solo: false }],
      }],
    }],
  };

  const project = createProjectDocument(arrangement, 128, { exportedAt: true, includeId: true });

  assert.equal(project.version, PROJECT_VERSION);
  assert.equal(project.id, 'project-1');
  assert.equal(project.bpm, 128);
  assert.deepEqual(project.arrangement.groove, { swing: 22, humanize: 9 });
  assert.deepEqual(project.arrangement.tracks[0].groove, { swing: 11, humanize: 4 });
  assert.equal(project.arrangement.tracks[0].automation.gain.enabled, true);
  assert.match(project.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('convertLegacyLayerProject upgrades layer projects to arrangement schema', () => {
  const legacy = {
    name: 'Legacy Jam',
    bpm: 90,
    layers: [{
      name: 'Bass',
      code: 'bass ~ bass',
      params: { gain: 0.65, pan: -0.25, cutoff: 3200 },
    }],
  };

  const project = convertLegacyLayerProject(legacy);

  assert.equal(project.version, PROJECT_VERSION);
  assert.equal(project.arrangement.tracks.length, 1);
  assert.equal(project.arrangement.tracks[0].clips.length, 1);
  assert.deepEqual(project.arrangement.groove, { swing: 0, humanize: 0 });
  assert.deepEqual(project.arrangement.tracks[0].groove, { swing: 0, humanize: 0 });
  assert.equal(project.arrangement.tracks[0].automation.gain.points[0].value, 0.65);
  assert.equal(project.arrangement.tracks[0].automation.pan.points[0].value, -0.25);
  assert.equal(project.arrangement.tracks[0].automation.cutoff.points[0].value, 3200);
});
