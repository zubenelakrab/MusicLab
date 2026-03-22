import { useRef } from 'react';
import { FilePlus, FolderOpen, Save } from 'lucide-react';
import { useStore } from '../../store';
import logger from '../../utils/logger';
import { clearAutosave } from '../../hooks/usePersistence';
import {
  convertLegacyLayerProject,
  createProjectDocument,
  isVersion2Project,
} from '../../project/projectFormat';

function hasProjectContent(arrangement) {
  return arrangement.tracks.some((track) =>
    track.clips.some((clip) => clip.layers?.some((layer) => layer.code?.trim()))
  );
}

export default function FileManager() {
  const fileInputRef = useRef(null);
  const {
    arrangement,
    bpm,
  } = useStore();

  // Export current composition as JSON (with arrangement tracks)
  const handleExport = () => {
    const composition = createProjectDocument(arrangement, bpm, { exportedAt: true });

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

    if (hasProjectContent(arrangement) && !confirm('You have unsaved changes. Import and replace the current project?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result;
        const composition = JSON.parse(json);

        // Version 2.0 format with arrangement tracks
        if (isVersion2Project(composition.version) && composition.arrangement) {
          useStore.getState().loadProject(composition);
          alert(`Project "${composition.name}" imported with ${composition.arrangement.tracks.length} tracks`);
          return;
        }

        // Legacy version 1.0 format with layers - convert to tracks
        if (composition.layers && Array.isArray(composition.layers)) {
          const project = convertLegacyLayerProject(composition);
          useStore.getState().loadProject(project);
          alert(`Legacy composition "${composition.name}" imported as ${project.arrangement.tracks.length} tracks`);
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
    if (hasProjectContent(arrangement)) {
      if (!confirm('You have unsaved changes. Create new project?')) {
        return;
      }
    }

    clearAutosave();
    useStore.getState().resetProject();
    // bpm is already reset by resetProject()
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
        className="btn-pro px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded-lg hover:bg-studio-500 transition-colors flex items-center gap-1"
        title="New composition"
      >
        <FilePlus size={14} />
        <span>New</span>
      </button>

      {/* Import button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="btn-pro px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded-lg hover:bg-studio-500 transition-colors flex items-center gap-1"
        title="Import composition (.json)"
      >
        <FolderOpen size={14} />
        <span>Open</span>
      </button>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="btn-pro px-2 py-1 text-xs bg-accent-primary text-black rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1 shadow-glow-sm"
        title="Export composition as JSON"
      >
        <Save size={14} />
        <span>Save</span>
      </button>
    </div>
  );
}
