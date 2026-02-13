import { useCallback, useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import * as engine from '../strudel/engine';
import logger from '../utils/logger';

export function useStrudel() {
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState(null);
  const {
    isPlaying,
    bpm,
    arrangement,
    patterns,
    _arrangementVersion,
    setPlaying,
    setPlayheadPosition,
  } = useStore();

  // Track arrangement for change detection (version-based)
  const lastVersionRef = useRef(_arrangementVersion);

  const initializeAudio = useCallback(async () => {
    try {
      const success = await engine.initAudio();
      if (success) {
        engine.createRepl();
        setAudioReady(true);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Failed to init audio:', err);
      return false;
    }
  }, []);

  // Check if arrangement has any clips with code
  const hasClipsToPlay = useCallback(() => {
    const hasSolo = arrangement.tracks.some(t => t.solo);

    for (const track of arrangement.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      for (const clip of track.clips) {
        if (clip.layers && clip.layers.length > 0) {
          const clipCode = clip.layers[0]?.code;
          if (clipCode && clipCode.trim()) {
            return true;
          }
        }
      }
    }
    return false;
  }, [arrangement]);

  const play = useCallback(async () => {
    setError(null);

    if (!audioReady) {
      const success = await initializeAudio();
      if (!success) {
        setError('Could not initialize audio. Click to allow audio.');
        return;
      }
    }

    // Check if there are clips to play
    if (!hasClipsToPlay()) {
      setError('No clips to play. Add clips to tracks.');
      return;
    }

    // Reset playhead to start
    setPlayheadPosition(0);

    // Use arrangement-aware evaluation with time masking
    const result = await engine.evaluateArrangement(arrangement, patterns, bpm);

    if (result.success) {
      engine.start();
      setPlaying(true);
    } else {
      setError(result.error);
    }
  }, [audioReady, initializeAudio, hasClipsToPlay, arrangement, patterns, bpm, setPlaying, setPlayheadPosition]);

  const stop = useCallback(() => {
    engine.stop();
    setPlaying(false);
    // Reset playhead when stopping
    setPlayheadPosition(0);
  }, [setPlaying, setPlayheadPosition]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Legacy: update code (for compatibility)
  const updateCode = useCallback(async () => {
    if (isPlaying && hasClipsToPlay()) {
      const result = await engine.evaluateArrangement(arrangement, patterns, bpm);
      if (!result.success) {
        setError(result.error);
      } else {
        setError(null);
      }
    }
  }, [isPlaying, bpm, arrangement, patterns, hasClipsToPlay]);

  // Sync tempo changes
  useEffect(() => {
    if (audioReady) {
      engine.setTempo(bpm);
    }
  }, [bpm, audioReady]);

  // Track loop state for detecting changes
  const lastLoopEnabledRef = useRef(arrangement.loopEnabled);

  // Handle loop toggle - restart playback from 0
  useEffect(() => {
    if (audioReady && isPlaying && arrangement.loopEnabled !== lastLoopEnabledRef.current) {
      lastLoopEnabledRef.current = arrangement.loopEnabled;

      // Stop, reset, and restart playback
      engine.stop();
      engine.resetPlaybackTime();
      setPlayheadPosition(0);

      if (hasClipsToPlay()) {
        engine.evaluateArrangement(arrangement, patterns, bpm).then(result => {
          if (result.success) {
            engine.start();
            setError(null);
          } else {
            setError(result.error);
          }
        });
      }
    }
  }, [arrangement.loopEnabled, audioReady, isPlaying, arrangement, patterns, bpm, hasClipsToPlay, setPlayheadPosition]);

  // Sync other arrangement changes in real-time (excluding loop toggle)
  useEffect(() => {
    if (audioReady && isPlaying && _arrangementVersion !== lastVersionRef.current) {
      // Skip if this was triggered by loop change (handled above)
      if (arrangement.loopEnabled === lastLoopEnabledRef.current) {
        lastVersionRef.current = _arrangementVersion;

        if (hasClipsToPlay()) {
          engine.evaluateArrangement(arrangement, patterns, bpm).then(result => {
            if (!result.success) {
              setError(result.error);
            } else {
              setError(null);
            }
          });
        }
      }
      lastVersionRef.current = _arrangementVersion;
    }
  }, [_arrangementVersion, arrangement, patterns, audioReady, isPlaying, bpm, hasClipsToPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.stop();
      engine.cleanupAudio();
    };
  }, []);

  return {
    audioReady,
    isPlaying,
    error,
    play,
    stop,
    toggle,
    updateCode,
    initializeAudio,
  };
}
