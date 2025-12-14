import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import PatternCard from './PatternCard';
import PatternForm from './PatternForm';

const API_URL = '/api/patterns';

export default function PatternList() {
  const {
    patterns,
    setPatterns,
    currentPattern,
    setCurrentPattern,
    addPattern,
    addLayer,
    selectedLayerIndex,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPatterns(data);
    } catch (err) {
      console.error('Failed to fetch patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      // Get current layer code for saving
      const currentLayer = currentPattern.layers?.[selectedLayerIndex];
      const code = currentLayer?.code || '';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: code,
          params: currentLayer?.params || currentPattern.params,
        }),
      });
      const newPattern = await res.json();
      addPattern(newPattern);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save pattern:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setPatterns(patterns.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete pattern:', err);
    }
  };

  // Add pattern as a new layer (doesn't replace existing work)
  const handleAddAsLayer = (pattern) => {
    addLayer(pattern.code, pattern.name);
  };

  // Replace everything with this pattern (loads it as a new project)
  const handleReplace = (pattern) => {
    setCurrentPattern({
      id: pattern.id,
      name: pattern.name,
      code: pattern.code,
      params: pattern.params || { gain: 0.8, cutoff: 8000, resonance: 0, speed: 1, pan: 0 },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-studio-700 border-b border-studio-600">
        <span className="text-sm text-gray-400">Libreria</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400"
        >
          + Guardar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {showForm && (
          <PatternForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
        ) : patterns.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay patrones guardados</p>
        ) : (
          patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onAddAsLayer={handleAddAsLayer}
              onReplace={handleReplace}
              onDelete={handleDelete}
              isActive={currentPattern.id === pattern.id}
            />
          ))
        )}
      </div>

      <div className="px-3 py-2 bg-studio-700 border-t border-studio-600">
        <p className="text-xs text-gray-500">
          "+ Agregar capa" agrega sin borrar
        </p>
      </div>
    </div>
  );
}
