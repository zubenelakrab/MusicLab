import { useRef } from 'react';
import { useStore } from '../../store';

export default function TimeRuler({
  lengthBars,
  pixelsPerBar,
  scrollX,
  gridSubdivision,
}) {
  const { setPlayheadPosition, arrangement } = useStore();
  const rulerRef = useRef(null);

  const totalWidth = lengthBars * pixelsPerBar;

  // Handle click to seek
  const handleClick = (e) => {
    if (!rulerRef.current) return;

    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollX;
    const bar = x / pixelsPerBar;

    // Snap to grid
    const snappedBar = Math.round(bar * gridSubdivision) / gridSubdivision;
    setPlayheadPosition(Math.max(0, Math.min(snappedBar, lengthBars)));
  };

  // Generate bar markers
  const markers = [];
  for (let bar = 0; bar <= lengthBars; bar++) {
    const x = bar * pixelsPerBar;
    const isMajor = bar % 4 === 0;

    // Only show label if enough space
    const showLabel = pixelsPerBar >= 25 || isMajor;

    markers.push(
      <div
        key={bar}
        className="absolute top-0 h-full flex flex-col items-center"
        style={{ left: x }}
      >
        {/* Tick mark */}
        <div
          className={`w-px ${isMajor ? 'h-3 bg-gray-400' : 'h-2 bg-gray-600'}`}
        />
        {/* Bar number */}
        {showLabel && (
          <span
            className={`text-[10px] mt-0.5 ${
              isMajor ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {bar + 1}
          </span>
        )}
      </div>
    );
  }

  // Loop markers
  const loopMarkers = arrangement.loopEnabled && (
    <>
      {/* Loop start */}
      <div
        className="absolute top-0 h-full w-1 bg-blue-500/50"
        style={{ left: arrangement.loopStart * pixelsPerBar }}
      >
        <div className="absolute -top-0.5 -left-1 w-3 h-3 bg-blue-500 rounded-sm" />
      </div>
      {/* Loop end */}
      <div
        className="absolute top-0 h-full w-1 bg-blue-500/50"
        style={{ left: arrangement.loopEnd * pixelsPerBar }}
      >
        <div className="absolute -top-0.5 -right-1 w-3 h-3 bg-blue-500 rounded-sm" />
      </div>
      {/* Loop region highlight */}
      <div
        className="absolute top-0 h-full bg-blue-500/10"
        style={{
          left: arrangement.loopStart * pixelsPerBar,
          width: (arrangement.loopEnd - arrangement.loopStart) * pixelsPerBar,
        }}
      />
    </>
  );

  return (
    <div
      ref={rulerRef}
      className="h-7 bg-studio-800 border-b border-studio-600 relative overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div
        className="relative h-full"
        style={{
          width: totalWidth,
          transform: `translateX(-${scrollX}px)`,
        }}
      >
        {loopMarkers}
        {markers}
      </div>
    </div>
  );
}
