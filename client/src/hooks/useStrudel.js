import { useCallback, useEffect, useState, useRef } from 'react';
import { useStore } from '../store/index.js';
import * as engine from '../strudel/engine.js';
import logger from '../utils/logger.js';
import {
  arrangementHasPlayableClips,
  getPlaybackStartBar,
} from './strudelPlaybackUtils.js';

export function useStrudel() {
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState(null);
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const arrangement = useStore((state) => state.arrangement);
  const patterns = useStore((state) => state.patterns);
  const _arrangementVersion = useStore((state) => state._arrangementVersion);
  const setPlaying = useStore((state) => state.setPlaying);
  const setPlayheadPosition = useStore((state) => state.setPlayheadPosition);

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
    return arrangementHasPlayableClips(arrangement, patterns);
  }, [arrangement, patterns]);

  const stopPlaybackState = useCallback((playheadPosition = 0) => {
    engine.stop();
    setPlaying(false);
    setPlayheadPosition(playheadPosition);
  }, [setPlaying, setPlayheadPosition]);

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

    // Reset playhead to the effective playback start
    setPlayheadPosition(getPlaybackStartBar(arrangement));

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
    stopPlaybackState(0);
  }, [stopPlaybackState]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Legacy: update code (for compatibility)
  const updateCode = useCallback(async () => {
    if (!isPlaying) return;

    if (!hasClipsToPlay()) {
      stopPlaybackState(getPlaybackStartBar(arrangement));
      setError('No clips to play. Add clips to tracks.');
      return;
    }

    const result = await engine.evaluateArrangement(arrangement, patterns, bpm);
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
  }, [isPlaying, bpm, arrangement, patterns, hasClipsToPlay, stopPlaybackState]);

  // Sync tempo changes
  useEffect(() => {
    if (audioReady) {
      engine.setTempo(bpm);
    }
  }, [bpm, audioReady]);

  // Track loop state for detecting changes
  const lastLoopEnabledRef = useRef(arrangement.loopEnabled);

  useEffect(() => {
    if (!isPlaying) {
      lastLoopEnabledRef.current = arrangement.loopEnabled;
      lastVersionRef.current = _arrangementVersion;
    }
  }, [isPlaying, arrangement.loopEnabled, _arrangementVersion]);

  // Handle loop toggle while playing by restarting from the effective start.
  useEffect(() => {
    if (audioReady && isPlaying && arrangement.loopEnabled !== lastLoopEnabledRef.current) {
      lastLoopEnabledRef.current = arrangement.loopEnabled;
      const playbackStart = getPlaybackStartBar(arrangement);

      // Stop, reset, and restart playback
      stopPlaybackState(playbackStart);
      engine.resetPlaybackTime();

      if (hasClipsToPlay()) {
        engine.evaluateArrangement(arrangement, patterns, bpm).then(result => {
          if (result.success) {
            engine.start();
            setPlaying(true);
            setError(null);
          } else {
            setError(result.error);
          }
        });
      } else {
        setError('No clips to play. Add clips to tracks.');
      }
    }
  }, [arrangement.loopEnabled, audioReady, isPlaying, arrangement, patterns, bpm, hasClipsToPlay, stopPlaybackState, setPlaying]);

  // Sync other arrangement changes in real-time (excluding loop toggle)
  useEffect(() => {
    if (audioReady && isPlaying && _arrangementVersion !== lastVersionRef.current) {
      // Skip if this was triggered by loop change (handled above)
      if (arrangement.loopEnabled === lastLoopEnabledRef.current) {
        lastVersionRef.current = _arrangementVersion;

        if (!hasClipsToPlay()) {
          stopPlaybackState(getPlaybackStartBar(arrangement));
          setError('No clips to play. Add clips to tracks.');
          return;
        }

        engine.evaluateArrangement(arrangement, patterns, bpm).then(result => {
          if (!result.success) {
            setError(result.error);
          } else {
            setError(null);
          }
        });
      }
      lastVersionRef.current = _arrangementVersion;
    }
  }, [_arrangementVersion, arrangement, patterns, audioReady, isPlaying, bpm, hasClipsToPlay, stopPlaybackState]);

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
