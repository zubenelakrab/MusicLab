import { ZoomIn, ZoomOut, Grid3X3, Repeat } from 'lucide-react';
import { useStore } from '../../store';

export default function ArrangementHeader() {
  const {
    arrangement,
    arrangementView,
    bpm,
    setArrangementZoom,
    setArrangementLength,
    setSnapToGrid,
    setGridSubdivision,
    toggleLoop,
  } = useStore();

  const { zoom, snapToGrid, gridSubdivision } = arrangementView;

  const handleZoomIn = () => setArrangementZoom(zoom * 1.25);
  const handleZoomOut = () => setArrangementZoom(zoom / 1.25);

  const gridOptions = [
    { value: 1, label: '1 bar' },
    { value: 2, label: '1/2' },
    { value: 4, label: '1/4' },
    { value: 8, label: '1/8' },
    { value: 16, label: '1/16' },
  ];

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-studio-800 border-b border-studio-600">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white">
          {arrangement.name}
        </span>
        <span className="text-xs text-gray-400">
          {bpm} BPM
        </span>
      </div>

      {/* Center section - Grid & Snap */}
      <div className="flex items-center gap-3">
        {/* Snap to grid toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            snapToGrid
              ? 'bg-accent-primary text-black'
              : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
          }`}
          title="Snap to grid"
        >
          <Grid3X3 size={12} />
          Snap
        </button>

        {/* Grid subdivision */}
        <select
          value={gridSubdivision}
          onChange={(e) => setGridSubdivision(Number(e.target.value))}
          className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white focus:outline-none focus:border-accent-primary"
        >
          {gridOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Loop toggle */}
        <button
          onClick={toggleLoop}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            arrangement.loopEnabled
              ? 'bg-blue-600 text-white'
              : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
          }`}
          title="Loop"
        >
          <Repeat size={12} />
          Loop
        </button>
      </div>

      {/* Right section - Zoom & Length */}
      <div className="flex items-center gap-3">
        {/* Arrangement length */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Length:</span>
          <select
            value={arrangement.lengthBars}
            onChange={(e) => setArrangementLength(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white focus:outline-none focus:border-accent-primary"
          >
            {[8, 16, 32, 64, 128, 256].map((bars) => (
              <option key={bars} value={bars}>
                {bars} bars
              </option>
            ))}
          </select>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <div className="w-20 h-1.5 bg-studio-600 rounded-full relative">
            <div
              className="absolute top-0 left-0 h-full bg-accent-primary rounded-full"
              style={{ width: `${((zoom - 0.25) / 3.75) * 100}%` }}
            />
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={zoom}
              onChange={(e) => setArrangementZoom(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <span className="text-xs text-gray-500 w-12 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
