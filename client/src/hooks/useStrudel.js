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
    currentPattern,
    setPlaying,
    getActiveLayers,
  } = useStore();

  // Track layers for change detection
  const lastLayersRef = useRef(JSON.stringify(currentPattern.layers));

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

  const play = useCallback(async () => {
    setError(null);

    if (!audioReady) {
      const success = await initializeAudio();
      if (!success) {
        setError('Could not initialize audio. Click to allow audio.');
        return;
      }
    }

    // Use layers API
    const layers = currentPattern.layers;
    const result = await engine.evaluateLayers(layers, bpm);

    if (result.success) {
      engine.start();
      setPlaying(true);
    } else {
      setError(result.error);
    }
  }, [audioReady, initializeAudio, currentPattern.layers, bpm, setPlaying]);

  const stop = useCallback(() => {
    engine.stop();
    setPlaying(false);
  }, [setPlaying]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Legacy: update code for selected layer
  const updateCode = useCallback(async (code) => {
    if (isPlaying) {
      const layers = currentPattern.layers;
      const result = await engine.evaluateLayers(layers, bpm);
      if (!result.success) {
        setError(result.error);
      } else {
        setError(null);
      }
    }
  }, [isPlaying, bpm, currentPattern.layers]);

  // Sync tempo changes
  useEffect(() => {
    if (audioReady) {
      engine.setTempo(bpm);
    }
  }, [bpm, audioReady]);

  // Sync layer changes in real-time (code, params, mute, solo)
  useEffect(() => {
    const layersJson = JSON.stringify(currentPattern.layers);

    if (audioReady && isPlaying && layersJson !== lastLayersRef.current) {
      lastLayersRef.current = layersJson;
      engine.evaluateLayers(currentPattern.layers, bpm).then(result => {
        if (!result.success) {
          setError(result.error);
        } else {
          setError(null);
        }
      });
    }
  }, [currentPattern.layers, audioReady, isPlaying, bpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.stop();
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
