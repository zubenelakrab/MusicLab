export default function PatternBlock({ block, pattern, onRemove }) {
  const width = block.duration * 20; // 20px per beat

  return (
    <div
      className="absolute h-10 bg-accent-tertiary/30 border border-accent-tertiary rounded cursor-move group"
      style={{
        left: block.startBeat * 20,
        width: width,
      }}
    >
      <div className="px-2 py-1 truncate">
        <span className="text-xs text-white">{pattern?.name || 'Pattern'}</span>
      </div>
      <button
        onClick={() => onRemove(block.id)}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        x
      </button>
    </div>
  );
}
