import { useStore } from '../../store';

export default function Playhead({ position, pixelsPerBar, scrollX }) {
  const { isPlaying } = useStore();

  const left = position * pixelsPerBar;

  // Don't render if off-screen (optimization)
  if (left < scrollX - 20 || left > scrollX + window.innerWidth) {
    return null;
  }

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20"
      style={{
        left,
        boxShadow: isPlaying ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none',
      }}
    >
      {/* Playhead triangle */}
      <div
        className="absolute -top-1 -left-1.5 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #ef4444',
        }}
      />
    </div>
  );
}
