import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';

export default function Controls() {
  const { bpm, setBpm } = useStore();
  const { isPlaying, toggle, error, audioReady } = useStrudel();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          isPlaying
            ? 'bg-accent-secondary hover:bg-red-500'
            : 'bg-accent-primary hover:bg-emerald-400'
        }`}
        title={isPlaying ? 'Detener' : 'Reproducir'}
      >
        {isPlaying ? '■' : '▶'}
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          min={40}
          max={300}
          className="w-14 px-1 py-0.5 bg-studio-700 border border-studio-600 rounded text-center text-white text-sm"
        />
        <input
          type="range"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          min={40}
          max={300}
          className="w-20 accent-accent-primary"
        />
      </div>

      {!audioReady && (
        <span className="text-xs text-yellow-500">
          Click ▶ para iniciar
        </span>
      )}

      {error && (
        <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
