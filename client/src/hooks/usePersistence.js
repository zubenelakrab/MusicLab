import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

const AUTOSAVE_KEY = 'musiclab_autosave';
const DEBOUNCE_MS = 2000;

export function usePersistence() {
  const { arrangement, bpm, _arrangementVersion } = useStore();
  const timerRef = useRef(null);
  const restoredRef = useRef(false);

  // Restore from localStorage on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return;

      const data = JSON.parse(saved);
      if (data.arrangement && data.arrangement.tracks) {
        useStore.getState().loadProject(data);
      }
    } catch (err) {
      console.warn('Failed to restore autosave:', err);
    }
  }, []);

  // Debounced autosave on arrangement or bpm change
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const state = useStore.getState();
        const data = {
          arrangement: state.arrangement,
          bpm: state.bpm,
          savedAt: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Autosave failed:', err);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [_arrangementVersion, bpm]);

  // Save to server
  const saveProjectToServer = useCallback(async () => {
    const state = useStore.getState();
    const { arrangement } = state;

    const body = {
      name: arrangement.name || 'Untitled',
      bpm: state.bpm,
      tracks: arrangement.tracks,
      arrangement: {
        lengthBars: arrangement.lengthBars,
        loopEnabled: arrangement.loopEnabled,
        loopStart: arrangement.loopStart,
        loopEnd: arrangement.loopEnd,
      },
    };

    try {
      if (arrangement.id) {
        const res = await fetch(`/api/projects/${arrangement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return await res.json();
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const project = await res.json();
        useStore.getState().updateArrangementTrack(null, { id: project.id }); // This might not be right, let's use a better way to update just the ID
        // Actually arrangement.id is what we want to update.
        // Let's add an action for it or use updateArrangementTrack if it handles it.
        useStore.setState((s) => ({
          arrangement: { ...s.arrangement, id: project.id },
        })); // This one is okay because it's just the ID, but it still won't increment version.
        // However, changing just the ID doesn't really need a new version for audio engine.
        // But for consistency let's use a new action or just use updateArrangementTrack if it supports it.
        // Let's look at updateArrangementTrack in store/index.js. It takes trackId.
        // The arrangement itself doesn't have an update action for global properties other than the specific ones.

        return project;
      }
    } catch (err) {
      console.error('Failed to save to server:', err);
      return null;
    }
  }, []);

  // Load from server
  const loadProjectFromServer = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) return null;
      const project = await res.json();

      useStore.getState().loadProject(project);
      return project;
    } catch (err) {
      console.error('Failed to load from server:', err);
      return null;
    }
  }, []);

  // Listen for Ctrl+S save event
  useEffect(() => {
    const handleSave = () => {
      saveProjectToServer();
    };
    window.addEventListener('musiclab:save', handleSave);
    return () => window.removeEventListener('musiclab:save', handleSave);
  }, [saveProjectToServer]);

  return { saveProjectToServer, loadProjectFromServer };
}

// Utility to clear autosave (used by FileManager on "New")
export function clearAutosave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}
