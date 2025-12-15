import { initAudioOnFirstClick, getAudioContext, webaudioRepl, samples } from '@strudel/webaudio';
import { mini } from '@strudel/mini';

let repl = null;
let audioInitialized = false;
let currentLayers = [];
let analyserNode = null;
let analyserConnected = false;
let interceptInstalled = false;

// Export getAudioContext for visualizer
export { getAudioContext };

// Install intercept to capture audio going to destination
function installDestinationIntercept() {
  if (interceptInstalled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create analyser node
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    analyserNode.minDecibels = -90;
    analyserNode.maxDecibels = -10;

    // Store original connect method
    const originalConnect = GainNode.prototype.connect;

    // Monkey-patch connect to intercept connections to destination
    GainNode.prototype.connect = function(destination, ...args) {
      // Check if connecting to the audio destination
      if (destination === ctx.destination && analyserNode) {
        console.log('[MusicLab] Intercepted connection to destination, routing through analyser');
        // Route through analyser instead
        originalConnect.call(this, analyserNode, ...args);
        if (!analyserConnected) {
          analyserNode.connect(ctx.destination);
          analyserConnected = true;
        }
        return destination;
      }
      // Normal connection
      return originalConnect.call(this, destination, ...args);
    };

    interceptInstalled = true;
    console.log('[MusicLab] Destination intercept installed');
  } catch (err) {
    console.warn('[MusicLab] Could not install intercept:', err);
  }
}

// Get or create analyser node for visualizer
export function getAnalyser() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    // Make sure intercept is installed
    if (!interceptInstalled) {
      installDestinationIntercept();
    }

    return analyserNode;
  } catch (err) {
    console.warn('[MusicLab] Could not get analyser:', err);
    return null;
  }
}

export async function initAudio() {
  if (audioInitialized) return true;

  try {
    // Wait for user click to initialize audio
    await initAudioOnFirstClick();

    // Install intercept AFTER audio context is created but BEFORE Strudel connects
    installDestinationIntercept();

    // Load default drum samples
    await samples('github:tidalcycles/dirt-samples');
    audioInitialized = true;
    console.log('[MusicLab] Audio initialized');
    return true;
  } catch (err) {
    console.error('[MusicLab] Failed to initialize audio:', err);
    return false;
  }
}

export function createRepl() {
  if (repl) return repl;

  repl = webaudioRepl({});

  console.log('[MusicLab] REPL created');
  return repl;
}

// Build a pattern from a single layer with its params
function buildLayerPattern(layer) {
  const { code, params } = layer;
  if (!code || !code.trim()) return null;

  try {
    let pattern = mini(code).s();

    // Apply layer-specific parameters
    if (params.gain !== undefined && params.gain !== 1) {
      pattern = pattern.gain(params.gain);
    }
    if (params.speed !== undefined && params.speed !== 1) {
      pattern = pattern.speed(params.speed);
    }
    if (params.cutoff !== undefined && params.cutoff < 8000) {
      pattern = pattern.cutoff(params.cutoff);
    }
    if (params.resonance !== undefined && params.resonance > 0) {
      pattern = pattern.resonance(params.resonance);
    }
    if (params.pan !== undefined && params.pan !== 0) {
      pattern = pattern.pan(params.pan);
    }

    return pattern;
  } catch (err) {
    console.error(`[MusicLab] Error building pattern for layer:`, err);
    return null;
  }
}

// Combine multiple layers into a stacked pattern
function buildCombinedPattern(layers) {
  if (!layers || layers.length === 0) return null;

  // Check for solo
  const hasSolo = layers.some(l => l.solo);

  // Filter active layers
  const activeLayers = layers.filter(layer => {
    if (hasSolo) return layer.solo && !layer.muted;
    return !layer.muted && layer.code && layer.code.trim();
  });

  if (activeLayers.length === 0) return null;

  // Build patterns for each layer
  const patterns = activeLayers
    .map(layer => buildLayerPattern(layer))
    .filter(p => p !== null);

  if (patterns.length === 0) return null;
  if (patterns.length === 1) return patterns[0];

  // Stack all patterns together using Pattern.stack() method
  // Start with first pattern and stack the rest
  let combined = patterns[0];
  for (let i = 1; i < patterns.length; i++) {
    combined = combined.stack(patterns[i]);
  }
  return combined;
}

function updatePattern() {
  if (!repl || currentLayers.length === 0) return false;

  try {
    const { scheduler } = repl;
    const pattern = buildCombinedPattern(currentLayers);

    if (pattern) {
      scheduler.setPattern(pattern);
      return true;
    } else {
      // Empty pattern - create silence
      scheduler.setPattern(mini('~').s());
      return true;
    }
  } catch (err) {
    console.error('[MusicLab] Pattern update error:', err);
    return false;
  }
}

// Set layers and update the pattern
export function setLayers(layers) {
  currentLayers = layers;
  if (repl) {
    updatePattern();
  }
}

