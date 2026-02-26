import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Trash2, Plus, X, SlidersHorizontal } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';

export default function TrackControls({ track }) {
  const {
    toggleArrangementTrackMute,
    toggleArrangementTrackSolo,
    updateArrangementTrackParams,
    updateArrangementTrackGroove,
    toggleTrackAutomationLane,
    addTrackAutomationPoint,
    updateTrackAutomationPoint,
    removeTrackAutomationPoint,
    updateArrangementTrack,
    removeArrangementTrack,
    arrangement,
    arrangementView,
    playheadPosition,
    selectTrack,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const [selectedAutomationParam, setSelectedAutomationParam] = useState('gain');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);

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

  const automationParam = selectedAutomationParam;
  const lane = track.automation?.[automationParam];
  const lanePoints = lane?.points || [];
  const hasAutomationEnabled = Object.values(track.automation || {}).some((laneDef) => laneDef?.enabled);

  const addPointAtPlayhead = (e) => {
    e.stopPropagation();
    if (!lane) return;
    addTrackAutomationPoint(
      track.id,
      automationParam,
      Math.min(arrangement.lengthBars, playheadPosition),
      track.params?.[automationParam] ?? lane.max
    );
  };

  const updatePanelPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelWidth = 256;
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
    const left = Math.min(rect.right + margin, maxLeft);
    const top = Math.max(margin, Math.min(rect.top, window.innerHeight - 320));
    setPanelPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showAdvanced) return;
    updatePanelPosition();

    const handleReposition = () => updatePanelPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showAdvanced, updatePanelPosition]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col border-b border-studio-700 px-2 py-1.5 ${
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

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAdvanced((prev) => !prev);
            }}
            className={`p-0.5 rounded transition-colors ${
              showAdvanced || hasAutomationEnabled
                ? 'text-accent-primary hover:text-emerald-300'
                : 'text-gray-500 hover:text-white'
            }`}
            title="Open groove/automation panel"
          >
            <SlidersHorizontal size={11} />
          </button>
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

      {showAdvanced && createPortal(
        <div
          className="fixed z-[9999] w-64 rounded-lg border border-studio-500 bg-studio-800 shadow-panel p-2"
          style={{ top: panelPosition.top, left: panelPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">{track.name} Controls</span>
            <button
              onClick={() => setShowAdvanced(false)}
              className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-studio-600"
            >
              <X size={12} />
            </button>
          </div>

          <div className="space-y-1.5 mb-2 border-b border-studio-700 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-12">Swing</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={track.groove?.swing || 0}
                onChange={(e) => updateArrangementTrackGroove(track.id, { swing: Number(e.target.value) })}
                className="flex-1 h-1 accent-blue-500"
              />
              <span className="text-[10px] text-gray-300 w-8 text-right">{Math.round(track.groove?.swing || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 w-12">Human</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={track.groove?.humanize || 0}
                onChange={(e) => updateArrangementTrackGroove(track.id, { humanize: Number(e.target.value) })}
                className="flex-1 h-1 accent-purple-500"
              />
              <span className="text-[10px] text-gray-300 w-8 text-right">{Math.round(track.groove?.humanize || 0)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-gray-400">Auto</span>
              <select
                value={automationParam}
                onChange={(e) => setSelectedAutomationParam(e.target.value)}
                className="flex-1 text-[10px] bg-studio-700 border border-studio-600 rounded px-1 py-0.5 text-gray-100"
              >
                <option value="gain">Gain</option>
                <option value="pan">Pan</option>
                <option value="cutoff">Cutoff</option>
              </select>
              <button
                onClick={() => toggleTrackAutomationLane(track.id, automationParam, !lane?.enabled)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  lane?.enabled ? 'bg-emerald-600 text-white' : 'bg-studio-700 text-gray-300'
                }`}
              >
                {lane?.enabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={addPointAtPlayhead}
                className="p-0.5 rounded bg-studio-700 text-gray-300 hover:bg-studio-600"
                title="Add point at playhead"
              >
                <Plus size={11} />
              </button>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
              {lanePoints.slice(0, 8).map((point, index) => (
                <div key={`${automationParam}-${index}`} className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">B</span>
                  <input
                    type="number"
                    min={0}
                    max={arrangement.lengthBars}
                    step={0.25}
                    value={Number(point.bar.toFixed(2))}
                    onChange={(e) => updateTrackAutomationPoint(track.id, automationParam, index, { bar: Number(e.target.value) })}
                    className="w-12 px-1 py-0.5 text-[10px] bg-studio-700 border border-studio-600 rounded text-gray-100"
                  />
                  <input
                    type="range"
                    min={lane?.min ?? 0}
                    max={lane?.max ?? 1}
                    step={automationParam === 'cutoff' ? 10 : 0.01}
                    value={point.value}
                    onChange={(e) => updateTrackAutomationPoint(track.id, automationParam, index, { value: Number(e.target.value) })}
                    className="flex-1 h-1 accent-accent-primary"
                  />
                  <span className="text-[9px] text-gray-300 w-8 text-right">
                    {automationParam === 'cutoff'
                      ? Math.round(point.value)
                      : point.value.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeTrackAutomationPoint(track.id, automationParam, index)}
                    className="p-0.5 rounded text-gray-500 hover:text-red-400"
                    title="Remove point"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
