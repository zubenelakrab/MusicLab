import { useState, useRef, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { useStore } from '../../store';

export default function Clip({
  clip,
  track,
  pixelsPerBar,
  gridSubdivision,
  scrollContainerRef,
  trackControlsWidth,
}) {
  const {
    arrangementView,
    editingClip,
    selectClip,
    setEditingClip,
    moveClip,
    resizeClip,
    duplicateClip,
    removeClip,
  } = useStore();

  const clipRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialX, setInitialX] = useState(0);

  const isSelected = arrangementView.selectedClipIds.includes(clip.id);
  const isEditing = editingClip?.clipId === clip.id;

  const left = clip.startBar * pixelsPerBar;
  const width = clip.durationBars * pixelsPerBar;

  // Get the code from the clip's layers
  const clipCode = clip.layers?.[0]?.code || '';

  // Handle clip click - select and set for editing
  const handleClick = (e) => {
    e.stopPropagation();
    selectClip(clip.id, e.shiftKey || e.metaKey || e.ctrlKey);
    setEditingClip(track.id, clip.id);
  };

  // Start dragging
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const rect = clipRef.current.getBoundingClientRect();
    const isOnResizeHandle = e.clientX > rect.right - 10;

    if (isOnResizeHandle) {
      setIsResizing(true);
      setInitialWidth(width);
      setInitialX(e.clientX);
    } else {
      setIsDragging(true);
      setDragOffset(e.clientX - rect.left);
    }

    selectClip(clip.id, e.shiftKey || e.metaKey || e.ctrlKey);
    setEditingClip(track.id, clip.id);
  };

  // Handle drag/resize movement
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      if (isDragging) {
        const scrollContainer = scrollContainerRef?.current;
        const containerRect = scrollContainer?.getBoundingClientRect();
        const currentScrollX = scrollContainer?.scrollLeft ?? arrangementView.scrollX;
        const newX = containerRect
          ? e.clientX - containerRect.left - trackControlsWidth + currentScrollX - dragOffset
          : e.clientX - clipRef.current.parentElement.getBoundingClientRect().left - dragOffset;
        const newBar = newX / pixelsPerBar;
        moveClip(track.id, clip.id, newBar);
      }

      if (isResizing) {
        const deltaX = e.clientX - initialX;
        const newWidth = Math.max(pixelsPerBar / gridSubdivision, initialWidth + deltaX);
        const newDuration = newWidth / pixelsPerBar;
        resizeClip(track.id, clip.id, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    initialWidth,
    initialX,
    clip.id,
    track.id,
    pixelsPerBar,
    gridSubdivision,
    moveClip,
    resizeClip,
    scrollContainerRef,
    trackControlsWidth,
    arrangementView.scrollX,
  ]);

  const handleDuplicate = (e) => {
    e.stopPropagation();
    duplicateClip(track.id, clip.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    removeClip(track.id, clip.id);
  };

  return (
    <div
      ref={clipRef}
      className={`absolute top-1 bottom-1 rounded-md cursor-pointer select-none overflow-hidden transition-shadow ${
        isEditing
          ? 'ring-2 ring-accent-primary shadow-lg z-10'
          : isSelected
            ? 'ring-2 ring-white shadow-lg z-10'
            : 'hover:ring-1 hover:ring-white/50'
      } ${isDragging || isResizing ? 'opacity-80' : ''}`}
      style={{
        left,
        width,
        backgroundColor: clip.color || track.color,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Clip header */}
      <div className="flex items-center justify-between px-1.5 py-0.5 bg-black/20">
        <span className="text-[10px] font-medium text-white/90 truncate">
          {clip.name}
        </span>

        {isSelected && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleDuplicate}
              className="p-0.5 text-white/60 hover:text-white rounded"
              title="Duplicate"
            >
              <Copy size={10} />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 text-white/60 hover:text-red-400 rounded"
              title="Delete"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Code preview */}
      <div className="px-1.5 py-1 text-[9px] font-mono text-white/70 truncate bg-black/10">
        {clipCode || <span className="text-white/30 italic">empty</span>}
      </div>

      {/* Duration indicator */}
      <span className="absolute bottom-0.5 right-1 text-[8px] text-white/40">
        {clip.durationBars}b
      </span>

      {/* Editing indicator */}
      {isEditing && (
        <div className="absolute top-0 left-0 px-1 py-0.5 bg-accent-primary text-[8px] text-black font-bold rounded-br">
          EDITING
        </div>
      )}

      {/* Resize handle */}
      <div
        className={`absolute top-0 right-0 w-2 h-full cursor-ew-resize ${
          isSelected ? 'bg-white/30' : 'bg-transparent hover:bg-white/20'
        }`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          setInitialWidth(width);
          setInitialX(e.clientX);
          selectClip(clip.id);
          setEditingClip(track.id, clip.id);
        }}
      />
    </div>
  );
}
