import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import {
  setPlayheadCallback,
  startPlayheadLoop,
  stopPlayheadLoop,
  getPlaybackPositionBars,
  resetPlaybackTime,
} from '../strudel/engine';

// Hook to sync playhead with arrangement view
export function usePlayheadSync() {
  const {
    isPlaying,
    setPlayheadPosition,
    arrangement,
  } = useStore();

  const lastUpdateRef = useRef(0);

  // Callback for playhead updates
  const handlePlayheadUpdate = useCallback((position) => {
    const now = Date.now();
    // Throttle updates to ~30fps for performance
    if (now - lastUpdateRef.current < 33) return;
    lastUpdateRef.current = now;

    // Handle looping
    if (arrangement.loopEnabled) {
      const loopLength = arrangement.loopEnd - arrangement.loopStart;
      if (position >= loopLength) {
        // Reset playback time to loop from beginning
        resetPlaybackTime();
        setPlayheadPosition(arrangement.loopStart);
        return;
      }
      // Position relative to loop start
      setPlayheadPosition(arrangement.loopStart + position);
      return;
    }

    // Clamp to arrangement length
    const clampedPosition = Math.min(position, arrangement.lengthBars);
    setPlayheadPosition(clampedPosition);
  }, [arrangement.loopEnabled, arrangement.loopStart, arrangement.loopEnd, arrangement.lengthBars, setPlayheadPosition]);

  // Start/stop playhead loop based on playing state
  useEffect(() => {
    if (isPlaying) {
      setPlayheadCallback(handlePlayheadUpdate);
      startPlayheadLoop();
    } else {
      stopPlayheadLoop();
      setPlayheadCallback(null);
    }

    return () => {
      stopPlayheadLoop();
      setPlayheadCallback(null);
    };
  }, [isPlaying, handlePlayheadUpdate]);

  return {
    playheadPosition: useStore.getState().playheadPosition,
    isPlaying,
  };
}

// Hook to manage arrangement playback state
export function useArrangementPlayback() {
  const {
    arrangement,
    patterns,
    bpm,
  } = useStore();

  // Get current playback position
  const getCurrentPosition = useCallback(() => {
    return getPlaybackPositionBars();
  }, []);

  return {
    arrangement,
    patterns,
    bpm,
    getCurrentPosition,
  };
}

export default usePlayheadSync;
