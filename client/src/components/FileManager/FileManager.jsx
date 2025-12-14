import { useRef } from 'react';
import { FilePlus, FolderOpen, Save } from 'lucide-react';
import { useStore } from '../../store';

export default function FileManager() {
  const fileInputRef = useRef(null);
  const {
    currentPattern,
    setCurrentPattern,
    bpm,
    setBpm,
  } = useStore();

  // Export current composition as JSON
  const handleExport = () => {
    const composition = {
      version: '1.0',
      name: currentPattern.name || 'Untitled',
      bpm: bpm,
      layers: currentPattern.layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        code: layer.code,
        muted: layer.muted,
        solo: layer.solo,
        params: layer.params,
      })),
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(composition, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${composition.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import composition from JSON file
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result;
        const composition = JSON.parse(json);

        // Validate basic structure
        if (!composition.layers || !Array.isArray(composition.layers)) {
          alert('Archivo invalido: no contiene capas');
          return;
        }

        // Set BPM if present
        if (composition.bpm) {
          setBpm(composition.bpm);
        }

        // Convert to current pattern format
        const pattern = {
          id: null,
          name: composition.name || 'Imported',
          layers: composition.layers.map((layer, index) => ({
            id: layer.id || `layer-${Date.now()}-${index}`,
            name: layer.name || `Layer ${index + 1}`,
            code: layer.code || '',
            muted: layer.muted || false,
            solo: layer.solo || false,
            params: {
              gain: layer.params?.gain ?? 0.8,
              cutoff: layer.params?.cutoff ?? 8000,
              resonance: layer.params?.resonance ?? 0,
              speed: layer.params?.speed ?? 1,
              pan: layer.params?.pan ?? 0,
            },
          })),
          params: {
            gain: 0.8,
            cutoff: 8000,
            resonance: 0,
            speed: 1,
            pan: 0,
          },
        };

        setCurrentPattern(pattern);
        alert(`Composicion "${composition.name}" importada con ${composition.layers.length} capas`);
      } catch (err) {
        console.error('Import error:', err);
        alert('Error al importar: ' + err.message);
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be imported again
    event.target.value = '';
  };

  // New composition
  const handleNew = () => {
    if (currentPattern.layers.some(l => l.code.trim())) {
      if (!confirm('Tienes cambios sin guardar. ¿Crear nueva composicion?')) {
        return;
      }
    }

    setCurrentPattern({
      id: null,
      name: 'Nueva Composicion',
      layers: [{
        id: `layer-${Date.now()}`,
        name: 'Layer 1',
        code: '',
        muted: false,
        solo: false,
        params: {
          gain: 0.8,
          cutoff: 8000,
          resonance: 0,
          speed: 1,
          pan: 0,
        },
      }],
      params: {
        gain: 0.8,
        cutoff: 8000,
        resonance: 0,
        speed: 1,
        pan: 0,
      },
    });
    setBpm(120);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      {/* New button */}
      <button
        onClick={handleNew}
        className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 transition-colors flex items-center gap-1"
        title="Nueva composicion"
      >
        <FilePlus size={14} />
        <span>Nuevo</span>
      </button>

      {/* Import button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 transition-colors flex items-center gap-1"
        title="Importar composicion (.json)"
      >
        <FolderOpen size={14} />
        <span>Abrir</span>
      </button>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400 transition-colors flex items-center gap-1"
        title="Exportar composicion como JSON"
      >
        <Save size={14} />
        <span>Guardar</span>
      </button>
    </div>
  );
}
