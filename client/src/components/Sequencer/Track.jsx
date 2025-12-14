import { useStore } from '../../store';
import PatternBlock from './PatternBlock';

export default function Track({ track, onToggleMute, onAddBlock, onRemoveBlock }) {
  const { patterns } = useStore();

  const handleDrop = (e) => {
    e.preventDefault();
    const patternId = e.dataTransfer.getData('patternId');
    if (patternId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startBeat = Math.floor(x / 20);
      onAddBlock(track.id, patternId, startBeat);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="flex border-b border-studio-600">
      <div className="w-32 flex-shrink-0 p-2 bg-studio-700 border-r border-studio-600">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white truncate">{track.name}</span>
          <button
            onClick={() => onToggleMute(track.id)}
            className={`text-xs px-1.5 py-0.5 rounded ${
              track.muted ? 'bg-red-500/20 text-red-400' : 'bg-studio-600 text-gray-400'
            }`}
          >
            {track.muted ? 'M' : 'M'}
          </button>
        </div>
      </div>
      <div
        className="flex-1 h-14 relative bg-studio-800"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-5 border-r ${
                i % 4 === 0 ? 'border-studio-500' : 'border-studio-700'
              }`}
            />
          ))}
        </div>
        {track.blocks?.map((block) => (
          <PatternBlock
            key={block.id}
            block={block}
            pattern={patterns.find(p => p.id === block.patternId)}
            onRemove={(blockId) => onRemoveBlock(track.id, blockId)}
          />
        ))}
      </div>
    </div>
  );
}
