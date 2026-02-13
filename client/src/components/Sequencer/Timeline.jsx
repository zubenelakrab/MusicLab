import { useState } from 'react';
import { Plus, VolumeX, Volume2, Headphones, Trash2, Sliders } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import LayerScope from './LayerScope';
import EffectsRack from '../EffectsRack/EffectsRack';

// Colors for layers
const LAYER_COLORS = [
  'bg-accent-primary',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-cyan-500',
];

export default function Timeline() {
  const {
    currentPattern,
    selectedLayerIndex,
    selectLayer,
    toggleLayerMute,
    toggleLayerSolo,
    updateLayerParams,
    addLayer,
    removeLayer,
  } = useStore();

  const { isPlaying } = useStrudel();
  const [showEffects, setShowEffects] = useState(false);
  const [effectsLayerIndex, setEffectsLayerIndex] = useState(null);

  const layers = currentPattern.layers || [];
  const selectedLayer = layers[selectedLayerIndex];

  // Check if any layer is soloed
  const hasSolo = layers.some(l => l.solo);

  // Check if layer has active effects
  const hasActiveEffects = (layer) => {
    const p = layer.params;
    return (p?.reverb > 0 || p?.delay > 0 || p?.distortion > 0 || p?.hpf > 20 || p?.phaser > 0);
  };

  // Open effects rack for a specific layer
  const openEffectsForLayer = (index) => {
    selectLayer(index);
    setEffectsLayerIndex(index);
    setShowEffects(true);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 pro-header">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Layers</span>
          {isPlaying && (
            <span className="text-xs text-accent-primary animate-pulse">
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={() => addLayer()}
          className="btn-pro px-2 py-1 text-xs bg-accent-primary text-black rounded-lg hover:bg-emerald-400 flex items-center gap-1"
        >
          <Plus size={14} />
          <span>Layer</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Layers list */}
        <div className="flex-1 overflow-y-auto">
          {layers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Add a layer to get started
            </div>
          ) : (
            layers.map((layer, index) => {
              const isActive = !layer.muted && (!hasSolo || layer.solo);
              const isSelected = index === selectedLayerIndex;
              const color = LAYER_COLORS[index % LAYER_COLORS.length];

              return (
                <div
                  key={layer.id}
                  onClick={() => selectLayer(index)}
                  className={`flex items-center border-b border-studio-700 cursor-pointer transition-colors ${
                    isSelected ? 'bg-studio-600' : 'hover:bg-studio-700'
                  }`}
                >
                  {/* Color indicator */}
                  <div className={`w-2 h-14 ${color} ${!isActive ? 'opacity-30' : ''}`} />

                  {/* Layer info */}
                  <div className="w-28 flex-shrink-0 p-2 flex items-center gap-2 border-r border-studio-600">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                        {layer.name}
                      </div>
                    </div>

                    {/* Mute/Solo/Delete buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerMute(index);
                        }}
                        className={`btn-pro w-5 h-5 rounded flex items-center justify-center ${
                          layer.muted
                            ? 'bg-red-600 text-white'
                            : 'bg-studio-500 text-gray-400 hover:bg-studio-400'
                        }`}
                        title="Mute"
                      >
                        {layer.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerSolo(index);
                        }}
                        className={`btn-pro w-5 h-5 rounded flex items-center justify-center ${
                          layer.solo
                            ? 'bg-yellow-500 text-black'
                            : 'bg-studio-500 text-gray-400 hover:bg-studio-400'
                        }`}
                        title="Solo"
                      >
                        <Headphones size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEffectsForLayer(index);
                        }}
                        className={`btn-pro w-5 h-5 rounded flex items-center justify-center ${
                          hasActiveEffects(layer)
                            ? 'bg-cyan-500 text-black'
                            : 'bg-studio-500 text-gray-400 hover:bg-cyan-600 hover:text-white'
                        }`}
                        title="Effects"
                      >
                        <Sliders size={12} />
                      </button>
                      {layers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLayer(index);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center bg-studio-500 text-gray-400 hover:bg-red-600 hover:text-white"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Oscilloscope - FT2 style */}
                  <div className="w-24 h-10 flex-shrink-0 mx-2 rounded overflow-hidden border border-studio-600">
                    <LayerScope
                      layerIndex={index}
                      isActive={isActive}
                      isPlaying={isPlaying}
                    />
                  </div>

                  {/* Pattern code */}
                  <div className="flex-1 p-2 overflow-hidden">
                    {layer.code && layer.code.trim() ? (
                      <div
                        className={`h-10 rounded flex items-center px-3 ${color} ${
                          !isActive ? 'opacity-30' : 'opacity-80'
                        }`}
                      >
                        <span className="text-sm text-black font-mono truncate font-medium">
                          {layer.code}
                        </span>
                      </div>
                    ) : (
                      <div className="h-10 flex items-center">
                        <span className="text-sm text-gray-600 italic">
                          No code
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected layer parameters panel */}
        {selectedLayer && (
          <div className="w-64 flex-shrink-0 border-l border-studio-600 bg-studio-700 p-3 overflow-y-auto">
            <div className="text-xs text-gray-500 uppercase mb-3">
              {selectedLayer.name}
            </div>

            {/* Gain */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Volume</span>
                <span className="text-accent-primary font-mono">
                  {Math.round((selectedLayer.params?.gain ?? 0.8) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedLayer.params?.gain ?? 0.8}
                onChange={(e) => updateLayerParams(selectedLayerIndex, { gain: Number(e.target.value) })}
                className="w-full accent-accent-primary"
              />
            </div>

            {/* Pan */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Pan</span>
                <span className="text-accent-primary font-mono">
                  {(selectedLayer.params?.pan ?? 0) === 0
                    ? 'C'
                    : (selectedLayer.params?.pan ?? 0) < 0
                    ? `L${Math.abs(Math.round((selectedLayer.params?.pan ?? 0) * 100))}`
                    : `R${Math.round((selectedLayer.params?.pan ?? 0) * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={selectedLayer.params?.pan ?? 0}
                onChange={(e) => updateLayerParams(selectedLayerIndex, { pan: Number(e.target.value) })}
                className="w-full accent-accent-primary"
              />
            </div>

            {/* Speed */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Speed</span>
                <span className="text-accent-primary font-mono">
                  {(selectedLayer.params?.speed ?? 1).toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={4}
                step={0.01}
                value={selectedLayer.params?.speed ?? 1}
                onChange={(e) => updateLayerParams(selectedLayerIndex, { speed: Number(e.target.value) })}
                className="w-full accent-accent-primary"
              />
            </div>

            {/* Cutoff */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Filter</span>
                <span className="text-accent-primary font-mono">
                  {Math.round(selectedLayer.params?.cutoff ?? 8000)} Hz
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={8000}
                step={10}
                value={selectedLayer.params?.cutoff ?? 8000}
                onChange={(e) => updateLayerParams(selectedLayerIndex, { cutoff: Number(e.target.value) })}
                className="w-full accent-accent-primary"
              />
            </div>

            {/* Resonance */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Resonance</span>
                <span className="text-accent-primary font-mono">
                  {Math.round(selectedLayer.params?.resonance ?? 0)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={selectedLayer.params?.resonance ?? 0}
                onChange={(e) => updateLayerParams(selectedLayerIndex, { resonance: Number(e.target.value) })}
                className="w-full accent-accent-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Effects Rack Modal */}
      <EffectsRack
        isOpen={showEffects}
        onClose={() => setShowEffects(false)}
      />
    </div>
  );
}
