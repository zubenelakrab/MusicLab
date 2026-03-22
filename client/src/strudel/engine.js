import { initAudioOnFirstClick, getAudioContext, webaudioRepl, samples } from '@strudel/webaudio';
import { mini } from '@strudel/mini';
import logger from '../utils/logger.js';

let repl = null;
let audioInitialized = false;
let audioInitializing = false;
let currentLayers = [];
let analyserNode = null;
let analyserConnected = false;
let interceptInstalled = false;
let originalGainConnect = null;
const warnedErrors = new Set();

function warnOnce(key, message, error) {
  if (warnedErrors.has(key)) return;
  warnedErrors.add(key);
  logger.warn(message, error);
}

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
    originalGainConnect = GainNode.prototype.connect;
    const originalConnect = originalGainConnect;

    // Monkey-patch connect to intercept connections to destination
    GainNode.prototype.connect = function (destination, ...args) {
      // Check if connecting to the audio destination
      if (destination === ctx.destination && analyserNode) {
        logger.log('Intercepted connection to destination, routing through analyser');
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
    logger.log('Destination intercept installed');
  } catch (err) {
    logger.warn('Could not install intercept:', err);
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
    logger.warn('Could not get analyser:', err);
    return null;
  }
}

export async function initAudio() {
  if (audioInitialized) return true;
  if (audioInitializing) {
    // Wait for ongoing initialization
    while (audioInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return audioInitialized;
  }

  audioInitializing = true;
  try {
    // Wait for user click to initialize audio
    await initAudioOnFirstClick();

    // Install intercept AFTER audio context is created but BEFORE Strudel connects
    installDestinationIntercept();

    // Load default drum samples
    await samples('github:tidalcycles/dirt-samples');
    audioInitialized = true;
    logger.log('Audio initialized');
    return true;
  } catch (err) {
    logger.error('Failed to initialize audio:', err);
    return false;
  } finally {
    audioInitializing = false;
  }
}

export function createRepl() {
  if (repl) return repl;

  repl = webaudioRepl({});

  logger.log('REPL created');
  return repl;
}

// Parse pattern code that may contain .gain() modifiers from step sequencer
// Handles: "[bd ~ bd ~]", "[bd ~ bd ~].gain(0.80)", "[bd ~ bd ~].gain([0.40 ~ 1.00 ~])"
// Also handles stacked patterns separated by " , "
function parsePatternCode(code) {
  if (!code || code.trim() === '~') {
    return mini('~').s();
  }

  // Fast path: no .gain() modifiers, use simple mini notation
  if (!code.includes('.gain(')) {
    return mini(code).s();
  }

  // Split by top-level " , " (stacked patterns)
  const parts = code.split(' , ');

  const patterns = parts.map(part => {
    part = part.trim();

    // Check for .gain([...]) suffix (per-step gain pattern)
    const arrayGainMatch = part.match(/^(.+)\.gain\(\[([^\]]+)\]\)$/);
    if (arrayGainMatch) {
      const soundPart = arrayGainMatch[1].trim();
      const gainPart = arrayGainMatch[2].trim();
      let p = mini(soundPart).s();
      p = p.gain(mini(`[${gainPart}]`));
      return p;
    }

    // Check for .gain(number) suffix (uniform gain)
    const singleGainMatch = part.match(/^(.+)\.gain\(([0-9.]+)\)$/);
    if (singleGainMatch) {
      const soundPart = singleGainMatch[1].trim();
      const gainValue = parseFloat(singleGainMatch[2]);
      return mini(soundPart).s().gain(gainValue);
    }

    // No gain modifier on this part
    return mini(part).s();
  });

  if (patterns.length === 0) return mini('~').s();
  if (patterns.length === 1) return patterns[0];

  // Stack all patterns
  let combined = patterns[0];
  for (let i = 1; i < patterns.length; i++) {
    combined = combined.stack(patterns[i]);
  }
  return combined;
}

