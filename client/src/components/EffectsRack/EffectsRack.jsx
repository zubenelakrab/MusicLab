import { useState, useEffect } from 'react';
import { X, RotateCcw, Waves, Clock, Zap, Filter, Activity } from 'lucide-react';
import { useStore } from '../../store';

// Effect section component
function EffectSection({ name, icon: Icon, active, children, color }) {
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        active
          ? `border-${color}-500/50 bg-${color}-500/10`
          : 'border-studio-600 bg-studio-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          size={16}
          className={active ? `text-${color}-400` : 'text-gray-500'}
        />
        <span
          className={`text-sm font-medium ${
            active ? `text-${color}-400` : 'text-gray-400'
          }`}
        >
          {name}
        </span>
        {active && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded bg-${color}-500/30 text-${color}-300`}>
            ON
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Slider component for effects
function EffectSlider({ label, value, onChange, min, max, step = 0.01, unit = '', disabled }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-accent-primary font-mono">
          {typeof value === 'number' ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
        <div
          className="absolute top-0 left-0 h-2 bg-accent-primary/30 rounded-lg pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function EffectsRack({ isOpen, onClose }) {
  const {
    currentPattern,
    selectedLayerIndex,
    updateLayerParams,
  } = useStore();

  const [localParams, setLocalParams] = useState({});

  // Get selected layer
  const selectedLayer = currentPattern.layers?.[selectedLayerIndex];

  // Sync local params with layer params
  useEffect(() => {
    if (selectedLayer?.params) {
      setLocalParams({
        reverb: selectedLayer.params.reverb ?? 0,
        reverbSize: selectedLayer.params.reverbSize ?? 2,
        delay: selectedLayer.params.delay ?? 0,
        delayTime: selectedLayer.params.delayTime ?? 0.25,
        delayFeedback: selectedLayer.params.delayFeedback ?? 0.3,
        distortion: selectedLayer.params.distortion ?? 0,
        hpf: selectedLayer.params.hpf ?? 0,
        phaser: selectedLayer.params.phaser ?? 0,
        phaserDepth: selectedLayer.params.phaserDepth ?? 0.5,
      });
    }
  }, [selectedLayer, selectedLayerIndex]);

  // Update param locally and in store
  const updateParam = (key, value) => {
    setLocalParams(prev => ({ ...prev, [key]: value }));
    updateLayerParams(selectedLayerIndex, { [key]: value });
  };

  // Reset all effects
  const resetAll = () => {
    const resetParams = {
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
    setLocalParams(resetParams);
    updateLayerParams(selectedLayerIndex, resetParams);
  };

  // Check if any effect is active
  const hasActiveEffects =
    localParams.reverb > 0 ||
    localParams.delay > 0 ||
    localParams.distortion > 0 ||
    localParams.hpf > 20 ||
    localParams.phaser > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 rounded-lg shadow-2xl border border-studio-600 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-studio-700 border-b border-studio-600">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Effects Rack</h2>
            {hasActiveEffects && (
              <span className="text-xs px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                {[
                  localParams.reverb > 0 && 'REV',
                  localParams.delay > 0 && 'DLY',
                  localParams.distortion > 0 && 'DIST',
                  localParams.hpf > 20 && 'HPF',
                  localParams.phaser > 0 && 'PHS',
                ]
                  .filter(Boolean)
                  .join(' + ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Layer: <span className="text-white">{selectedLayer?.name || `Layer ${selectedLayerIndex + 1}`}</span>
            </span>
            <button
              onClick={resetAll}
              className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1"
              title="Reset all effects"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Effects Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* REVERB */}
            <EffectSection
              name="Reverb"
              icon={Waves}
              active={localParams.reverb > 0}
              color="blue"
            >
              <EffectSlider
                label="Mix"
                value={localParams.reverb}
                onChange={(v) => updateParam('reverb', v)}
                min={0}
                max={1}
              />
              <EffectSlider
                label="Size"
                value={localParams.reverbSize}
                onChange={(v) => updateParam('reverbSize', v)}
                min={0.5}
                max={10}
                step={0.1}
                disabled={localParams.reverb === 0}
              />
            </EffectSection>

            {/* DELAY */}
            <EffectSection
              name="Delay"
              icon={Clock}
              active={localParams.delay > 0}
              color="purple"
            >
              <EffectSlider
                label="Mix"
                value={localParams.delay}
                onChange={(v) => updateParam('delay', v)}
                min={0}
                max={1}
              />
              <EffectSlider
                label="Time"
                value={localParams.delayTime}
                onChange={(v) => updateParam('delayTime', v)}
                min={0.01}
                max={1}
                disabled={localParams.delay === 0}
              />
              <EffectSlider
                label="Feedback"
                value={localParams.delayFeedback}
                onChange={(v) => updateParam('delayFeedback', v)}
                min={0}
                max={0.95}
                disabled={localParams.delay === 0}
              />
            </EffectSection>

            {/* DISTORTION */}
            <EffectSection
              name="Distortion"
              icon={Zap}
              active={localParams.distortion > 0}
              color="red"
            >
              <EffectSlider
                label="Amount"
                value={localParams.distortion}
                onChange={(v) => updateParam('distortion', v)}
                min={0}
                max={10}
                step={0.1}
              />
            </EffectSection>

            {/* HIGH-PASS FILTER */}
            <EffectSection
              name="High-Pass Filter"
              icon={Filter}
              active={localParams.hpf > 20}
              color="yellow"
            >
              <EffectSlider
                label="Frequency"
                value={localParams.hpf}
                onChange={(v) => updateParam('hpf', v)}
                min={0}
                max={2000}
                step={10}
                unit=" Hz"
              />
            </EffectSection>

            {/* PHASER */}
            <div className="col-span-2">
              <EffectSection
                name="Phaser"
                icon={Activity}
                active={localParams.phaser > 0}
                color="green"
              >
                <div className="grid grid-cols-2 gap-4">
                  <EffectSlider
                    label="Rate"
                    value={localParams.phaser}
                    onChange={(v) => updateParam('phaser', v)}
                    min={0}
                    max={8}
                    step={0.1}
                    unit=" Hz"
                  />
                  <EffectSlider
                    label="Depth"
                    value={localParams.phaserDepth}
                    onChange={(v) => updateParam('phaserDepth', v)}
                    min={0}
                    max={1}
                    disabled={localParams.phaser === 0}
                  />
                </div>
              </EffectSection>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-4 pt-4 border-t border-studio-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  updateParam('reverb', 0.4);
                  updateParam('reverbSize', 4);
                }}
                className="px-2 py-1 text-xs bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600/50"
              >
                Big Room
              </button>
              <button
                onClick={() => {
                  updateParam('delay', 0.3);
                  updateParam('delayTime', 0.375);
                  updateParam('delayFeedback', 0.4);
                }}
                className="px-2 py-1 text-xs bg-purple-600/30 text-purple-300 rounded hover:bg-purple-600/50"
              >
                Echo
              </button>
              <button
                onClick={() => {
                  updateParam('distortion', 3);
                }}
                className="px-2 py-1 text-xs bg-red-600/30 text-red-300 rounded hover:bg-red-600/50"
              >
                Dirty
              </button>
              <button
                onClick={() => {
                  updateParam('hpf', 300);
                }}
                className="px-2 py-1 text-xs bg-yellow-600/30 text-yellow-300 rounded hover:bg-yellow-600/50"
              >
                Radio
              </button>
              <button
                onClick={() => {
                  updateParam('phaser', 2);
                  updateParam('phaserDepth', 0.7);
                }}
                className="px-2 py-1 text-xs bg-green-600/30 text-green-300 rounded hover:bg-green-600/50"
              >
                Phased
              </button>
              <button
                onClick={() => {
                  updateParam('reverb', 0.3);
                  updateParam('reverbSize', 3);
                  updateParam('delay', 0.2);
                  updateParam('delayTime', 0.25);
                }}
                className="px-2 py-1 text-xs bg-accent-primary/30 text-accent-primary rounded hover:bg-accent-primary/50"
              >
                Ambient
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-studio-700 border-t border-studio-600">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Los efectos se aplican en tiempo real al layer seleccionado
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent-primary text-black rounded font-medium hover:bg-emerald-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
