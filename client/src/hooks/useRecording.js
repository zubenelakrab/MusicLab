import { useState, useCallback, useRef, useEffect } from 'react';
import * as engine from '../strudel/engine';
import logger from '../utils/logger';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const timerRef = useRef(null);

  // Start recording
  const start = useCallback(() => {
    // Setup and start recording
    const success = engine.startRecording();
    if (!success) {
      logger.error('Failed to start recording');
      return false;
    }

    setIsRecording(true);
    setDuration(0);
    setBlob(null);

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    return true;
  }, []);

  // Stop recording
  const stop = useCallback(async () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop recording and get blob
    const recordedBlob = await engine.stopRecording();
    setBlob(recordedBlob);
    setIsRecording(false);

    return recordedBlob;
  }, []);

  // Download recording
  const download = useCallback(async (format = 'wav') => {
    if (!blob) return;

    try {
      let finalBlob = blob;
      let ext = 'webm';
      let filename = `musiclab-${Date.now()}`;

      if (format === 'wav') {
        setIsConverting(true);
        try {
          finalBlob = await engine.convertToWav(blob);
          ext = 'wav';
        } catch (err) {
          logger.error('WAV conversion failed, downloading original format:', err);
          // Fallback to original format
        }
        setIsConverting(false);
      }

      // Create download link
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.log(`Downloaded recording as ${ext}`);
    } catch (err) {
      logger.error('Download failed:', err);
      setIsConverting(false);
    }
  }, [blob]);

  // Clear recording
  const clear = useCallback(() => {
    setBlob(null);
    setDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    duration,
    formattedDuration: formatDuration(duration),
    blob,
    isConverting,
    hasRecording: blob !== null,
    start,
    stop,
    download,
    clear,
  };
}