// Build a pattern from a single layer with its params
function buildLayerPattern(layer) {
  const { code, params } = layer;
  if (!code || !code.trim()) return null;

  try {
    let pattern;

    // Check for melodic with array gain: note("...").sound("...").gain([...])
    const melodicArrayGainMatch = code.match(/^note\("([^"]+)"\)\.sound\("([^"]+)"\)\.gain\(\[([^\]]+)\]\)$/);
    if (melodicArrayGainMatch) {
      const notePattern = melodicArrayGainMatch[1];
      const synthName = melodicArrayGainMatch[2];
      const gainPart = melodicArrayGainMatch[3];
      pattern = mini(notePattern).note().s(synthName).gain(mini(`[${gainPart}]`));
    }

    // Check for melodic with single gain: note("...").sound("...").gain(N)
    if (!pattern) {
      const melodicSingleGainMatch = code.match(/^note\("([^"]+)"\)\.sound\("([^"]+)"\)\.gain\(([0-9.]+)\)$/);
      if (melodicSingleGainMatch) {
        const notePattern = melodicSingleGainMatch[1];
        const synthName = melodicSingleGainMatch[2];
        const gainValue = parseFloat(melodicSingleGainMatch[3]);
        pattern = mini(notePattern).note().s(synthName).gain(gainValue);
      }
    }

    // Plain melodic: note("...").sound("...")
    if (!pattern) {
      const melodicMatch = code.match(/^note\("([^"]+)"\)\.sound\("([^"]+)"\)$/);
      if (melodicMatch) {
        const notePattern = melodicMatch[1];
        const synthName = melodicMatch[2];
        pattern = mini(notePattern).note().s(synthName);
      }
    }

    if (!pattern) {
      // Standard drum/sample pattern (handles .gain() from step sequencer)
      pattern = parsePatternCode(code);
    }

    // Apply layer-specific parameters (mixer)
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

    // Apply effects
    // Reverb
    if (params.reverb !== undefined && params.reverb > 0) {
      pattern = pattern.room(params.reverb);
      if (params.reverbSize !== undefined && params.reverbSize !== 2) {
        pattern = pattern.roomsize(params.reverbSize);
      }
    }

    // Delay
    if (params.delay !== undefined && params.delay > 0) {
      pattern = pattern.delay(params.delay);
      if (params.delayTime !== undefined && params.delayTime !== 0.25) {
        pattern = pattern.delaytime(params.delayTime);
      }
      if (params.delayFeedback !== undefined && params.delayFeedback !== 0.3) {
        pattern = pattern.delayfeedback(params.delayFeedback);
      }
    }

    // Distortion
    if (params.distortion !== undefined && params.distortion > 0) {
      pattern = pattern.distort(params.distortion);
    }

    // High-Pass Filter
    if (params.hpf !== undefined && params.hpf > 20) {
      pattern = pattern.hpf(params.hpf);
    }

    // Phaser
    if (params.phaser !== undefined && params.phaser > 0) {
      pattern = pattern.phaser(params.phaser);
      if (params.phaserDepth !== undefined && params.phaserDepth !== 0.5) {
        pattern = pattern.phaserdepth(params.phaserDepth);
      }
    }

    return pattern;
  } catch (err) {
    logger.error('Error building pattern for layer:', err);
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
    logger.error('Pattern update error:', err);
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

    logger.log('Pattern evaluated');
    return { success: true };
  } catch (err) {
    logger.error('Evaluation error:', err);
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
    currentCps = cps;
    const { scheduler } = repl;
    scheduler.setCps(cps);

    const success = updatePattern();
    if (!success) {
      return { success: false, error: 'Failed to update pattern' };
    }

    logger.log('Layers evaluated:', layers.length);
    return { success: true };
  } catch (err) {
    logger.error('Evaluation error:', err);
    return { success: false, error: err.message };
  }
}

export function start() {
  if (repl) {
    const { scheduler } = repl;
    scheduler.start();

    // Record start time for playhead tracking
    const ctx = getAudioContext();
    if (ctx) {
      playbackStartTime = ctx.currentTime;
    }

    logger.log('Started');
  }
}

export function stop() {
  if (repl) {
    const { scheduler } = repl;
    scheduler.stop();
    playbackStartTime = 0;
    logger.log('Stopped');
  }
}

export function cleanupAudio() {
  // Restore original GainNode.prototype.connect if we monkey-patched it
  if (originalGainConnect) {
    GainNode.prototype.connect = originalGainConnect;
    originalGainConnect = null;
  }
  interceptInstalled = false;
  analyserConnected = false;
  analyserNode = null;
  recordedChunks = [];
}

