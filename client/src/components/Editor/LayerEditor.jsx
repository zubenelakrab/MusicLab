import { useStore } from '../../store';
import Slider from './Slider';

export default function LayerEditor() {
  const {
    currentPattern,
    selectedLayerIndex,
    selectLayer,
    addLayer,
    removeLayer,
    updateLayer,
    updateLayerParams,
    toggleLayerMute,
    toggleLayerSolo,
  } = useStore();

  const { layers } = currentPattern;
  const selectedLayer = layers[selectedLayerIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 bg-studio-700 border-b border-studio-600 flex items-center justify-between">
        <span className="text-sm text-gray-400">Layers</span>
        <button
          onClick={() => addLayer()}
          className="text-xs px-2 py-1 bg-accent-primary text-black rounded hover:bg-accent-primary/80 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Layer list */}
      <div className="flex-shrink-0 border-b border-studio-600 max-h-40 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onClick={() => selectLayer(index)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-studio-700 transition-colors ${
              index === selectedLayerIndex
                ? 'bg-studio-600'
                : 'bg-studio-800 hover:bg-studio-700'
            }`}
          >
            {/* Layer number */}
            <span className="text-xs text-gray-500 w-4">{index + 1}</span>

            {/* Layer name */}
            <input
              type="text"
              value={layer.name}
              onChange={(e) => updateLayer(index, { name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-sm text-gray-300 outline-none"
            />

            {/* Mute button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerMute(index);
              }}
              className={`text-xs px-1.5 py-0.5 rounded ${
                layer.muted
                  ? 'bg-red-600 text-white'
                  : 'bg-studio-600 text-gray-400 hover:bg-studio-500'
              }`}
              title="Mute layer"
            >
              M
            </button>

            {/* Solo button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerSolo(index);
              }}
              className={`text-xs px-1.5 py-0.5 rounded ${
                layer.solo
                  ? 'bg-yellow-500 text-black'
                  : 'bg-studio-600 text-gray-400 hover:bg-studio-500'
              }`}
              title="Solo - hear only this layer"
            >
              S
            </button>

            {/* Delete button */}
            {layers.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLayer(index);
                }}
                className="text-xs px-1.5 py-0.5 rounded bg-studio-600 text-gray-400 hover:bg-red-600 hover:text-white"
                title="Delete layer"
              >
                X
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Selected layer params */}
      {selectedLayer && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="text-xs text-gray-500 uppercase mb-2">
            Parameters: {selectedLayer.name}
          </div>

          {/* Gain */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Volume</span>
              <span className="text-accent-primary">
                {Math.round((selectedLayer.params.gain || 0.8) * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={selectedLayer.params.gain ?? 0.8}
              onChange={(v) => updateLayerParams(selectedLayerIndex, { gain: v })}
            />
          </div>

          {/* Pan */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Pan</span>
              <span className="text-accent-primary">
                {selectedLayer.params.pan === 0
                  ? 'C'
                  : selectedLayer.params.pan < 0
                  ? `L${Math.abs(Math.round(selectedLayer.params.pan * 100))}`
                  : `R${Math.round(selectedLayer.params.pan * 100)}`}
              </span>
            </div>
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={selectedLayer.params.pan ?? 0}
              onChange={(v) => updateLayerParams(selectedLayerIndex, { pan: v })}
            />
          </div>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Speed / Pitch</span>
              <span className="text-accent-primary">
                {(selectedLayer.params.speed || 1).toFixed(2)}x
              </span>
            </div>
            <Slider
              min={0.25}
              max={4}
              step={0.01}
              value={selectedLayer.params.speed ?? 1}
              onChange={(v) => updateLayerParams(selectedLayerIndex, { speed: v })}
            />
          </div>

          {/* Cutoff */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Filter (Cutoff)</span>
              <span className="text-accent-primary">
                {Math.round(selectedLayer.params.cutoff || 8000)} Hz
              </span>
            </div>
            <Slider
              min={100}
              max={8000}
              step={10}
              value={selectedLayer.params.cutoff ?? 8000}
              onChange={(v) => updateLayerParams(selectedLayerIndex, { cutoff: v })}
            />
          </div>

          {/* Resonance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Resonance</span>
              <span className="text-accent-primary">
                {Math.round(selectedLayer.params.resonance || 0)}
              </span>
            </div>
            <Slider
              min={0}
              max={20}
              step={0.5}
              value={selectedLayer.params.resonance ?? 0}
              onChange={(v) => updateLayerParams(selectedLayerIndex, { resonance: v })}
            />
          </div>

          {/* Code preview */}
          <div className="mt-4 p-2 bg-studio-900 rounded">
            <div className="text-xs text-gray-500 mb-1">Code:</div>
            <code className="text-xs text-accent-tertiary break-all">
              {selectedLayer.code || '(empty)'}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
