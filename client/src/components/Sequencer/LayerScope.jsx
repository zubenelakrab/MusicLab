import { useEffect, useRef } from 'react';
import { getAnalyser } from '../../strudel/engine';

const SCOPE_COLORS = [
  '#10b981', // emerald (accent-primary)
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#eab308', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
];

export default function LayerScope({ layerIndex, isActive, isPlaying }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2); // Random phase offset per layer

  const color = SCOPE_COLORS[layerIndex % SCOPE_COLORS.length];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Get analyser for audio data
    const analyser = getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (timestamp) => {
      // Clear with dark background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = '#2a2a3e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isPlaying || !isActive) {
        // Show flat line when not playing or muted
        ctx.strokeStyle = isActive ? color + '40' : '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Get audio data
      let hasAudioData = false;
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        const sum = dataArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0);
        hasAudioData = sum > 50;
      }

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;

      const sliceWidth = width / bufferLength;
      let x = 0;

      // Phase offset makes each layer look slightly different
      const phase = phaseRef.current + timestamp * 0.001 * (layerIndex + 1) * 0.1;

      for (let i = 0; i < bufferLength; i++) {
        let v;
        if (hasAudioData) {
          // Use real audio data with layer-specific offset
          const offsetIndex = (i + layerIndex * 20) % bufferLength;
          v = dataArray[offsetIndex] / 128.0;
        } else {
          // Simulated waveform when no audio
          const freq = 2 + layerIndex * 0.5;
          v = 1 + Math.sin(i * 0.1 * freq + phase) * 0.3;
        }

        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw glow effect at peaks
      if (hasAudioData) {
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
        if (bass > 0.6) {
          ctx.fillStyle = color + '20';
          ctx.fillRect(0, 0, width, height);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw(0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isPlaying, layerIndex, color]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Match the container size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