export function setTempo(bpm) {
  if (repl) {
    const { scheduler } = repl;
    const cps = bpm / 60 / 4;
    currentCps = cps;
    scheduler.setCps(cps);
  }
}

export function getAudioContextState() {
  try {
    const ctx = getAudioContext();
    return ctx?.state || 'closed';
  } catch (err) {
    warnOnce('audio-context-state', 'Failed to get audio context state:', err);
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
    scheduler.stop();
    playbackStartTime = 0;
    scheduler.setCps(cps);

    // Create preview pattern (handles .gain() from step sequencer)
    let pattern = parsePatternCode(code);

    // Apply swing if set (0-100 maps to 0-0.5)
    if (swing > 0 && typeof pattern.swing === 'function') {
      try {
        const swingAmount = swing / 100 * 0.5;
        pattern = pattern.swing(swingAmount);
      } catch (e) {
        logger.warn('Swing not supported:', e);
      }
    }

    scheduler.setPattern(pattern);
    scheduler.start();

    logger.log('Preview started:', code, swing > 0 ? `swing:${swing}%` : '');
    return { success: true };
  } catch (err) {
    logger.error('Preview error:', err);
    isPreviewMode = false;
    return { success: false, error: err.message };
  }
}

// Preview for melodic patterns (notes instead of sounds)
// Uses dirt-samples that respond to note values
export async function startMelodicPreview(notePattern, synth = 'arpy', bpm = 120, gainInfo = null) {
  if (!repl) {
    createRepl();
  }

  try {
    // Save current layers
    savedLayers = [...currentLayers];
    isPreviewMode = true;

    const cps = bpm / 60 / 4;
    const { scheduler } = repl;
    scheduler.stop();
    playbackStartTime = 0;
    scheduler.setCps(cps);

    // Create melodic pattern: note("c3 e3").s("arpy")
    let pattern = mini(notePattern).note().s(synth);

    // Apply gain info if provided
    if (gainInfo) {
      if (gainInfo.type === 'array') {
        pattern = pattern.gain(mini(`[${gainInfo.pattern}]`));
      } else if (gainInfo.type === 'single') {
        pattern = pattern.gain(gainInfo.value);
      }
    }

    scheduler.setPattern(pattern);
    scheduler.start();

    logger.log('Melodic preview started:', notePattern, synth);
    return { success: true };
  } catch (err) {
    logger.error('Melodic preview error:', err);
    isPreviewMode = false;
    return { success: false, error: err.message };
  }
}

export function stopPreview() {
  if (!repl) return;

  try {
    const { scheduler } = repl;
    scheduler.stop();
    playbackStartTime = 0;

    // Restore previous layers if they existed
    if (savedLayers && savedLayers.length > 0) {
      currentLayers = savedLayers;
    }
    savedLayers = null;
    isPreviewMode = false;

    logger.log('Preview stopped');
  } catch (err) {
    logger.error('Stop preview error:', err);
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
  } catch (err) {
    warnOnce('scheduler-time', 'Failed to read scheduler time:', err);
    return null;
  }
}

// ============================================
// RECORDING FUNCTIONALITY
// ============================================

let mediaRecorder = null;
let recordedChunks = [];
let mediaStreamDest = null;
let recordingSetup = false;

// Setup recording infrastructure (connect to audio graph)
export function setupRecording() {
  if (recordingSetup) return true;

  try {
    const ctx = getAudioContext();
    if (!ctx || !analyserNode) {
      logger.warn('Cannot setup recording: audio not initialized');
      return false;
    }

    // Create MediaStreamDestination for recording
    mediaStreamDest = ctx.createMediaStreamDestination();

    // Connect analyser to mediaStreamDest (in parallel with destination)
    analyserNode.connect(mediaStreamDest);

    recordingSetup = true;
    logger.log('Recording infrastructure ready');
    return true;
  } catch (err) {
    logger.error('Failed to setup recording:', err);
    return false;
  }
}

