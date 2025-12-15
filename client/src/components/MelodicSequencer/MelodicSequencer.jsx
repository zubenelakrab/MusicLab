import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Square, Copy, Trash2, RotateCcw, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { initAudio, startMelodicPreview, stopPreview } from '../../strudel/engine';

// Musical notes
const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const NOTE_LABELS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Note colors (chromatic gradient)
const NOTE_COLORS = {
  c: '#ef4444', // red
  d: '#f97316', // orange
  e: '#eab308', // yellow
  f: '#22c55e', // green
  g: '#3b82f6', // blue
  a: '#8b5cf6', // purple
  b: '#ec4899', // pink
};

// Available synths - dirt-samples that respond to note values
const SYNTHS = [
  { id: 'arpy', name: 'Arpy (Synth)' },
  { id: 'pluck', name: 'Pluck' },
  { id: 'jvbass', name: 'JV Bass' },
  { id: 'bass1', name: 'Bass 1' },
  { id: 'bass3', name: 'Bass 3' },
  { id: 'moog', name: 'Moog' },
  { id: 'juno', name: 'Juno' },
  { id: 'fm', name: 'FM Synth' },
  { id: 'gtr', name: 'Guitar' },
  { id: 'sitar', name: 'Sitar' },
];

// Melodic presets - using valid dirt-samples
const PRESETS = [
  {
    name: 'Arpeggio Up',
    synth: 'arpy',
    notes: [
      { note: 'c', octave: 3 }, null, { note: 'e', octave: 3 }, null,
      { note: 'g', octave: 3 }, null, { note: 'c', octave: 4 }, null,
      { note: 'e', octave: 4 }, null, { note: 'g', octave: 4 }, null,
      { note: 'c', octave: 5 }, null, { note: 'g', octave: 4 }, null,
    ]
  },
  {
    name: 'Arpeggio Down',
    synth: 'arpy',
    notes: [
      { note: 'c', octave: 5 }, null, { note: 'g', octave: 4 }, null,
      { note: 'e', octave: 4 }, null, { note: 'c', octave: 4 }, null,
      { note: 'g', octave: 3 }, null, { note: 'e', octave: 3 }, null,
      { note: 'c', octave: 3 }, null, { note: 'e', octave: 3 }, null,
    ]
  },
  {
    name: 'Bassline',
    synth: 'jvbass',
    notes: [
      { note: 'c', octave: 2 }, null, { note: 'c', octave: 2 }, null,
      { note: 'g', octave: 2 }, null, { note: 'a', octave: 2 }, null,
      { note: 'c', octave: 2 }, null, { note: 'c', octave: 2 }, null,
      { note: 'e', octave: 2 }, null, { note: 'g', octave: 2 }, null,
    ]
  },
  {
    name: 'Melody Pop',
    synth: 'pluck',
    notes: [
      { note: 'e', octave: 4 }, null, { note: 'd', octave: 4 }, { note: 'c', octave: 4 },
      null, { note: 'g', octave: 3 }, null, { note: 'c', octave: 4 },
      { note: 'e', octave: 4 }, null, { note: 'g', octave: 4 }, null,
      { note: 'e', octave: 4 }, { note: 'd', octave: 4 }, { note: 'c', octave: 4 }, null,
    ]
  },
  {
    name: 'Synth Lead',
    synth: 'juno',
    notes: [
      { note: 'a', octave: 4 }, null, { note: 'a', octave: 4 }, null,
      { note: 'g', octave: 4 }, null, { note: 'f', octave: 4 }, null,
      { note: 'e', octave: 4 }, null, { note: 'e', octave: 4 }, null,
      { note: 'd', octave: 4 }, null, { note: 'c', octave: 4 }, null,
    ]
  },
  {
    name: 'Minor Arp',
    synth: 'fm',
    notes: [
      { note: 'a', octave: 3 }, null, { note: 'c', octave: 4 }, null,
      { note: 'e', octave: 4 }, null, { note: 'a', octave: 4 }, null,
      { note: 'e', octave: 4 }, null, { note: 'c', octave: 4 }, null,
      { note: 'a', octave: 3 }, null, { note: 'e', octave: 3 }, null,
    ]
  },
  {
    name: 'Moog Bass',
    synth: 'moog',
    notes: [
      { note: 'c', octave: 2 }, { note: 'c', octave: 2 }, null, { note: 'c', octave: 2 },
      null, { note: 'g', octave: 2 }, null, null,
      { note: 'a', octave: 2 }, null, { note: 'g', octave: 2 }, null,
      { note: 'f', octave: 2 }, null, { note: 'g', octave: 2 }, null,
    ]
  },
  {
    name: 'Guitar Riff',
    synth: 'gtr',
    notes: [
      { note: 'e', octave: 3 }, null, { note: 'g', octave: 3 }, { note: 'a', octave: 3 },
      null, { note: 'b', octave: 3 }, null, null,
      { note: 'e', octave: 3 }, null, { note: 'g', octave: 3 }, null,
      { note: 'a', octave: 3 }, { note: 'g', octave: 3 }, { note: 'e', octave: 3 }, null,
    ]
  },
];

