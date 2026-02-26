import { useRef, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store';
import { usePlayheadSync } from '../../hooks/useArrangement';
import ArrangementHeader from './ArrangementHeader';
import TimeRuler from './TimeRuler';
import TrackControls from './TrackControls';
import Clip from './Clip';
import Playhead from './Playhead';

const TRACK_CONTROLS_WIDTH = 180;

export default function ArrangementView() {
  const {
    arrangement,
    arrangementView,
    playheadPosition,
    setArrangementScrollX,
    addArrangementTrack,
    createInlineClip,
    deleteSelectedClips,
    clearSelection,
    selectTrack,
  } = useStore();

  // Sync playhead with engine
  usePlayheadSync();

  const scrollRef = useRef(null);

  const { zoom, scrollX, pixelsPerBar, gridSubdivision, snapToGrid } = arrangementView;
  const effectivePixelsPerBar = pixelsPerBar * zoom;
  const totalWidth = arrangement.lengthBars * effectivePixelsPerBar;

  // Calculate total tracks height
  const totalTracksHeight = arrangement.tracks.reduce((sum, t) => sum + t.height, 0);

  // Handle scroll sync
  const handleScroll = useCallback((e) => {
    setArrangementScrollX(e.target.scrollLeft);
  }, [setArrangementScrollX]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input, textarea, or code editor
      const target = e.target;
      const isEditable = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.isContentEditable ||
                         target.closest('.cm-editor'); // CodeMirror editor

      if (isEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (arrangementView.selectedClipIds.length > 0) {
          e.preventDefault();
          deleteSelectedClips();
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [arrangementView.selectedClipIds, deleteSelectedClips, clearSelection]);

  // Handle double-click on clip lane to create clip
  const handleLaneDoubleClick = (e, trackId) => {
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const bar = x / effectivePixelsPerBar;
    const snappedBar = snapToGrid
      ? Math.floor(bar * gridSubdivision) / gridSubdivision
      : bar;

    createInlineClip(trackId, snappedBar, 4);
  };

  // Handle drop on clip lane
  const handleLaneDrop = (e, trackId) => {
    e.preventDefault();
    const patternCode = e.dataTransfer.getData('patternCode');
    const patternName = e.dataTransfer.getData('patternName');

    if (patternCode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const bar = x / effectivePixelsPerBar;
      const snappedBar = snapToGrid
        ? Math.floor(bar * gridSubdivision) / gridSubdivision
        : bar;

      // Create inline clip with the pattern's code
      const store = useStore.getState();
      const track = store.arrangement.tracks.find(t => t.id === trackId);
      if (track) {
        store.addClip(trackId, snappedBar, 4, null, patternName || 'Clip');
        // Get the newly created clip and update its layers with the code
        const updatedTrack = useStore.getState().arrangement.tracks.find(t => t.id === trackId);
        const newClip = updatedTrack.clips[updatedTrack.clips.length - 1];
        if (newClip && newClip.layers) {
          const newLayers = newClip.layers.map((layer, i) =>
            i === 0 ? { ...layer, code: patternCode } : layer
          );
          store.updateClipLayers(trackId, newClip.id, newLayers);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-900 select-none overflow-hidden">
      {/* Header with controls */}
      <ArrangementHeader />

      {/* Main scrollable area - unified scroll for controls and clips */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        {/* Content wrapper with min-width for horizontal scroll */}
        <div className="relative" style={{ minWidth: TRACK_CONTROLS_WIDTH + totalWidth }}>
          {/* Header row: empty space + time ruler */}
          <div className="flex sticky top-0 z-10 bg-studio-900">
            {/* Empty space aligned with track controls */}
            <div
              className="flex-shrink-0 h-7 bg-studio-700 border-b border-r border-studio-600 sticky left-0 z-20"
              style={{ width: TRACK_CONTROLS_WIDTH }}
            />
            {/* Time ruler */}
            <div className="flex-1">
              <TimeRuler
                lengthBars={arrangement.lengthBars}
                pixelsPerBar={effectivePixelsPerBar}
                scrollX={scrollX}
                gridSubdivision={gridSubdivision}
                snapToGrid={snapToGrid}
              />
            </div>
          </div>

          {/* Track rows */}
          {arrangement.tracks.map((track) => {
            const isSelected = arrangementView.selectedTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`flex border-b border-studio-700 ${track.muted ? 'opacity-50' : ''}`}
                style={{ height: track.height }}
              >
                {/* Track controls - sticky left */}
                <div
                  className="flex-shrink-0 sticky left-0 z-10 bg-studio-800 border-r border-studio-600"
                  style={{ width: TRACK_CONTROLS_WIDTH }}
                >
                  <TrackControls track={track} />
                </div>

                {/* Clip lane */}
                <div
                  className={`relative flex-1 ${isSelected ? 'bg-studio-800/30' : ''}`}
                  style={{ width: totalWidth }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      selectTrack(track.id);
                    }
                  }}
                  onDoubleClick={(e) => handleLaneDoubleClick(e, track.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => handleLaneDrop(e, track.id)}
                >
                  {/* Grid lines for this track */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: totalWidth, height: '100%' }}
                  >
                    {Array.from({ length: arrangement.lengthBars + 1 }, (_, i) => (
                      <line
                        key={`bar-${i}`}
                        x1={i * effectivePixelsPerBar}
                        y1={0}
                        x2={i * effectivePixelsPerBar}
                        y2="100%"
                        stroke={i % 4 === 0 ? '#374151' : '#1f2937'}
                        strokeWidth={i % 4 === 0 ? 1 : 0.5}
                      />
                    ))}
                    {gridSubdivision > 1 && Array.from({ length: arrangement.lengthBars }, (_, barIdx) =>
                      Array.from({ length: gridSubdivision - 1 }, (_, subIdx) => {
                        const step = subIdx + 1;
                        const x = (barIdx + step / gridSubdivision) * effectivePixelsPerBar;
                        return (
                          <line
                            key={`sub-${barIdx}-${step}`}
                            x1={x}
                            y1={0}
                            x2={x}
                            y2="100%"
                            stroke="#111827"
                            strokeWidth={0.35}
                          />
                        );
                      })
                    )}
                  </svg>

                  {/* Clips */}
                  {track.clips.map((clip) => (
                    <Clip
                      key={clip.id}
                      clip={clip}
                      track={track}
                      pixelsPerBar={effectivePixelsPerBar}
                      gridSubdivision={gridSubdivision}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add track button row */}
          <div className="flex" style={{ height: 40 }}>
            <div
              className="flex-shrink-0 sticky left-0 z-10 bg-studio-800 border-r border-studio-600 flex items-center px-2"
              style={{ width: TRACK_CONTROLS_WIDTH }}
            >
              <button
                onClick={() => addArrangementTrack()}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-studio-700 rounded transition-colors"
              >
                <Plus size={14} />
                Add Track
              </button>
            </div>
            <div className="flex-1" style={{ width: totalWidth }} />
          </div>

          {/* Playhead - positioned absolutely over the clip area */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: TRACK_CONTROLS_WIDTH,
              top: 28, // Below time ruler
              height: totalTracksHeight + 40, // Tracks height + add track button
              width: totalWidth,
            }}
          >
            <Playhead
              position={playheadPosition}
              pixelsPerBar={effectivePixelsPerBar}
              scrollX={scrollX}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
