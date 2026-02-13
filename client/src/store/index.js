import { create } from 'zustand';
import { generateId, generateTrackId, generateClipId } from '../utils/id';
import { createUndoMiddleware } from './undoMiddleware';

// Default parameters for a layer
const defaultLayerParams = {
  // Mixer
  gain: 0.8,
  cutoff: 8000,
  resonance: 0,
  speed: 1,
  pan: 0,
  // Effects
  reverb: 0,
  reverbSize: 2,
  delay: 0,
  delayTime: 0.25,
  delayFeedback: 0.3,
  distortion: 0,
  hpf: 0,
  phaser: 0,
  phaserDepth: 0.5,
};

// Create a new layer
const createLayer = (code = '', name = 'Layer') => ({
  id: generateId(),
  name,
  code,
  muted: false,
  solo: false,
  params: { ...defaultLayerParams },
});

// Default track colors
const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

// Create a new arrangement track
const createTrack = (name = 'Track', colorIndex = 0) => ({
  id: generateTrackId(),
  name,
  color: TRACK_COLORS[colorIndex % TRACK_COLORS.length],
  muted: false,
  solo: false,
  height: 100,
  params: { ...defaultLayerParams },
  clips: [],
});

// Create a new clip
const createClip = (startBar, durationBars, patternId = null, name = 'Clip', color = '#00d4aa', code = '') => ({
  id: generateClipId(),
  patternId,
  name,
  startBar,
  durationBars,
  color,
  layers: patternId ? null : [createLayer(code, 'Layer 1')],
});

// Create initial arrangement with example clips
const createInitialArrangement = () => {
  const drumsTrack = {
    id: generateTrackId(),
    name: 'Drums',
    color: TRACK_COLORS[0],
    muted: false,
    solo: false,
    height: 100,
    params: { ...defaultLayerParams },
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Beat 1',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd sd bd sd', 'Drums')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Beat 2',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd*2 sd hh*4', 'Drums')],
      },
    ],
  };

  const bassTrack = {
    id: generateTrackId(),
    name: 'Bass',
    color: TRACK_COLORS[1],
    muted: false,
    solo: false,
    height: 100,
    params: { ...defaultLayerParams },
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Bass Line',
        startBar: 0,
        durationBars: 8,
        color: TRACK_COLORS[1],
        layers: [createLayer('bass bass:2 bass:3 bass', 'Bass')],
      },
    ],
  };

  return {
    id: null,
    name: 'Untitled',
    lengthBars: 32,
    tracks: [drumsTrack, bassTrack],
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 8,
  };
};