const STEP_OPTIONS = [8, 16, 32];

// Generate unique IDs
const generateTrackId = () => `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateClipId = () => `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Track colors
const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

export default function MelodicSequencer({ isOpen, onClose }) {
  const { arrangement, setEditingClip, bpm } = useStore();
  const { initializeAudio, audioReady } = useStrudel();

  const [steps, setSteps] = useState(16);
  const [grid, setGrid] = useState(Array(16).fill(null)); // null or {note, octave}
  const [synth, setSynth] = useState('arpy');
  const [selectedNote, setSelectedNote] = useState('c');
  const [selectedOctave, setSelectedOctave] = useState(3);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewCode, setPreviewCode] = useState('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const stepIntervalRef = useRef(null);

  // Update grid size when steps change
  useEffect(() => {
    setGrid(prev => {
      const newGrid = Array(steps).fill(null);
      prev.forEach((cell, i) => {
        if (i < steps) newGrid[i] = cell;
      });
      return newGrid;
    });
  }, [steps]);

  // Generate just the note pattern (for preview)
  const generatePattern = useCallback(() => {
    const hasNotes = grid.some(cell => cell !== null);
    if (!hasNotes) return '~';

    return grid.map(cell => {
      if (!cell) return '~';
      return `${cell.note}${cell.octave}`;
    }).join(' ');
  }, [grid]);

  // Generate full Strudel code (for display and layer export)
  const generateCode = useCallback(() => {
    const pattern = generatePattern();
    if (pattern === '~') return '~';
    return `note("${pattern}").sound("${synth}")`;
  }, [generatePattern, synth]);

  // Update preview code when grid or synth changes
  useEffect(() => {
    setPreviewCode(generateCode());
  }, [grid, synth, generateCode]);

  // Step animation during preview
  useEffect(() => {
    if (!isPreviewPlaying) {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setCurrentStep(0);
      return;
    }

    const cycleDuration = (60 / bpm) * 4 * 1000;
    const stepDuration = cycleDuration / steps;

    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps);
    }, stepDuration);

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    };
  }, [isPreviewPlaying, steps, bpm]);

  // Toggle note on step
  const toggleStep = (stepIndex) => {
    setGrid(prev => {
      const newGrid = [...prev];
      if (newGrid[stepIndex]) {
        // Clear if already has note
        newGrid[stepIndex] = null;
      } else {
        // Add selected note
        newGrid[stepIndex] = { note: selectedNote, octave: selectedOctave };
      }
      return newGrid;
    });
  };

  // Set specific note on step (right-click or long press could use this)
  const setStepNote = (stepIndex, note, octave) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[stepIndex] = { note, octave };
      return newGrid;
    });
  };

  // Change octave for a step
  const changeStepOctave = (stepIndex, delta) => {
    setGrid(prev => {
      const newGrid = [...prev];
      if (newGrid[stepIndex]) {
        const newOctave = Math.max(1, Math.min(6, newGrid[stepIndex].octave + delta));
        newGrid[stepIndex] = { ...newGrid[stepIndex], octave: newOctave };
      }
      return newGrid;
    });
  };

  // Clear all
  const clearAll = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    setGrid(Array(steps).fill(null));
  };

  // Load preset
  const loadPreset = (preset) => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    setSynth(preset.synth);
    const newGrid = Array(steps).fill(null);
    preset.notes.forEach((note, i) => {
      if (i < steps) newGrid[i] = note;
    });
    setGrid(newGrid);
  };

  // Create new track with the generated melodic pattern
  const applyAsTrack = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    const code = generateCode();
    if (!code || code === '~') {
      onClose();
      return;
    }

    const trackCount = arrangement.tracks.length;
    const color = TRACK_COLORS[trackCount % TRACK_COLORS.length];
    const trackId = generateTrackId();
    const clipId = generateClipId();

    // Create new track with a clip containing the melodic pattern
    const newTrack = {
      id: trackId,
      name: 'Melody',
      color,
      muted: false,
      solo: false,
      height: 100,
      params: {
        gain: 0.8, cutoff: 8000, resonance: 0, speed: 1, pan: 0,
        reverb: 0, reverbSize: 2, delay: 0, delayTime: 0.25, delayFeedback: 0.3,
        distortion: 0, hpf: 0, phaser: 0, phaserDepth: 0.5,
      },
      clips: [{
        id: clipId,
        patternId: null,
        name: 'Melodic Pattern',
        startBar: 0,
        durationBars: 4,
        color,
        layers: [{
          id: `layer-${Date.now()}`,
          name: 'Melody',
          code,
          muted: false,
          solo: false,
          params: {},
        }],
      }],
    };

    // Add track to arrangement
    useStore.setState((state) => ({
      arrangement: {
        ...state.arrangement,
        tracks: [...state.arrangement.tracks, newTrack],
      },
    }));

    // Select the new clip for editing
    setEditingClip(trackId, clipId);
    onClose();
  };

  // Copy code
  const copyCode = () => {
    navigator.clipboard.writeText(previewCode);
  };

  // Toggle preview
  const togglePreview = async () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    } else {
      if (!audioReady) {
        await initializeAudio();
      }
      await initAudio();

      const pattern = generatePattern();
      if (pattern && pattern !== '~') {
        const result = await startMelodicPreview(pattern, synth, bpm);
        if (result.success) {
          setIsPreviewPlaying(true);
          setCurrentStep(0);
        }
      }
    }
  };

  // Update preview when pattern or synth changes during playback
  useEffect(() => {
    if (isPreviewPlaying) {
      const pattern = generatePattern();
      if (pattern && pattern !== '~') {
        const updatePreviewPattern = async () => {
          stopPreview();
          const result = await startMelodicPreview(pattern, synth, bpm);
          if (!result.success) {
            setIsPreviewPlaying(false);
          }
        };
        updatePreviewPattern();
      }
    }
  }, [grid, synth]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      stopPreview();
    };
  }, []);

  // Handle close
  const handleClose = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 rounded-lg shadow-2xl border border-studio-600 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-studio-700 border-b border-studio-600">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Melodic Sequencer</h2>
            <button
              onClick={togglePreview}
              className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${
                isPreviewPlaying
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-accent-primary text-black hover:bg-emerald-400'
              }`}
            >
              {isPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
              {isPreviewPlaying ? 'Stop' : 'Preview'}
            </button>
            {isPreviewPlaying && (
              <span className="text-xs text-accent-primary animate-pulse">{bpm} BPM</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs bg-red-600/50 text-red-200 rounded hover:bg-red-600 flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-4 py-2 bg-studio-750 border-b border-studio-600 flex-wrap">
          {/* Steps */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Steps:</span>
            {STEP_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSteps(n)}
                className={`px-2 py-1 text-xs rounded ${
                  steps === n ? 'bg-blue-600 text-white' : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Synth selector */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <span className="text-xs text-gray-400">Synth:</span>
            <select
              value={synth}
              onChange={(e) => setSynth(e.target.value)}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
            >
              {SYNTHS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Preset selector */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <RotateCcw size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Preset:</span>
            <select
              onChange={(e) => {
                const preset = PRESETS.find(p => p.name === e.target.value);
                if (preset) loadPreset(preset);
              }}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
              defaultValue=""
            >
              <option value="" disabled>Elegir...</option>
              {PRESETS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Piano keyboard for note selection */}
        <div className="flex items-center gap-2 px-4 py-3 bg-studio-700 border-b border-studio-600">
          <span className="text-xs text-gray-400 mr-2">Nota:</span>
          <div className="flex gap-1">
            {NOTES.map((note, i) => (
              <button
                key={note}
                onClick={() => setSelectedNote(note)}
                className={`w-8 h-10 rounded text-xs font-bold transition-all ${
                  selectedNote === note
                    ? 'ring-2 ring-white scale-110'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: NOTE_COLORS[note],
                  color: ['e', 'f'].includes(note) ? '#000' : '#fff'
                }}
              >
                {NOTE_LABELS[i]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-studio-600 pl-4 ml-2">
            <span className="text-xs text-gray-400">Octava:</span>
            <button
              onClick={() => setSelectedOctave(o => Math.max(1, o - 1))}
              className="w-6 h-6 bg-studio-600 rounded hover:bg-studio-500 flex items-center justify-center"
            >
              <ChevronDown size={14} />
            </button>
            <span className="w-6 text-center text-white font-bold">{selectedOctave}</span>
            <button
              onClick={() => setSelectedOctave(o => Math.min(6, o + 1))}
              className="w-6 h-6 bg-studio-600 rounded hover:bg-studio-500 flex items-center justify-center"
            >
              <ChevronUp size={14} />
            </button>
          </div>

          <div className="ml-4 px-3 py-1 bg-studio-600 rounded text-sm font-mono" style={{ color: NOTE_COLORS[selectedNote] }}>
            {selectedNote.toUpperCase()}{selectedOctave}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {/* Step numbers */}
          <div className="flex mb-2">
            <div className="flex gap-1">
              {Array.from({ length: steps }, (_, i) => (
                <div
                  key={i}
                  className={`w-12 h-5 flex items-center justify-center text-xs ${
                    i % 4 === 0 ? 'text-gray-400' : 'text-gray-600'
                  } ${currentStep === i && isPreviewPlaying ? 'text-accent-primary font-bold' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Note grid */}
          <div className="flex gap-1">
            {grid.map((cell, stepIndex) => {
              const isBeat = stepIndex % 4 === 0;
              const isCurrentStepActive = currentStep === stepIndex && isPreviewPlaying;

              return (
                <div key={stepIndex} className="flex flex-col gap-1">
                  {/* Main cell */}
                  <button
                    onClick={() => toggleStep(stepIndex)}
                    className={`w-12 h-14 rounded transition-all flex flex-col items-center justify-center ${
                      cell
                        ? 'shadow-lg'
                        : isBeat
                        ? 'bg-studio-600 hover:bg-studio-500'
                        : 'bg-studio-700 hover:bg-studio-600'
                    } ${isCurrentStepActive ? 'ring-2 ring-white ring-opacity-80' : ''}`}
                    style={{
                      backgroundColor: cell ? NOTE_COLORS[cell.note] : undefined,
                      boxShadow: cell ? `0 0 12px ${NOTE_COLORS[cell.note]}50` : undefined
                    }}
                  >
                    {cell && (
                      <>
                        <span className="text-sm font-bold text-white drop-shadow">
                          {cell.note.toUpperCase()}
                        </span>
                        <span className="text-xs text-white/80">
                          {cell.octave}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Octave controls for filled cells */}
                  {cell && (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => changeStepOctave(stepIndex, -1)}
                        className="flex-1 h-4 bg-studio-600 rounded-sm hover:bg-studio-500 flex items-center justify-center"
                        disabled={cell.octave <= 1}
                      >
                        <ChevronDown size={10} />
                      </button>
                      <button
                        onClick={() => changeStepOctave(stepIndex, 1)}
                        className="flex-1 h-4 bg-studio-600 rounded-sm hover:bg-studio-500 flex items-center justify-center"
                        disabled={cell.octave >= 6}
                      >
                        <ChevronUp size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-studio-600 bg-studio-700 p-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Codigo generado:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-studio-900 rounded text-accent-tertiary font-mono text-xs overflow-x-auto max-h-16">
                  {previewCode}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2 bg-studio-600 text-gray-300 rounded hover:bg-studio-500"
                  title="Copiar"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={applyAsTrack}
              className="px-4 py-2 bg-accent-primary text-black rounded font-medium hover:bg-emerald-400 flex items-center gap-2"
            >
              <Plus size={16} />
              Crear Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
