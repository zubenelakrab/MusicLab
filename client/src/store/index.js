import { create } from 'zustand';

// Generate unique IDs
const generateId = () => `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

export const useStore = create((set, get) => ({
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
}));
