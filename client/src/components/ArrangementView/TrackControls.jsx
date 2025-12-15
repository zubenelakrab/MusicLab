import { useState } from 'react';
import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useStore } from '../../store';

export default function TrackControls({ track }) {
  const {
    toggleArrangementTrackMute,
    toggleArrangementTrackSolo,
    updateArrangementTrackParams,
    updateArrangementTrack,
    removeArrangementTrack,
    arrangement,
    arrangementView,
    selectTrack,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);

  const canDelete = arrangement.tracks.length > 1;
  const isSelected = arrangementView.selectedTrackId === track.id;

  const handleNameSubmit = () => {
    if (editName.trim()) {
      updateArrangementTrack(track.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleVolumeChange = (e) => {
    updateArrangementTrackParams(track.id, { gain: Number(e.target.value) });
  };

  const handlePanChange = (e) => {
    updateArrangementTrackParams(track.id, { pan: Number(e.target.value) });
  };

  return (
    <div
      className={`flex flex-col border-b border-studio-700 px-2 py-1.5 ${
        isSelected ? 'bg-studio-700/50' : ''
      }`}
      style={{
        height: track.height,
        borderLeftWidth: 3,
        borderLeftColor: track.color,
      }}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track name row */}
      <div className="flex items-center justify-between mb-1">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="flex-1 px-1 py-0.5 text-xs bg-studio-600 border border-studio-500 rounded text-white focus:outline-none focus:border-accent-primary"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs font-medium text-white truncate cursor-pointer hover:text-accent-primary flex-1"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Double-click to rename"
          >
            {track.name}
          </span>
        )}

        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeArrangementTrack(track.id);
            }}
            className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete track"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Mute/Solo buttons */}
      <div className="flex items-center gap-1 mb-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleArrangementTrackMute(track.id);
          }}
          className={`flex-1 px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
            track.muted
              ? 'bg-red-600 text-white'
              : 'bg-studio-600 text-gray-400 hover:bg-studio-500'
          }`}
        >
          M
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleArrangementTrackSolo(track.id);
          }}
          className={`flex-1 px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
            track.solo
              ? 'bg-yellow-500 text-black'
              : 'bg-studio-600 text-gray-400 hover:bg-studio-500'
          }`}
        >
          S
        </button>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-1.5 mb-1">
        {track.muted ? (
          <VolumeX size={10} className="text-red-400 flex-shrink-0" />
        ) : (
          <Volume2 size={10} className="text-gray-500 flex-shrink-0" />
        )}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={track.params.gain}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
        <span className="text-[9px] text-gray-500 w-5 text-right">
          {Math.round(track.params.gain * 100)}
        </span>
      </div>

      {/* Pan slider */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-gray-500">L</span>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={track.params.pan}
          onChange={handlePanChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1 bg-studio-600 rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
        <span className="text-[9px] text-gray-500">R</span>
      </div>
    </div>
  );
}
