import { generateClipId, generateId, generateTrackId } from '../utils/id.js';
import {
  createDefaultTrackAutomation,
  defaultGroove,
  TRACK_COLORS,
} from '../store/arrangementModel.js';

export const PROJECT_VERSION = '2.1';

function serializeTrack(track) {
  return {
    id: track.id,
    name: track.name,
    color: track.color,
    muted: track.muted,
    solo: track.solo,
    height: track.height,
    params: track.params,
    groove: track.groove,
    automation: track.automation,
    clips: track.clips.map((clip) => ({
      id: clip.id,
      patternId: clip.patternId,
      name: clip.name,
      startBar: clip.startBar,
      durationBars: clip.durationBars,
      color: clip.color,
      layers: clip.layers,
    })),
  };
}

export function createProjectDocument(arrangement, bpm, options = {}) {
  const { exportedAt = false, includeId = false } = options;
  const document = {
    version: PROJECT_VERSION,
    name: arrangement.name || 'Untitled',
    bpm,
    arrangement: {
      lengthBars: arrangement.lengthBars,
      loopEnabled: arrangement.loopEnabled,
      loopStart: arrangement.loopStart,
      loopEnd: arrangement.loopEnd,
      groove: arrangement.groove,
      tracks: arrangement.tracks.map(serializeTrack),
    },
  };

  if (includeId && arrangement.id) {
    document.id = arrangement.id;
  }

  if (exportedAt) {
    document.exportedAt = new Date().toISOString();
  }

  return document;
}

export function isVersion2Project(version) {
  if (typeof version !== 'string') return false;
  return /^2(\.|$)/.test(version.trim());
}

export function convertLegacyLayerProject(composition) {
  const tracks = composition.layers.map((layer, index) => {
    const params = layer.params || { gain: 0.8, pan: 0, cutoff: 8000, resonance: 0, speed: 1 };
    return {
      id: generateTrackId(),
      name: layer.name || `Track ${index + 1}`,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      muted: layer.muted || false,
      solo: layer.solo || false,
      height: 100,
      params,
      groove: { ...defaultGroove },
      automation: createDefaultTrackAutomation(params),
      clips: [{
        id: generateClipId(),
        patternId: null,
        name: layer.name || `Clip ${index + 1}`,
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[index % TRACK_COLORS.length],
        layers: [{
          id: generateId(),
          name: layer.name || 'Layer 1',
          code: layer.code || '',
          muted: false,
          solo: false,
          params,
        }],
      }],
    };
  });

  return {
    version: PROJECT_VERSION,
    name: composition.name,
    bpm: composition.bpm,
    arrangement: {
      lengthBars: composition.lengthBars || 32,
      loopEnabled: composition.loopEnabled || false,
      loopStart: composition.loopStart || 0,
      loopEnd: composition.loopEnd || 8,
      groove: { ...defaultGroove },
      tracks,
    },
  };
}
