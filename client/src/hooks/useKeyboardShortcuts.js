import { useEffect } from 'react';
import { useStore } from '../store';
import { useStrudel } from './useStrudel';

export function useKeyboardShortcuts() {
  const { toggle } = useStrudel();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input field or code editor
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target.isContentEditable) return;
      if (e.target.closest('.cm-editor')) return;

      // Space -> Play/Stop
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggle();
        return;
      }

      // Ctrl+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y -> Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useStore.getState().redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        useStore.getState().redo();
        return;
      }

      // Ctrl+S -> Save project (prevent browser save dialog)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Dispatch a custom event that usePersistence can listen for
        window.dispatchEvent(new CustomEvent('musiclab:save'));
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);
}
