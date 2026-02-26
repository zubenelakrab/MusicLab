import { Play, Square, Circle, Download, Loader2, X } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { useRecording } from '../../hooks/useRecording';

export default function Controls() {
  const bpm = useStore((state) => state.bpm);
  const setBpm = useStore((state) => state.setBpm);
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
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isPlaying
            ? 'bg-accent-secondary hover:bg-red-500 shadow-glow-secondary animate-glow-pulse'
            : 'bg-accent-primary hover:bg-emerald-400 shadow-glow-primary'
        }`}
        title={isPlaying ? 'Stop' : 'Play'}
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
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-600 hover:bg-red-500 animate-glow-pulse shadow-glow-secondary'
            : 'bg-studio-600 hover:bg-studio-500'
        } ${!audioReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Stop recording' : 'Record'}
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
            className="btn-pro px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-1 disabled:opacity-50"
            title="Download as WAV"
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
            className="btn-pro px-2 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center gap-1"
            title="Download as WebM"
          >
            <Download size={12} />
            WebM
          </button>
          <button
            onClick={clear}
            className="px-1 py-1 text-xs bg-studio-600 text-gray-400 rounded hover:bg-red-600 hover:text-white"
            title="Discard recording"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* BPM controls */}
      <div className="flex items-center gap-2 border-l border-studio-600 pl-3">
        <span className="text-xs text-gray-500 font-medium">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          min={40}
          max={300}
          className="input-pro w-14 px-1 py-0.5 rounded text-center text-white text-sm font-mono font-bold"
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
