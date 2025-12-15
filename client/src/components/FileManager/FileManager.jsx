import { useRef } from 'react';
import { FilePlus, FolderOpen, Save } from 'lucide-react';
import { useStore } from '../../store';
import logger from '../../utils/logger';

export default function FileManager() {
  const fileInputRef = useRef(null);
  const {
    arrangement,
    bpm,
    setBpm,
  } = useStore();

  // Export current composition as JSON (with arrangement tracks)
  const handleExport = () => {
    const composition = {
      version: '2.0',
      name: arrangement.name || 'Untitled',
      bpm: bpm,
      arrangement: {
        lengthBars: arrangement.lengthBars,
        loopEnabled: arrangement.loopEnabled,
        loopStart: arrangement.loopStart,
        loopEnd: arrangement.loopEnd,
        tracks: arrangement.tracks.map(track => ({
          id: track.id,
          name: track.name,
          color: track.color,
          muted: track.muted,
          solo: track.solo,
          height: track.height,
          params: track.params,
          clips: track.clips.map(clip => ({
            id: clip.id,
            patternId: clip.patternId,
            name: clip.name,
            startBar: clip.startBar,
            durationBars: clip.durationBars,
            color: clip.color,
            layers: clip.layers,
          })),
        })),
      },
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

        // Set BPM if present
        if (composition.bpm) {
          setBpm(composition.bpm);
        }

        // Version 2.0 format with arrangement tracks
        if (composition.version === '2.0' && composition.arrangement) {
          const arr = composition.arrangement;
          useStore.setState({
            arrangement: {
              id: null,
              name: composition.name || 'Imported',
              lengthBars: arr.lengthBars || 32,
              loopEnabled: arr.loopEnabled || false,
              loopStart: arr.loopStart || 0,
              loopEnd: arr.loopEnd || 8,
              tracks: arr.tracks.map(track => ({
                id: track.id || `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: track.name || 'Track',
                color: track.color || '#00d4aa',
                muted: track.muted || false,
                solo: track.solo || false,
                height: track.height || 100,
                params: track.params || { gain: 0.8, pan: 0, cutoff: 8000, resonance: 0, speed: 1 },
                clips: (track.clips || []).map(clip => ({
                  id: clip.id || `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  patternId: clip.patternId || null,
                  name: clip.name || 'Clip',
                  startBar: clip.startBar || 0,
                  durationBars: clip.durationBars || 4,
                  color: clip.color || track.color || '#00d4aa',
                  layers: clip.layers || null,
                })),
              })),
            },
          });
          alert(`Project "${composition.name}" imported with ${arr.tracks.length} tracks`);
          return;
        }

        // Legacy version 1.0 format with layers - convert to tracks
        if (composition.layers && Array.isArray(composition.layers)) {
          const tracks = composition.layers.map((layer, index) => ({
            id: `track-${Date.now()}-${index}`,
            name: layer.name || `Track ${index + 1}`,
            color: ['#00d4aa', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'][index % 5],
            muted: layer.muted || false,
            solo: layer.solo || false,
            height: 100,
            params: layer.params || { gain: 0.8, pan: 0, cutoff: 8000, resonance: 0, speed: 1 },
            clips: [{
              id: `clip-${Date.now()}-${index}`,
              patternId: null,
              name: layer.name || `Clip ${index + 1}`,
              startBar: 0,
              durationBars: 4,
              color: ['#00d4aa', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'][index % 5],
              layers: [{
                id: `layer-${Date.now()}-${index}`,
                name: layer.name || 'Layer 1',
                code: layer.code || '',
                muted: false,
                solo: false,
                params: layer.params || { gain: 0.8, pan: 0, cutoff: 8000, resonance: 0, speed: 1 },
              }],
            }],
          }));

          useStore.setState({
            arrangement: {
              id: null,
              name: composition.name || 'Imported',
              lengthBars: 32,
              loopEnabled: false,
              loopStart: 0,
              loopEnd: 8,
              tracks,
            },
          });
          alert(`Legacy composition "${composition.name}" imported as ${tracks.length} tracks`);
          return;
        }

        alert('Invalid file: unrecognized format');
      } catch (err) {
        logger.error('Import error:', err);
        alert('Import error: ' + err.message);
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be imported again
    event.target.value = '';
  };

  // New composition
  const handleNew = () => {
    const hasContent = arrangement.tracks.some(t =>
      t.clips.some(c => c.layers?.some(l => l.code?.trim()))
    );

    if (hasContent) {
      if (!confirm('You have unsaved changes. Create new project?')) {
        return;
      }
    }

    useStore.setState({
      arrangement: {
        id: null,
        name: 'Untitled',
        lengthBars: 32,
        loopEnabled: false,
        loopStart: 0,
        loopEnd: 8,
        tracks: [],
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
        title="New composition"
      >
        <FilePlus size={14} />
        <span>New</span>
      </button>

      {/* Import button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 transition-colors flex items-center gap-1"
        title="Import composition (.json)"
      >
        <FolderOpen size={14} />
        <span>Open</span>
      </button>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400 transition-colors flex items-center gap-1"
        title="Export composition as JSON"
      >
        <Save size={14} />
        <span>Save</span>
      </button>
    </div>
  );
}