// Start recording
export function startRecording() {
  if (!recordingSetup) {
    if (!setupRecording()) {
      return false;
    }
  }

  try {
    recordedChunks = [];

    // Determine best supported mime type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

    mediaRecorder = new MediaRecorder(mediaStreamDest.stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onerror = (e) => {
      logger.error('Recording error:', e);
      recordedChunks = [];
    };

    // Start recording with 100ms chunks for memory efficiency
    mediaRecorder.start(100);
    logger.log('Recording started');
    return true;
  } catch (err) {
    logger.error('Failed to start recording:', err);
    return false;
  }
}

// Stop recording and return blob
export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      try {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        recordedChunks = [];
        logger.log('Recording stopped, blob size:', blob.size);
        resolve(blob);
      } catch (err) {
        logger.error('Failed to create recording blob:', err);
        reject(err);
      }
    };

    mediaRecorder.stop();
  });
}

// Get current recording state
export function getRecordingState() {
  if (!mediaRecorder) return 'inactive';
  return mediaRecorder.state;
}

// Check if currently recording
export function isRecording() {
  return mediaRecorder && mediaRecorder.state === 'recording';
}

// Convert audio blob to WAV format
export async function convertToWav(blob) {
  try {
    const ctx = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWav(audioBuffer);
    await ctx.close();
    return wavBlob;
  } catch (err) {
    logger.error('Failed to convert to WAV:', err);
    throw err;
  }
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Interleave channels
  const length = buffer.length * numChannels * (bitDepth / 8);
  const outputBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(outputBuffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, format, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // Block align
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write PCM samples
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([outputBuffer], { type: 'audio/wav' });
}

// Helper to write string to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ============================================
// SAMPLE PREVIEW (ONE-SHOT)
// ============================================

// Initialize audio directly (for use when already in a click handler)
async function initAudioDirect() {
  if (audioInitialized) return true;
  if (audioInitializing) {
    while (audioInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return audioInitialized;
  }

  audioInitializing = true;
  try {
    // Create audio context directly since we're already in a click handler
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      logger.error('AudioContext not supported');
      return false;
    }

    // Trigger Strudel's audio initialization by calling initAudioOnFirstClick
    // This will resolve immediately if we're in a user gesture
    const initPromise = initAudioOnFirstClick();

    // Give it a moment to initialize
    await Promise.race([
      initPromise,
      new Promise(resolve => setTimeout(resolve, 100))
    ]);

    // Install intercept
    installDestinationIntercept();

    // Load samples
    await samples('github:tidalcycles/dirt-samples');

    audioInitialized = true;
    logger.log('Audio initialized directly');
    return true;
  } catch (err) {
    logger.error('Failed to initialize audio directly:', err);
    return false;
  } finally {
    audioInitializing = false;
  }
}

// Preview a single sample with optional variant (plays once, doesn't loop)
export async function previewSample(sampleName, variant = 0) {
  try {
    // Ensure audio is initialized and samples are loaded
    if (!audioInitialized) {
      const initialized = await initAudioDirect();
      if (!initialized) {
        logger.warn('Could not initialize audio for preview');
        return false;
      }
    }

    const ctx = getAudioContext();
    if (!ctx) {
      logger.warn('Audio context not available');
      return false;
    }

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Create a one-shot pattern that plays just once
    // Using the :N notation for variant selection
    const sampleCode = variant > 0 ? `${sampleName}:${variant}` : sampleName;

    // Create repl if needed
    if (!repl) {
      createRepl();
    }

    // Use a very short pattern that plays once
    const pattern = mini(sampleCode).s().gain(0.8);

    // Get the scheduler and set a fast tempo for immediate playback
    const { scheduler } = repl;
    const originalCps = scheduler.cps;

    // Set high CPS for fast playback, then schedule stop
    const wasPlaying = scheduler.started;
    const oldPattern = scheduler.pattern;

    scheduler.setCps(2);
    if (wasPlaying && oldPattern) {
      scheduler.setPattern(oldPattern.stack(pattern));
    } else {
      scheduler.setPattern(pattern);
      scheduler.start();
    }

    // Stop after a short duration (500ms should be enough for most samples)
    setTimeout(() => {
      scheduler.stop();
      scheduler.setCps(originalCps);
      // Restore previous pattern if we were in preview mode
      if (savedLayers && savedLayers.length > 0) {
        currentLayers = savedLayers;
      }
    }, 500);

    return true;
  } catch (err) {
    logger.error('Sample preview error:', err);
    return false;
  }
}

// ============================================
// ARRANGEMENT PLAYBACK
// ============================================

let playheadCallback = null;
let playheadLoopActive = false;
let playbackStartTime = 0;
let currentCps = 0.5; // cycles per second (default 120 BPM / 60 / 4)

// Set callback for playhead position updates
export function setPlayheadCallback(callback) {
  playheadCallback = callback;
}

// Get current playback position in bars (using time-based tracking)
export function getPlaybackPositionBars() {
  if (!repl) return 0;

  try {
    const { scheduler } = repl;

    // If scheduler is not started, return 0
    if (!scheduler.started) return 0;

    // Try to get phase from scheduler first
    if (typeof scheduler.phase === 'number' && scheduler.phase > 0) {
      return scheduler.phase;
    }

    // Fallback: calculate position based on elapsed time
    const ctx = getAudioContext();
    if (ctx && playbackStartTime > 0) {
      const elapsed = ctx.currentTime - playbackStartTime;
      const cps = scheduler.cps || currentCps;
      return elapsed * cps;
    }

    return 0;
  } catch (err) {
    warnOnce('playback-position', 'Failed to get playback position:', err);
    return 0;
  }
}

// Start playhead animation loop
export function startPlayheadLoop() {
  if (playheadLoopActive) return;
  playheadLoopActive = true;

  // Record start time
  const ctx = getAudioContext();
  if (ctx) {
    playbackStartTime = ctx.currentTime;
  }

  const update = () => {
    if (!playheadLoopActive) return;

    if (playheadCallback && repl) {
      const position = getPlaybackPositionBars();
      playheadCallback(position);
    }

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

// Stop playhead animation loop
export function stopPlayheadLoop() {
  playheadLoopActive = false;
  playbackStartTime = 0;
}

// Reset playback start time (for looping)
export function resetPlaybackTime() {
  const ctx = getAudioContext();
  if (ctx) {
    playbackStartTime = ctx.currentTime;
  }
}

// Build a time mask pattern for a clip
// Creates a pattern of 1s and 0s where 1 = clip is active
const ARRANGEMENT_STEPS_PER_BAR = 16;

function buildTimeMask(startBar, durationBars, totalBars, stepsPerBar = ARRANGEMENT_STEPS_PER_BAR) {
  const totalSteps = Math.max(1, Math.ceil(totalBars * stepsPerBar));
  const mask = [];
  for (let step = 0; step < totalSteps; step++) {
    const bar = step / stepsPerBar;
    if (bar >= startBar && bar < startBar + durationBars) {
      mask.push('1');
    } else {
      mask.push('~');
    }
  }
  return mask.join(' ');
}

function hashString(value) {
  let hash = 2166136261;
  const str = String(value || '');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getInterpolatedAutomationValue(points, bar) {
  if (!points || points.length === 0) return null;
  if (bar <= points[0].bar) return points[0].value;
  if (bar >= points[points.length - 1].bar) return points[points.length - 1].value;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (bar >= a.bar && bar <= b.bar) {
      const span = b.bar - a.bar;
      if (span <= 0) return b.value;
      const t = (bar - a.bar) / span;
      return a.value + (b.value - a.value) * t;
    }
  }
  return points[points.length - 1].value;
}

function buildAutomationValues(lane, effectiveStart, effectiveLength, stepsPerBar = ARRANGEMENT_STEPS_PER_BAR) {
  if (!lane?.enabled || !Array.isArray(lane.points) || lane.points.length === 0) return null;
  const points = [...lane.points]
    .filter((p) => Number.isFinite(p.bar) && Number.isFinite(p.value))
    .sort((a, b) => a.bar - b.bar);
  if (points.length === 0) return null;

  const totalSteps = Math.max(1, Math.ceil(effectiveLength * stepsPerBar));
  const values = new Array(totalSteps);
  for (let step = 0; step < totalSteps; step++) {
    const bar = effectiveStart + (step / stepsPerBar);
    const value = getInterpolatedAutomationValue(points, bar);
    values[step] = Number(value.toFixed(3));
  }
  return values;
}

function applyAutomationToPattern(pattern, lane, methodName, effectiveStart, effectiveLength) {
  const values = buildAutomationValues(lane, effectiveStart, effectiveLength);
  if (!values || typeof pattern?.[methodName] !== 'function') return pattern;
  const valuesPattern = mini(`[${values.join(' ')}]`).slow(effectiveLength);
  return pattern[methodName](valuesPattern);
}

function applyGrooveToPattern(pattern, groove, effectiveLength, seedBase) {
  if (!pattern) return pattern;

  const swing = Number(groove?.swing || 0);
  if (swing > 0 && typeof pattern.swing === 'function') {
    pattern = pattern.swing((swing / 100) * 0.5);
  }

  // Velocity humanize: subtle gain motion for less robotic playback.
  const humanize = Number(groove?.humanize || 0);
  if (humanize > 0 && typeof pattern.gain === 'function') {
    const totalSteps = Math.max(1, Math.ceil(effectiveLength * ARRANGEMENT_STEPS_PER_BAR));
    const amount = Math.min(0.3, (humanize / 100) * 0.22);
    const values = new Array(totalSteps);
    const seed = hashString(seedBase);
    for (let i = 0; i < totalSteps; i++) {
      const jitter = (seededRandom(seed + i * 17) * 2 - 1) * amount;
      values[i] = Number((1 + jitter).toFixed(3));
    }
    pattern = pattern.gain(mini(`[${values.join(' ')}]`).slow(effectiveLength));
  }

  return pattern;
}

// Build the full arrangement pattern from all tracks
// Uses time masking so clips only play during their designated time slots
export function buildArrangementPattern(arrangement, patternLibrary = []) {
  if (!arrangement || !arrangement.tracks) return null;

  try {
    const { tracks, lengthBars, loopEnabled, loopStart, loopEnd } = arrangement;
    const arrangementGroove = {
      swing: 0,
      humanize: 0,
      ...(arrangement.groove || {}),
    };

    // Use loop range if enabled, otherwise full arrangement
    const effectiveLength = loopEnabled ? (loopEnd - loopStart) : lengthBars;
    const effectiveStart = loopEnabled ? loopStart : 0;

    // Check for solo tracks
    const hasSolo = tracks.some(t => t.solo);

    // Filter active tracks
    const activeTracks = tracks.filter(track => {
      if (hasSolo) return track.solo && !track.muted;
      return !track.muted;
    });

    if (activeTracks.length === 0) return null;

    // Collect all clip patterns with their timing
    const allClipPatterns = [];

    for (const track of activeTracks) {
      for (const clip of track.clips) {
        const clipEnd = clip.startBar + clip.durationBars;
        const effectiveEnd = effectiveStart + effectiveLength;

        // Skip clips completely outside the effective range
        if (clip.startBar >= effectiveEnd || clipEnd <= effectiveStart) continue;

        // Build the clip's pattern from its layers
        let clipLayers;

        // First check if clip has its own layers (most common case)
        if (clip.layers && clip.layers.length > 0) {
          clipLayers = clip.layers;
        } else if (clip.patternId) {
          // Look up pattern from library
          const patternDef = patternLibrary.find(p => p.id === clip.patternId);
          if (!patternDef) continue;

          // Patterns from library have 'code' not 'layers', so wrap it
          if (patternDef.layers) {
            clipLayers = patternDef.layers;
          } else if (patternDef.code) {
            clipLayers = [{
              id: 'lib-layer',
              code: patternDef.code,
              muted: false,
              solo: false,
              params: patternDef.params || {},
            }];
          } else {
            continue;
          }
        } else {
          continue;
        }

        const basePattern = buildCombinedPattern(clipLayers);
        if (!basePattern) continue;

        // Apply track params (gain, pan, effects)
        let pattern = basePattern;

        if (track.params.gain !== undefined && track.params.gain !== 1) {
          pattern = pattern.gain(track.params.gain);
        }
        if (track.params.pan !== undefined && track.params.pan !== 0) {
          pattern = pattern.pan(track.params.pan);
        }
        if (track.params.cutoff !== undefined && track.params.cutoff < 12000) {
          pattern = pattern.cutoff(track.params.cutoff);
        }
        if (track.params.reverb !== undefined && track.params.reverb > 0) {
          pattern = pattern.room(track.params.reverb);
        }
        if (track.params.delay !== undefined && track.params.delay > 0) {
          pattern = pattern.delay(track.params.delay);
        }

        // Calculate clip position relative to effective range
        const relativeStart = Math.max(0, clip.startBar - effectiveStart);
        const relativeEnd = Math.min(effectiveLength, clipEnd - effectiveStart);
        const relativeDuration = relativeEnd - relativeStart;

        // Create a time mask for this clip within the effective range
        const maskString = buildTimeMask(relativeStart, relativeDuration, effectiveLength);
        const maskPattern = mini(maskString).slow(effectiveLength);

        // Apply the mask using mask() - this keeps the original rhythm
        // but silences the pattern outside the clip's time range
        let maskedPattern = pattern.mask(maskPattern);

        // Apply track automation lanes (timeline-aware).
        maskedPattern = applyAutomationToPattern(maskedPattern, track.automation?.gain, 'gain', effectiveStart, effectiveLength);
        maskedPattern = applyAutomationToPattern(maskedPattern, track.automation?.pan, 'pan', effectiveStart, effectiveLength);
        maskedPattern = applyAutomationToPattern(maskedPattern, track.automation?.cutoff, 'cutoff', effectiveStart, effectiveLength);

        // Apply groove after automation.
        const groove = {
          ...arrangementGroove,
          ...(track.groove || {}),
        };
        maskedPattern = applyGrooveToPattern(
          maskedPattern,
          groove,
          effectiveLength,
          `${track.id}:${clip.id}:${effectiveStart}:${effectiveLength}`
        );

        allClipPatterns.push(maskedPattern);
      }
    }

    if (allClipPatterns.length === 0) return null;
    if (allClipPatterns.length === 1) return allClipPatterns[0];

    // Stack all clip patterns
    let combined = allClipPatterns[0];
    for (let i = 1; i < allClipPatterns.length; i++) {
      combined = combined.stack(allClipPatterns[i]);
    }

    return combined;
  } catch (err) {
    logger.error('Error building arrangement pattern:', err);
    return null;
  }
}

// Evaluate and play arrangement
export async function evaluateArrangement(arrangement, patternLibrary, bpm = 120) {
  try {
    if (!repl) {
      createRepl();
    }

    const cps = bpm / 60 / 4;
    const { scheduler } = repl;
    scheduler.setCps(cps);

    const pattern = buildArrangementPattern(arrangement, patternLibrary);

    if (pattern) {
      scheduler.setPattern(pattern);
      logger.log('Arrangement evaluated');
      return { success: true };
    } else {
      // Empty arrangement - create silence
      scheduler.setPattern(mini('~').s());
      return { success: true };
    }
  } catch (err) {
    logger.error('Arrangement evaluation error:', err);
    return { success: false, error: err.message };
  }
}

// Preview sample using Web Audio API directly (more reliable one-shot)
export async function previewSampleDirect(sampleName, variant = 0) {
  try {
    // Ensure audio is initialized and samples are loaded
    if (!audioInitialized) {
      const initialized = await initAudioDirect();
      if (!initialized) {
        logger.warn('Could not initialize audio for direct preview');
        return false;
      }
    }

    const ctx = getAudioContext();
    if (!ctx) {
      logger.warn('No audio context for direct preview');
      return false;
    }

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const sampleCode = variant > 0 ? `${sampleName}:${variant}` : sampleName;

    if (!repl) {
      createRepl();
    }

    const pattern = mini(sampleCode).s().gain(0.9);
    const { scheduler } = repl;

    const wasPlaying = scheduler.started;
    const oldPattern = scheduler.pattern;
    const oldCps = scheduler.cps;

    scheduler.setCps(4);
    if (wasPlaying && oldPattern) {
      scheduler.setPattern(oldPattern.stack(pattern));
    } else {
      scheduler.setPattern(pattern);
      scheduler.start();
    }

    setTimeout(() => {
      if (!wasPlaying) {
        scheduler.stop();
      }
      if (oldPattern) {
        scheduler.setPattern(oldPattern);
      }
      scheduler.setCps(oldCps);
    }, 300);

    return true;
  } catch (err) {
    logger.error('Direct preview error:', err);
    return false;
  }
}
