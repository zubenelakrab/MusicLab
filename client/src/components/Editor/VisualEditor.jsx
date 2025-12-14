import { useStore } from '../../store';
import Knob from './Knob';
import Slider from './Slider';

export default function VisualEditor() {
  const { currentPattern, updatePatternParams } = useStore();
  const { params } = currentPattern;

  const updateParam = (key, value) => {
    updatePatternParams({ [key]: value });
  };

  return (
    <div className="p-4 bg-studio-800 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Parameters</h3>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <Knob
          label="Gain"
          value={params.gain * 100}
          onChange={(v) => updateParam('gain', v / 100)}
          min={0}
          max={100}
        />
        <Knob
          label="Speed"
          value={params.speed * 100}
          onChange={(v) => updateParam('speed', v / 100)}
          min={25}
          max={200}
        />
        <Knob
          label="Cutoff"
          value={params.cutoff}
          onChange={(v) => updateParam('cutoff', v)}
          min={100}
          max={8000}
        />
        <Knob
          label="Resonance"
          value={params.resonance}
          onChange={(v) => updateParam('resonance', v)}
          min={0}
          max={100}
        />
      </div>

      <div className="space-y-4">
        <Slider
          label="Gain"
          value={params.gain}
          onChange={(v) => updateParam('gain', v)}
          min={0}
          max={1}
          step={0.01}
        />
        <Slider
          label="Cutoff"
          value={params.cutoff}
          onChange={(v) => updateParam('cutoff', v)}
          min={100}
          max={8000}
          step={10}
          unit=" Hz"
        />
        <Slider
          label="Speed"
          value={params.speed}
          onChange={(v) => updateParam('speed', v)}
          min={0.25}
          max={2}
          step={0.05}
          unit="x"
        />
      </div>
    </div>
  );
}
