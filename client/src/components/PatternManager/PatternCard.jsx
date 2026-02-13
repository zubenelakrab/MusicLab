import { Plus, X } from 'lucide-react';

export default function PatternCard({ pattern, onAddAsTrack, onDelete, isActive, isPreset }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('patternId', pattern.id);
    e.dataTransfer.setData('patternCode', pattern.code);
    e.dataTransfer.setData('patternName', pattern.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`group px-2.5 py-2 glass-panel glow-border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
        isActive ? 'shadow-glow-sm border-accent-primary' : 'hover:border-studio-500'
      }`}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Single row: name + code + actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{pattern.name}</span>
            {pattern.tags?.length > 0 && (
              <span className="text-[10px] text-gray-500 truncate hidden group-hover:inline">
                {pattern.tags.slice(0, 2).join(' / ')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-mono truncate">{pattern.code}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onAddAsTrack(pattern); }}
          className="btn-pro flex-shrink-0 p-1.5 bg-accent-primary text-black rounded-lg hover:bg-emerald-400 transition-colors"
          title="Add as new track"
        >
          <Plus size={14} />
        </button>

        {!isPreset && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(pattern.id); }}
            className="flex-shrink-0 p-1.5 text-gray-600 hover:text-red-400 rounded-lg transition-colors"
            title="Delete"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