// Update a specific layer's params
export function updateLayerParams(layerIndex, params) {
  if (currentLayers[layerIndex]) {
    currentLayers[layerIndex] = {
      ...currentLayers[layerIndex],
      params: { ...currentLayers[layerIndex].params, ...params }
    };
    if (repl) {
      updatePattern();
    }
  }
}

// Legacy: evaluate with simple code (backward compatibility)
export async function evaluate(code, bpm = 120) {
  try {
    if (!repl) {
      createRepl();
    }

    const cps = bpm / 60 / 4;
    const { scheduler } = repl;
    scheduler.setCps(cps);

    // If called with simple code, create a single layer
    if (typeof code === 'string') {
      currentLayers = [{
        id: 'legacy',
        code,
        muted: false,
        solo: false,
        params: { gain: 0.8, cutoff: 8000, resonance: 0, speed: 1, pan: 0 }
      }];
    }

    const success = updatePattern();
    if (!success) {
      return { success: false, error: 'Failed to update pattern' };
    }

    console.log('[MusicLab] Pattern evaluated');
    return { success: true };
  } catch (err) {
    console.error('[MusicLab] Evaluation error:', err);
    return { success: false, error: err.message };
  }
}

// Evaluate with layers (new API)
export async function evaluateLayers(layers, bpm = 120) {
  try {
    if (!repl) {
      createRepl();
    }

    currentLayers = layers;
    const cps = bpm / 60 / 4;
    const { scheduler } = repl;
    scheduler.setCps(cps);

    const success = updatePattern();
    if (!success) {
      return { success: false, error: 'Failed to update pattern' };
    }

    console.log('[MusicLab] Layers evaluated:', layers.length);
    return { success: true };
  } catch (err) {
    console.error('[MusicLab] Evaluation error:', err);
    return { success: false, error: err.message };
  }
}

export function start() {
  if (repl) {
    const { scheduler } = repl;
    scheduler.start();
    console.log('[MusicLab] Started');
  }
}

export function stop() {
  if (repl) {
    const { scheduler } = repl;
    scheduler.stop();
    console.log('[MusicLab] Stopped');
  }
}

export function setTempo(bpm) {
  if (repl) {
    const { scheduler } = repl;
    const cps = bpm / 60 / 4;
    scheduler.setCps(cps);
  }
}

export function getAudioContextState() {
  try {
    const ctx = getAudioContext();
    return ctx?.state || 'closed';
  } catch {
    return 'closed';
  }
}

// Legacy params support (for backward compatibility)
let globalParams = {
  gain: 0.8,
  cutoff: 8000,
  resonance: 0,
  speed: 1,
};

export function setParams(params) {
  globalParams = { ...globalParams, ...params };
  // Apply to all layers if using legacy mode
  if (currentLayers.length === 1 && currentLayers[0].id === 'legacy') {
    currentLayers[0].params = { ...currentLayers[0].params, ...params };
    if (repl) {
      updatePattern();
    }
  }
}

// Preview functionality for step sequencer
let savedLayers = null;
let isPreviewMode = false;

export async function startPreview(code, bpm = 120, swing = 0) {
  if (!repl) {
    createRepl();
  }

  try {
    // Save current layers
    savedLayers = [...currentLayers];
    isPreviewMode = true;

    const cps = bpm / 60 / 4;
    const { scheduler } = repl;
    scheduler.setCps(cps);

    // Create preview pattern
    let pattern = mini(code).s();

    // Apply swing if set (0-100 maps to 0-0.5)
    if (swing > 0 && typeof pattern.swing === 'function') {
      try {
        const swingAmount = swing / 100 * 0.5;
        pattern = pattern.swing(swingAmount);
      } catch (e) {
        console.warn('[MusicLab] Swing not supported:', e);
      }
    }

    scheduler.setPattern(pattern);
    scheduler.start();

    console.log('[MusicLab] Preview started:', code, swing > 0 ? `swing:${swing}%` : '');
    return { success: true };
  } catch (err) {
    console.error('[MusicLab] Preview error:', err);
    isPreviewMode = false;
    return { success: false, error: err.message };
  }
}

export function stopPreview() {
  if (!repl) return;

  try {
    const { scheduler } = repl;
    scheduler.stop();

    // Restore previous layers if they existed
    if (savedLayers && savedLayers.length > 0) {
      currentLayers = savedLayers;
    }
    savedLayers = null;
    isPreviewMode = false;

    console.log('[MusicLab] Preview stopped');
  } catch (err) {
    console.error('[MusicLab] Stop preview error:', err);
  }
}

export function isInPreviewMode() {
  return isPreviewMode;
}

// Get scheduler timing info for step sync
export function getSchedulerTime() {
  if (!repl) return null;
  try {
    const { scheduler } = repl;
    return {
      phase: scheduler.phase || 0,
      cps: scheduler.cps || 0.5,
    };
  } catch {
    return null;
  }
}
