import { Play, Square, Circle, Download, Loader2, X } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { useRecording } from '../../hooks/useRecording';

export default function Controls() {
  const { bpm, setBpm } = useStore();
  const { isPlaying, toggle, error, audioReady } = useStrudel();
  const {
    isRecording,
    formattedDuration,
    hasRecording,
    isConverting,
    start: startRecording,
    stop: stopRecording,
    download,
    clear,
  } = useRecording();

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Play/Stop button */}
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isPlaying
            ? 'bg-accent-secondary hover:bg-red-500'
            : 'bg-accent-primary hover:bg-emerald-400'
        }`}
        title={isPlaying ? 'Detener' : 'Reproducir'}
      >
        {isPlaying ? (
          <Square size={14} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Record button */}
      <button
        onClick={handleRecordClick}
        disabled={!audioReady}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-600 hover:bg-red-500 animate-pulse'
            : 'bg-studio-600 hover:bg-studio-500'
        } ${!audioReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Detener grabacion' : 'Grabar'}
      >
        <Circle
          size={14}
          fill={isRecording ? 'currentColor' : 'none'}
          className={isRecording ? 'text-white' : 'text-red-400'}
        />
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <span className="text-xs text-red-400 font-mono flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          REC {formattedDuration}
        </span>
      )}

      {/* Download buttons when recording available */}
      {hasRecording && !isRecording && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => download('wav')}
            disabled={isConverting}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center gap-1 disabled:opacity-50"
            title="Descargar como WAV"
          >
            {isConverting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Download size={12} />
            )}
            WAV
          </button>
          <button
            onClick={() => download('webm')}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1"
            title="Descargar como WebM"
          >
            <Download size={12} />
            WebM
          </button>
          <button
            onClick={clear}
            className="px-1 py-1 text-xs bg-studio-600 text-gray-400 rounded hover:bg-red-600 hover:text-white"
            title="Descartar grabacion"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* BPM controls */}
      <div className="flex items-center gap-2 border-l border-studio-600 pl-3">
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
        <span className="text-xs text-yellow-500 flex items-center gap-1">
          <Play size={12} /> Click to start
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