export const useStore = create(createUndoMiddleware((set, get) => ({
  // Transport state
  isPlaying: false,
  bpm: 120,

  // Default params for patterns
  defaultParams: defaultLayerParams,

  // Current pattern being edited (now with layers)
  currentPattern: {
    id: null,
    name: 'Untitled',
    layers: [
      createLayer('bd sd', 'Drums'),
    ],
    // Global params (for backward compatibility)
    params: { ...defaultLayerParams },
  },

  // Currently selected layer index
  selectedLayerIndex: 0,

  // Pattern library
  patterns: [],

  // Project state
  currentProject: null,
  tracks: [],

  // Arrangement state (DAW-style timeline)
  arrangement: createInitialArrangement(),

  // Playhead position in bars (fractional)
  playheadPosition: 0,

  // Arrangement view settings
  arrangementView: {
    zoom: 1,              // 0.25 - 4
    scrollX: 0,
    pixelsPerBar: 100,
    snapToGrid: true,
    gridSubdivision: 4,   // 4 = quarter notes
    selectedClipIds: [],
    selectedTrackId: null,
  },

  // Currently editing clip (for code editor)
  editingClip: null, // { trackId, clipId }

  // Actions
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBpm: (bpm) => set({ bpm }),

  // Pattern actions
  setCurrentPattern: (pattern) => {
    // Convert old format (single code) to new format (layers)
    if (pattern.code && !pattern.layers) {
      pattern = {
        ...pattern,
        layers: [createLayer(pattern.code, 'Main')],
      };
    }
    set({
      currentPattern: {
        ...pattern,
        params: { ...defaultLayerParams, ...(pattern.params || {}) },
        layers: pattern.layers || [createLayer('', 'Layer 1')],
      },
      selectedLayerIndex: 0,
    });
  },

  // Legacy: update combined code (for compatibility)
  updatePatternCode: (code) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[state.selectedLayerIndex]) {
      layers[state.selectedLayerIndex] = {
        ...layers[state.selectedLayerIndex],
        code,
      };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  // Legacy: update global params
  updatePatternParams: (params) => set((state) => ({
    currentPattern: {
      ...state.currentPattern,
      params: { ...state.currentPattern.params, ...params }
    }
  })),

  // Layer actions
  selectLayer: (index) => set({ selectedLayerIndex: index }),

  addLayer: (code = '', name = '') => set((state) => {
    const layerNum = state.currentPattern.layers.length + 1;
    const newLayer = createLayer(code, name || `Layer ${layerNum}`);
    return {
      currentPattern: {
        ...state.currentPattern,
        layers: [...state.currentPattern.layers, newLayer],
      },
      selectedLayerIndex: state.currentPattern.layers.length,
    };
  }),

  removeLayer: (index) => set((state) => {
    if (state.currentPattern.layers.length <= 1) return state;
    const layers = state.currentPattern.layers.filter((_, i) => i !== index);
    return {
      currentPattern: { ...state.currentPattern, layers },
      selectedLayerIndex: Math.min(state.selectedLayerIndex, layers.length - 1),
    };
  }),

  updateLayer: (index, updates) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[index]) {
      layers[index] = { ...layers[index], ...updates };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  updateLayerCode: (index, code) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[index]) {
      layers[index] = { ...layers[index], code };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  updateLayerParams: (index, params) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[index]) {
      layers[index] = {
        ...layers[index],
        params: { ...layers[index].params, ...params }
      };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  toggleLayerMute: (index) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[index]) {
      layers[index] = { ...layers[index], muted: !layers[index].muted };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  toggleLayerSolo: (index) => set((state) => {
    const layers = [...state.currentPattern.layers];
    if (layers[index]) {
      layers[index] = { ...layers[index], solo: !layers[index].solo };
    }
    return {
      currentPattern: { ...state.currentPattern, layers }
    };
  }),

  // Get combined code from all layers (for the engine)
  getCombinedCode: () => {
    const state = get();
    const { layers } = state.currentPattern;

    // Check if any layer is soloed
    const hasSolo = layers.some(l => l.solo);

    // Filter active layers
    const activeLayers = layers.filter(layer => {
      if (hasSolo) return layer.solo && !layer.muted;
      return !layer.muted && layer.code.trim();
    });

    if (activeLayers.length === 0) return '';
    if (activeLayers.length === 1) return activeLayers[0].code;

    // Combine with stack (parallel execution)
    return activeLayers.map(l => l.code).join(', ');
  },

  // Get layers with their params for the engine
  getActiveLayers: () => {
    const state = get();
    const { layers } = state.currentPattern;

    const hasSolo = layers.some(l => l.solo);

    return layers.filter(layer => {
      if (hasSolo) return layer.solo && !layer.muted;
      return !layer.muted && layer.code.trim();
    });
  },

  setPatterns: (patterns) => set({ patterns }),
  addPattern: (pattern) => set((state) => ({
    patterns: [...state.patterns, pattern]
  })),

  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track]
  })),
  updateTrack: (id, updates) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  // ==========================================
  // Arrangement Track Actions
  // ==========================================

  addArrangementTrack: (name) => set((state) => {
    const trackCount = state.arrangement.tracks.length;
    const newTrack = createTrack(name || `Track ${trackCount + 1}`, trackCount);
    return {
      arrangement: {
        ...state.arrangement,
        tracks: [...state.arrangement.tracks, newTrack],
      },
    };
  }),

  removeArrangementTrack: (trackId) => set((state) => {
    if (state.arrangement.tracks.length <= 1) return state;
    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.filter(t => t.id !== trackId),
      },
      arrangementView: {
        ...state.arrangementView,
        selectedTrackId: state.arrangementView.selectedTrackId === trackId
          ? null
          : state.arrangementView.selectedTrackId,
      },
    };
  }),

  updateArrangementTrack: (trackId, updates) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    },
  })),

  toggleArrangementTrackMute: (trackId) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    },
  })),

  toggleArrangementTrackSolo: (trackId) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    },
  })),

  updateArrangementTrackParams: (trackId, params) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId ? { ...t, params: { ...t.params, ...params } } : t
      ),
    },
  })),

  reorderArrangementTracks: (fromIndex, toIndex) => set((state) => {
    const tracks = [...state.arrangement.tracks];
    const [removed] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, removed);
    return {
      arrangement: { ...state.arrangement, tracks },
    };
  }),

  // ==========================================
  // Clip Actions
  // ==========================================

  addClip: (trackId, startBar, durationBars, patternId = null, name = 'Clip') => set((state) => {
    const track = state.arrangement.tracks.find(t => t.id === trackId);
    if (!track) return state;

    const newClip = createClip(startBar, durationBars, patternId, name, track.color);

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
      },
    };
  }),

  removeClip: (trackId, clipId) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter(c => c.id !== clipId) }
          : t
      ),
    },
    arrangementView: {
      ...state.arrangementView,
      selectedClipIds: state.arrangementView.selectedClipIds.filter(id => id !== clipId),
    },
  })),

  updateClip: (trackId, clipId, updates) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map(c =>
                c.id === clipId ? { ...c, ...updates } : c
              ),
            }
          : t
      ),
    },
  })),

  moveClip: (fromTrackId, toTrackId, clipId, newStartBar) => set((state) => {
    // Find the clip
    const fromTrack = state.arrangement.tracks.find(t => t.id === fromTrackId);
    if (!fromTrack) return state;

    const clip = fromTrack.clips.find(c => c.id === clipId);
    if (!clip) return state;

    // Snap to grid if enabled
    const { snapToGrid, gridSubdivision } = state.arrangementView;
    const snappedBar = snapToGrid
      ? Math.round(newStartBar * gridSubdivision) / gridSubdivision
      : newStartBar;

    // Update clip position
    const updatedClip = { ...clip, startBar: Math.max(0, snappedBar) };

    if (fromTrackId === toTrackId) {
      // Same track - just update position
      return {
        arrangement: {
          ...state.arrangement,
          tracks: state.arrangement.tracks.map(t =>
            t.id === fromTrackId
              ? {
                  ...t,
                  clips: t.clips.map(c =>
                    c.id === clipId ? updatedClip : c
                  ),
                }
              : t
          ),
        },
      };
    } else {
      // Different track - remove from source, add to target
      const toTrack = state.arrangement.tracks.find(t => t.id === toTrackId);
      if (!toTrack) return state;

      // Update color to match new track
      updatedClip.color = toTrack.color;

      return {
        arrangement: {
          ...state.arrangement,
          tracks: state.arrangement.tracks.map(t => {
            if (t.id === fromTrackId) {
              return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
            }
            if (t.id === toTrackId) {
              return { ...t, clips: [...t.clips, updatedClip] };
            }
            return t;
          }),
        },
      };
    }
  }),

  resizeClip: (trackId, clipId, newDurationBars) => set((state) => {
    const { snapToGrid, gridSubdivision } = state.arrangementView;
    const snappedDuration = snapToGrid
      ? Math.max(1 / gridSubdivision, Math.round(newDurationBars * gridSubdivision) / gridSubdivision)
      : Math.max(0.25, newDurationBars);

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map(c =>
                  c.id === clipId ? { ...c, durationBars: snappedDuration } : c
                ),
              }
            : t
        ),
      },
    };
  }),

  duplicateClip: (trackId, clipId) => set((state) => {
    const track = state.arrangement.tracks.find(t => t.id === trackId);
    if (!track) return state;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return state;

    // Place duplicate right after original
    const newClip = createClip(
      clip.startBar + clip.durationBars,
      clip.durationBars,
      clip.patternId,
      `${clip.name} (copy)`,
      clip.color
    );
    if (clip.layers) {
      newClip.layers = JSON.parse(JSON.stringify(clip.layers));
    }

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
      },
      arrangementView: {
        ...state.arrangementView,
        selectedClipIds: [newClip.id],
      },
    };
  }),

  createClipFromPattern: (trackId, patternId, startBar, durationBars = 4) => set((state) => {
    const track = state.arrangement.tracks.find(t => t.id === trackId);
    if (!track) return state;

    const pattern = state.patterns.find(p => p.id === patternId);
    const name = pattern?.name || 'Pattern Clip';

    const newClip = createClip(startBar, durationBars, patternId, name, track.color);

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
      },
    };
  }),

  createInlineClip: (trackId, startBar, durationBars = 4) => set((state) => {
    const track = state.arrangement.tracks.find(t => t.id === trackId);
    if (!track) return state;

    const clipNum = track.clips.length + 1;
    const newClip = createClip(startBar, durationBars, null, `Clip ${clipNum}`, track.color);

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        ),
      },
      arrangementView: {
        ...state.arrangementView,
        selectedClipIds: [newClip.id],
      },
    };
  }),

  // Update inline clip layers
  updateClipLayers: (trackId, clipId, layers) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      tracks: state.arrangement.tracks.map(t =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map(c =>
                c.id === clipId ? { ...c, layers } : c
              ),
            }
          : t
      ),
    },
  })),

  // ==========================================
  // Arrangement View Actions
  // ==========================================

  setArrangementZoom: (zoom) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      zoom: Math.max(0.25, Math.min(4, zoom)),
    },
  })),

  setArrangementScrollX: (scrollX) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      scrollX: Math.max(0, scrollX),
    },
  })),

  setPlayheadPosition: (bars) => set({ playheadPosition: Math.max(0, bars) }),

  selectClip: (clipId, addToSelection = false) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      selectedClipIds: addToSelection
        ? state.arrangementView.selectedClipIds.includes(clipId)
          ? state.arrangementView.selectedClipIds.filter(id => id !== clipId)
          : [...state.arrangementView.selectedClipIds, clipId]
        : [clipId],
    },
  })),

  selectTrack: (trackId) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      selectedTrackId: trackId,
    },
  })),

  clearSelection: () => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      selectedClipIds: [],
      selectedTrackId: null,
    },
    editingClip: null,
  })),

  // Set clip for editing in code editor
  setEditingClip: (trackId, clipId) => set({ editingClip: { trackId, clipId } }),

  clearEditingClip: () => set({ editingClip: null }),

  // Get the clip being edited
  getEditingClipCode: () => {
    const state = get();
    if (!state.editingClip) return '';
    const { trackId, clipId } = state.editingClip;
    const track = state.arrangement.tracks.find(t => t.id === trackId);
    if (!track) return '';
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip || !clip.layers || !clip.layers[0]) return '';
    return clip.layers[0].code || '';
  },

  // Update the editing clip's code
  updateEditingClipCode: (code) => set((state) => {
    if (!state.editingClip) return state;
    const { trackId, clipId } = state.editingClip;

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(t =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map(c =>
                  c.id === clipId
                    ? {
                        ...c,
                        layers: c.layers?.map((layer, i) =>
                          i === 0 ? { ...layer, code } : layer
                        ) || [{ id: 'layer-new', code, muted: false, solo: false, params: {} }],
                      }
                    : c
                ),
              }
            : t
        ),
      },
    };
  }),

  setSnapToGrid: (enabled) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      snapToGrid: enabled,
    },
  })),

  setGridSubdivision: (subdivision) => set((state) => ({
    arrangementView: {
      ...state.arrangementView,
      gridSubdivision: subdivision,
    },
  })),

  // ==========================================
  // Arrangement Global Actions
  // ==========================================

  setArrangementLength: (bars) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      lengthBars: Math.max(4, bars),
    },
  })),

  toggleLoop: () => set((state) => ({
    arrangement: {
      ...state.arrangement,
      loopEnabled: !state.arrangement.loopEnabled,
    },
    // Reset playhead to loop start when enabling loop
    playheadPosition: !state.arrangement.loopEnabled ? state.arrangement.loopStart : state.playheadPosition,
  })),

  setLoopRange: (start, end) => set((state) => ({
    arrangement: {
      ...state.arrangement,
      loopStart: Math.max(0, start),
      loopEnd: Math.max(start + 1, end),
    },
  })),

  // Delete selected clips
  deleteSelectedClips: () => set((state) => {
    const { selectedClipIds } = state.arrangementView;
    if (selectedClipIds.length === 0) return state;

    return {
      arrangement: {
        ...state.arrangement,
        tracks: state.arrangement.tracks.map(track => ({
          ...track,
          clips: track.clips.filter(clip => !selectedClipIds.includes(clip.id)),
        })),
      },
      arrangementView: {
        ...state.arrangementView,
        selectedClipIds: [],
      },
    };
  }),

  // Get all active tracks (respecting mute/solo)
  getActiveArrangementTracks: () => {
    const state = get();
    const { tracks } = state.arrangement;

    const hasSolo = tracks.some(t => t.solo);

    return tracks.filter(track => {
      if (hasSolo) return track.solo && !track.muted;
      return !track.muted;
    });
  },

  // Find clip by ID across all tracks
  findClip: (clipId) => {
    const state = get();
    for (const track of state.arrangement.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) return { track, clip };
    }
    return null;
  },
})));
