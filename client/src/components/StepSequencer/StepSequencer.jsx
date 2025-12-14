import { useState, useEffect, useCallback } from 'react';
import { X, Play, Square, Copy, Trash2, Plus, Minus } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';

// Default drum sounds with categories
const DEFAULT_SOUNDS = [
  { id: 'bd', name: 'Kick', color: '#ef4444' },
  { id: 'sd', name: 'Snare', color: '#f97316' },
  { id: 'hh', name: 'HiHat', color: '#eab308' },
  { id: 'oh', name: 'Open HH', color: '#84cc16' },
  { id: 'cp', name: 'Clap', color: '#10b981' },
  { id: 'rim', name: 'Rim', color: '#06b6d4' },
  { id: 'tom', name: 'Tom', color: '#3b82f6' },
  { id: 'cb', name: 'Cowbell', color: '#8b5cf6' },
];

const STEP_OPTIONS = [8, 16, 32];

export default function StepSequencer({ isOpen, onClose }) {
  const { currentPattern, updateLayerCode, selectedLayerIndex } = useStore();
  const { isPlaying } = useStrudel();

  const [steps, setSteps] = useState(16);
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS.slice(0, 4));
  const [grid, setGrid] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [previewCode, setPreviewCode] = useState('');

  // Initialize grid when sounds or steps change
  useEffect(() => {
    const newGrid = {};
    sounds.forEach(sound => {
      if (!grid[sound.id]) {
        newGrid[sound.id] = new Array(steps).fill(false);
      } else {
        // Preserve existing steps, extend or truncate as needed
        const existing = grid[sound.id];
        newGrid[sound.id] = new Array(steps).fill(false).map((_, i) => existing[i] || false);
      }
    });
    setGrid(newGrid);
  }, [sounds, steps]);

  // Generate mini notation from grid
  const generateCode = useCallback(() => {
    const activeSounds = sounds.filter(s => grid[s.id]?.some(v => v));

    if (activeSounds.length === 0) return '~';

    // Generate pattern for each sound
    const patterns = activeSounds.map(sound => {
      const pattern = grid[sound.id].map(active => active ? sound.id : '~').join(' ');
      return `[${pattern}]`;
    });

    // If single sound, return without comma
    if (patterns.length === 1) {
      return patterns[0];
    }

    // Multiple sounds - use parallel notation
    return `[${patterns.join(', ')}]`;
  }, [grid, sounds]);

  // Update preview when grid changes
  useEffect(() => {
    setPreviewCode(generateCode());
  }, [grid, generateCode]);

  // Animate current step when playing
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps);
    }, 125); // Approximate step timing at 120 BPM

    return () => clearInterval(interval);
  }, [isPlaying, steps]);

  // Toggle a step
  const toggleStep = (soundId, stepIndex) => {
    setGrid(prev => ({
      ...prev,
      [soundId]: prev[soundId].map((v, i) => i === stepIndex ? !v : v)
    }));
  };

  // Clear all steps for a sound
  const clearSound = (soundId) => {
    setGrid(prev => ({
      ...prev,
      [soundId]: new Array(steps).fill(false)
    }));
  };

  // Clear entire grid
  const clearAll = () => {
    const newGrid = {};
    sounds.forEach(sound => {
      newGrid[sound.id] = new Array(steps).fill(false);
    });
    setGrid(newGrid);
  };

  // Add a sound row
  const addSound = () => {
    const availableSounds = DEFAULT_SOUNDS.filter(s => !sounds.find(existing => existing.id === s.id));
    if (availableSounds.length > 0) {
      setSounds([...sounds, availableSounds[0]]);
    }
  };

  // Remove a sound row
  const removeSound = (soundId) => {
    if (sounds.length > 1) {
      setSounds(sounds.filter(s => s.id !== soundId));
      setGrid(prev => {
        const newGrid = { ...prev };
        delete newGrid[soundId];
        return newGrid;
      });
    }
  };

  // Change a sound
  const changeSound = (oldId, newId) => {
    const newSound = DEFAULT_SOUNDS.find(s => s.id === newId);
    if (newSound) {
      setSounds(sounds.map(s => s.id === oldId ? newSound : s));
      setGrid(prev => {
        const newGrid = { ...prev };
        newGrid[newId] = prev[oldId] || new Array(steps).fill(false);
        delete newGrid[oldId];
        return newGrid;
      });
    }
  };

  // Apply to current layer
  const applyToLayer = () => {
    const code = generateCode();
    updateLayerCode(selectedLayerIndex, code);
    onClose();
  };

  // Copy to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(previewCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 rounded-lg shadow-2xl border border-studio-600 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-studio-700 border-b border-studio-600">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Step Sequencer</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Steps:</span>
              {STEP_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setSteps(n)}
                  className={`px-2 py-1 text-xs rounded ${
                    steps === n
                      ? 'bg-accent-primary text-black'
                      : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs bg-red-600/50 text-red-200 rounded hover:bg-red-600 flex items-center gap-1"
              title="Limpiar todo"
            >
              <Trash2 size={12} />
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-max">
            {/* Step numbers header */}
            <div className="flex mb-2">
              <div className="w-28 flex-shrink-0" /> {/* Space for sound labels */}
              <div className="flex gap-0.5">
                {Array.from({ length: steps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-5 flex items-center justify-center text-xs ${
                      i % 4 === 0 ? 'text-gray-400' : 'text-gray-600'
                    } ${currentStep === i && isPlaying ? 'text-accent-primary font-bold' : ''}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Sound rows */}
            {sounds.map((sound, rowIndex) => (
              <div key={sound.id} className="flex items-center mb-1 group">
                {/* Sound selector */}
                <div className="w-28 flex-shrink-0 flex items-center gap-1 pr-2">
                  <div
                    className="w-2 h-8 rounded-sm"
                    style={{ backgroundColor: sound.color }}
                  />
                  <select
                    value={sound.id}
                    onChange={(e) => changeSound(sound.id, e.target.value)}
                    className="flex-1 px-1 py-1 text-xs bg-studio-700 border border-studio-600 rounded text-white"
                  >
                    {DEFAULT_SOUNDS.map(s => (
                      <option key={s.id} value={s.id} disabled={sounds.some(x => x.id === s.id && x.id !== sound.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => clearSound(sound.id)}
                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Limpiar fila"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Steps */}
                <div className="flex gap-0.5">
                  {grid[sound.id]?.map((active, stepIndex) => {
                    const isBeat = stepIndex % 4 === 0;
                    const isCurrentStep = currentStep === stepIndex && isPlaying;

                    return (
                      <button
                        key={stepIndex}
                        onClick={() => toggleStep(sound.id, stepIndex)}
                        className={`w-8 h-8 rounded transition-all ${
                          active
                            ? 'shadow-lg scale-105'
                            : isBeat
                            ? 'bg-studio-600 hover:bg-studio-500'
                            : 'bg-studio-700 hover:bg-studio-600'
                        } ${isCurrentStep ? 'ring-2 ring-white' : ''}`}
                        style={{
                          backgroundColor: active ? sound.color : undefined,
                          boxShadow: active ? `0 0 10px ${sound.color}50` : undefined
                        }}
                      />
                    );
                  })}
                </div>

                {/* Remove button */}
                {sounds.length > 1 && (
                  <button
                    onClick={() => removeSound(sound.id)}
                    className="ml-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar sonido"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}

            {/* Add sound button */}
            {sounds.length < DEFAULT_SOUNDS.length && (
              <button
                onClick={addSound}
                className="mt-2 px-3 py-1 text-xs bg-studio-700 text-gray-400 rounded hover:bg-studio-600 hover:text-white flex items-center gap-1"
              >
                <Plus size={12} />
                Agregar sonido
              </button>
            )}
          </div>
        </div>

        {/* Preview & Actions */}
        <div className="border-t border-studio-600 bg-studio-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Codigo generado:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-studio-900 rounded text-accent-tertiary font-mono text-sm overflow-x-auto">
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
              onClick={applyToLayer}
              className="px-4 py-2 bg-accent-primary text-black rounded font-medium hover:bg-emerald-400 flex items-center gap-2"
            >
              <Play size={16} />
              Aplicar a Layer {selectedLayerIndex + 1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
