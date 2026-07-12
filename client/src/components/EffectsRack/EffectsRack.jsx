import { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, Waves, Clock, Zap, Filter, Activity } from 'lucide-react';
import { useStore } from '../../store';

// Static Tailwind class maps so JIT/purge keeps the color variants in the build.
// (Dynamically-built class names like `border-${color}-500/50` get purged.)
const COLOR_CLASSES = {
  blue: {
    container: 'border-blue-500/50 bg-blue-500/10',
    icon: 'text-blue-400',
    label: 'text-blue-400',
    badge: 'bg-blue-500/30 text-blue-300',
  },
  purple: {
    container: 'border-purple-500/50 bg-purple-500/10',
    icon: 'text-purple-400',
    label: 'text-purple-400',
    badge: 'bg-purple-500/30 text-purple-300',
  },
  red: {
    container: 'border-red-500/50 bg-red-500/10',
    icon: 'text-red-400',
    label: 'text-red-400',
    badge: 'bg-red-500/30 text-red-300',
  },
  yellow: {
    container: 'border-yellow-500/50 bg-yellow-500/10',
    icon: 'text-yellow-400',
    label: 'text-yellow-400',
    badge: 'bg-yellow-500/30 text-yellow-300',
  },
  green: {
    container: 'border-green-500/50 bg-green-500/10',
    icon: 'text-green-400',
    label: 'text-green-400',
    badge: 'bg-green-500/30 text-green-300',
  },
};

// Effect section component
function EffectSection({ name, icon: Icon, active, children, color }) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        active ? c.container : 'border-studio-600 bg-studio-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          size={16}
          className={active ? c.icon : 'text-gray-500'}
        />
        <span
          className={`text-sm font-medium ${active ? c.label : 'text-gray-400'}`}
        >
          {name}
        </span>
        {active && (
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${c.badge} shadow-sm`}>
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
          className="absolute top-0 left-0 h-2 bg-accent-primary/30 rounded-full transition-all rounded-lg pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function EffectsRack({ isOpen, onClose }) {
  const editingClip = useStore((s) => s.editingClip);
  const arrangement = useStore((s) => s.arrangement);
  const updateEditingClipParams = useStore((s) => s.updateEditingClipParams);

  const [localParams, setLocalParams] = useState({});

  // Resolve the clip currently open in the editor - this is what actually plays,
  // so effects must be written to its layer params (not the legacy currentPattern).
  const clipInfo = useMemo(() => {
    if (!editingClip) return null;
    const track = arrangement.tracks.find((t) => t.id === editingClip.trackId);
    if (!track) return null;
    const clip = track.clips.find((c) => c.id === editingClip.clipId);
    if (!clip) return null;
    return { track, clip, params: clip.layers?.[0]?.params || null };
  }, [editingClip, arrangement]);

  const hasClip = !!clipInfo;
  const layerParams = clipInfo?.params;

  // Sync local params with the clip layer params
  useEffect(() => {
    if (layerParams) {
      setLocalParams({
        reverb: layerParams.reverb ?? 0,
        reverbSize: layerParams.reverbSize ?? 2,
        delay: layerParams.delay ?? 0,
        delayTime: layerParams.delayTime ?? 0.25,
        delayFeedback: layerParams.delayFeedback ?? 0.3,
        distortion: layerParams.distortion ?? 0,
        hpf: layerParams.hpf ?? 0,
        phaser: layerParams.phaser ?? 0,
        phaserDepth: layerParams.phaserDepth ?? 0.5,
      });
    }
  }, [layerParams]);

  // Update param locally and in the editing clip (heard in real time)
  const updateParam = (key, value) => {
    setLocalParams(prev => ({ ...prev, [key]: value }));
    updateEditingClipParams({ [key]: value });
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
    updateEditingClipParams(resetParams);
  };

  // Check if any effect is active
  const hasActiveEffects =
    localParams.reverb > 0 ||
    localParams.delay > 0 ||
    localParams.distortion > 0 ||
    localParams.hpf > 20 ||
    localParams.phaser > 0;

  if (!isOpen) return null;

  if (!hasClip) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-gradient-to-b from-studio-800 to-studio-900 rounded-2xl shadow-panel border border-white/[0.06] animate-scale-in w-full max-w-md p-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Effects Rack</h2>
          <p className="text-sm text-gray-400 mb-5">
            Select a clip in the timeline to edit its effects.
          </p>
          <button
            onClick={onClose}
            className="btn-pro px-4 py-2 bg-accent-primary text-black rounded-lg font-medium hover:bg-emerald-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-studio-800 to-studio-900 rounded-2xl shadow-panel border border-white/[0.06] animate-scale-in w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pro-header bg-gradient-modal">
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
              Clip: <span className="text-white">{clipInfo?.clip.name || 'None'}</span>
            </span>
            <button
              onClick={resetAll}
              className="btn-pro px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1"
              title="Reset all effects"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button onClick={onClose} className="btn-pro p-1.5 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-lg">
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
                className="btn-pro px-2 py-1 text-xs bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600/50"
              >
                Big Room
              </button>
              <button
                onClick={() => {
                  updateParam('delay', 0.3);
                  updateParam('delayTime', 0.375);
                  updateParam('delayFeedback', 0.4);
                }}
                className="btn-pro px-2 py-1 text-xs bg-purple-600/30 text-purple-300 rounded hover:bg-purple-600/50"
              >
                Echo
              </button>
              <button
                onClick={() => {
                  updateParam('distortion', 3);
                }}
                className="btn-pro px-2 py-1 text-xs bg-red-600/30 text-red-300 rounded hover:bg-red-600/50"
              >
                Dirty
              </button>
              <button
                onClick={() => {
                  updateParam('hpf', 300);
                }}
                className="btn-pro px-2 py-1 text-xs bg-yellow-600/30 text-yellow-300 rounded hover:bg-yellow-600/50"
              >
                Radio
              </button>
              <button
                onClick={() => {
                  updateParam('phaser', 2);
                  updateParam('phaserDepth', 0.7);
                }}
                className="btn-pro px-2 py-1 text-xs bg-green-600/30 text-green-300 rounded hover:bg-green-600/50"
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
                className="btn-pro px-2 py-1 text-xs bg-accent-primary/30 text-accent-primary rounded hover:bg-accent-primary/50"
              >
                Ambient
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 pro-header border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Effects are applied in real time to the selected clip
            </p>
            <button
              onClick={onClose}
              className="btn-pro px-4 py-2 bg-accent-primary text-black rounded-lg font-medium hover:bg-emerald-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
