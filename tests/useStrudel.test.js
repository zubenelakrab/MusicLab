import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arrangementHasPlayableClips,
  getPlaybackStartBar,
} from '../client/src/hooks/strudelPlaybackUtils.js';

test('arrangementHasPlayableClips detects code in non-primary clip layers', () => {
  const arrangement = {
    tracks: [{
      id: 'track-1',
      muted: false,
      solo: false,
      clips: [{
        id: 'clip-1',
        layers: [
          { id: 'layer-1', code: '   ', muted: false, solo: false },
          { id: 'layer-2', code: 'bd sd', muted: false, solo: false },
        ],
      }],
    }],
  };

  assert.equal(arrangementHasPlayableClips(arrangement), true);
});

test('arrangementHasPlayableClips detects library-backed patterns', () => {
  const arrangement = {
    tracks: [{
      id: 'track-1',
      muted: false,
      solo: false,
      clips: [{
        id: 'clip-1',
        patternId: 'pattern-1',
        layers: [],
      }],
    }],
  };
  const patterns = [{
    id: 'pattern-1',
    code: 'note("c4 e4 g4").sound("juno")',
  }];

  assert.equal(arrangementHasPlayableClips(arrangement, patterns), true);
});

test('getPlaybackStartBar respects the active loop start', () => {
  assert.equal(getPlaybackStartBar({
    loopEnabled: true,
    loopStart: 8,
  }), 8);

  assert.equal(getPlaybackStartBar({
    loopEnabled: false,
    loopStart: 8,
  }), 0);
});
