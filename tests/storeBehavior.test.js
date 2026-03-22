import test from 'node:test';
import assert from 'node:assert/strict';
import { useStore } from '../client/src/store/index.js';

function resetStoreState() {
  useStore.getState().resetProject();
  useStore.setState({
    isPlaying: false,
    playheadPosition: 0,
    arrangementView: {
      zoom: 1,
      scrollX: 0,
      pixelsPerBar: 100,
      snapToGrid: true,
      gridSubdivision: 4,
      selectedClipIds: [],
      selectedTrackId: null,
    },
    editingClip: null,
  });
}

test('loadProject resets arrangement view state and playhead', () => {
  resetStoreState();
  useStore.setState({
    playheadPosition: 12.5,
    arrangementView: {
      zoom: 3,
      scrollX: 640,
      pixelsPerBar: 100,
      snapToGrid: false,
      gridSubdivision: 8,
      selectedClipIds: ['clip-old'],
      selectedTrackId: 'track-old',
    },
    editingClip: { trackId: 'track-old', clipId: 'clip-old' },
  });

  useStore.getState().loadProject({
    id: 'project-1',
    name: 'Loaded',
    bpm: 128,
    arrangement: {
      lengthBars: 16,
      loopEnabled: true,
      loopStart: 4,
      loopEnd: 8,
      groove: { swing: 12, humanize: 3 },
      tracks: [],
    },
  });

  const state = useStore.getState();
  assert.equal(state.playheadPosition, 0);
  assert.equal(state.arrangementView.scrollX, 0);
  assert.equal(state.arrangementView.zoom, 1);
  assert.deepEqual(state.arrangementView.selectedClipIds, []);
  assert.equal(state.arrangementView.selectedTrackId, null);
  assert.equal(state.editingClip, null);
});

test('addPatternAsTrack uses store actions and updates arrangement metadata', () => {
  resetStoreState();
  const before = useStore.getState();
  const versionBefore = before._arrangementVersion;
  const trackCountBefore = before.arrangement.tracks.length;

  useStore.getState().addPatternAsTrack({
    id: 'pattern-1',
    name: 'Acid Line',
    code: 'note("c4 eb4 g4").sound("juno")',
    params: { gain: 0.7, pan: -0.1 },
  });

  const state = useStore.getState();
  const addedTrack = state.arrangement.tracks.at(-1);
  const addedClip = addedTrack.clips[0];

  assert.equal(state.arrangement.tracks.length, trackCountBefore + 1);
  assert.equal(addedTrack.name, 'Acid Line');
  assert.equal(addedClip.patternId, 'pattern-1');
  assert.equal(addedClip.layers[0].code, 'note("c4 eb4 g4").sound("juno")');
  assert.deepEqual(state.arrangementView.selectedClipIds, [addedClip.id]);
  assert.equal(state.arrangementView.selectedTrackId, addedTrack.id);
  assert.deepEqual(state.editingClip, { trackId: addedTrack.id, clipId: addedClip.id });
  assert.equal(state._arrangementVersion, versionBefore + 1);
});
