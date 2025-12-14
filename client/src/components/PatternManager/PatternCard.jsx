export default function PatternCard({ pattern, onAddAsLayer, onReplace, onDelete, isActive }) {
  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        isActive
          ? 'bg-accent-primary/20 border border-accent-primary'
          : 'bg-studio-700 border border-transparent hover:border-studio-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{pattern.name}</h4>
          <p className="text-xs text-gray-500 font-mono truncate mt-1">{pattern.code}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(pattern.id);
          }}
          className="text-gray-500 hover:text-red-400 text-xs px-1"
          title="Eliminar"
        >
          x
        </button>
      </div>

      {pattern.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pattern.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-studio-600 text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-2 pt-2 border-t border-studio-600">
        <button
          onClick={() => onAddAsLayer(pattern)}
          className="flex-1 px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400 transition-colors"
          title="Agregar como nueva capa"
        >
          + Agregar capa
        </button>
        <button
          onClick={() => onReplace(pattern)}
          className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 transition-colors"
          title="Reemplazar todo"
        >
          Cargar
        </button>
      </div>
    </div>
  );
}
