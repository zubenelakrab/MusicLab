import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getAnalyser } from '../../strudel/engine';

const MODES = [
  { id: 'bars', name: 'Barras' },
  { id: 'wave', name: 'Onda' },
  { id: 'circle', name: 'Circular' },
  { id: 'starburst', name: 'Starburst' },
  { id: 'tunnel', name: 'Tunel' },
  { id: 'nebula', name: 'Nebula' },
];

const COLORS = [
  { id: 'neon', name: 'Neon', colors: ['#ff00ff', '#00ffff', '#ff0080', '#00ff80'], bg: '#0a0014' },
  { id: 'fire', name: 'Fuego', colors: ['#ff0000', '#ff6600', '#ffcc00', '#ff3300'], bg: '#1a0500' },
  { id: 'ocean', name: 'Oceano', colors: ['#0066ff', '#00ccff', '#0099cc', '#003366'], bg: '#000a14' },
  { id: 'matrix', name: 'Matrix', colors: ['#00ff41', '#00cc33', '#009922', '#00ff00'], bg: '#000800' },
  { id: 'sunset', name: 'Atardecer', colors: ['#ff006a', '#ff7b00', '#ffcc00', '#ff3366'], bg: '#1a0011' },
  { id: 'cyber', name: 'Cyber', colors: ['#ff00ff', '#8800ff', '#0088ff', '#00ffff'], bg: '#05000a' },
];

export default function Visualizer({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const starsRef = useRef([]);
  const tunnelRef = useRef({ rings: [], rotation: 0 });
  const nebulaRef = useRef({ blobs: [], time: 0 });

  const [mode, setMode] = useState('bars');
  const [colorScheme, setColorScheme] = useState('neon');
  const [sensitivity, setSensitivity] = useState(2);
  const [hasAudio, setHasAudio] = useState(false);

  const palette = COLORS.find(c => c.id === colorScheme) || COLORS[0];

  // Get color from palette based on value/index
  const getColor = useCallback((index, total, alpha = 1) => {
    const colorIndex = Math.floor((index / total) * palette.colors.length);
    const color = palette.colors[colorIndex % palette.colors.length];
    if (alpha < 1) {
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }, [palette]);

  // Get gradient with palette colors
  const createGradient = useCallback((ctx, x1, y1, x2, y2) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    palette.colors.forEach((color, i) => {
      gradient.addColorStop(i / (palette.colors.length - 1), color);
    });
    return gradient;
  }, [palette]);

  useEffect(() => {
    if (!isOpen) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const analyser = getAnalyser();

    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    // Initialize stars for starburst
    if (starsRef.current.length === 0) {
      for (let i = 0; i < 200; i++) {
        starsRef.current.push({
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 2 + 0.5,
          dist: Math.random() * 50,
          size: Math.random() * 2 + 1,
          colorIndex: Math.floor(Math.random() * 4),
        });
      }
    }

    // Initialize tunnel rings
    if (tunnelRef.current.rings.length === 0) {
      for (let i = 0; i < 20; i++) {
        tunnelRef.current.rings.push({
          z: i * 50,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    }

    const checkAudio = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        setHasAudio(sum > 100);
      }
    };

    const simulateAudio = (time) => {
      for (let i = 0; i < bufferLength; i++) {
        const freq = i / bufferLength;
        const wave1 = Math.sin(time * 0.001 + i * 0.1) * 50;
        const wave2 = Math.sin(time * 0.002 + i * 0.05) * 30;
        const wave3 = Math.cos(time * 0.0015 + i * 0.15) * 40;
        dataArray[i] = Math.max(0, Math.min(255, 80 + wave1 + wave2 + wave3 * (1 - freq)));
      }
    };

    const getAudioLevels = () => {
      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
      const mid = dataArray.slice(10, 80).reduce((a, b) => a + b, 0) / 70 / 255;
      const high = dataArray.slice(80, 150).reduce((a, b) => a + b, 0) / 70 / 255;
      return { bass, mid, high };
    };

    // === BARS MODE ===
    const drawBars = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass } = getAudioLevels();
      const barCount = 80;
      const barWidth = canvas.width / barCount;
      const step = Math.floor(bufferLength / barCount);

      // Mirror effect
      for (let mirror = 0; mirror < 2; mirror++) {
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = dataArray[dataIndex] * sensitivity;
          const barHeight = (value / 255) * canvas.height * 0.4;

          const x = mirror === 0 ? i * barWidth : canvas.width - (i + 1) * barWidth;
          const y = mirror === 0 ? canvas.height / 2 - barHeight : canvas.height / 2;

          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          const color1 = getColor(i, barCount);
          const color2 = getColor((i + barCount / 2) % barCount, barCount);
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 15 + bass * 20;
          ctx.shadowColor = color1;

          // Rounded bar
          const w = barWidth - 2;
          const h = barHeight;
          const r = 2;
          ctx.beginPath();
          ctx.roundRect(x + 1, y, w, h, r);
          ctx.fill();
        }
      }

      // Center glow
      const centerGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, 100 + bass * 100
      );
      centerGradient.addColorStop(0, getColor(0, 4, 0.3));
      centerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.shadowBlur = 0;
    };

    // === WAVE MODE ===
    const drawWave = (time) => {
      if (analyser) analyser.getByteTimeDomainData(waveArray);
      const sum = waveArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0);
      if (sum < 50) {
        for (let i = 0; i < bufferLength; i++) {
          waveArray[i] = 128 + Math.sin(time * 0.002 + i * 0.05) * 40;
        }
      }

      // Fade effect for trails
      ctx.fillStyle = palette.bg + 'dd';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const layers = 5;
      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        ctx.lineWidth = 4 - layer * 0.5;
        const color = getColor(layer, layers);
        ctx.strokeStyle = color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;

        const sliceWidth = canvas.width / bufferLength;
        const yOffset = (layer - layers / 2) * 20;

        for (let i = 0; i < bufferLength; i++) {
          const v = waveArray[i] / 128.0;
          const y = (v * canvas.height) / 2 + yOffset + Math.sin(time * 0.001 + layer * 0.5) * 10;
          const x = i * sliceWidth;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    };

    // === CIRCLE MODE ===
    const drawCircle = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      ctx.fillStyle = palette.bg + 'f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass, mid, high } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.2;

      // Rotating outer circles
      for (let ring = 0; ring < 4; ring++) {
        const ringRadius = baseRadius * (1.5 + ring * 0.3) + bass * 30;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = getColor(ring, 4, 0.3);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Circular spectrum
      const bars = 120;
      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * bufferLength);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * baseRadius * 0.8;

        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2 + time * 0.0005;
        const innerRadius = baseRadius + bass * 20;

        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        const color = getColor(i, bars);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
      }

      // Inner pulsing core
      const pulseRadius = baseRadius * 0.5 + bass * 30;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
      coreGradient.addColorStop(0, getColor(0, 4));
      coreGradient.addColorStop(0.5, getColor(1, 4, 0.6));
      coreGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowBlur = 40;
      ctx.shadowColor = getColor(0, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    // === STARBURST MODE ===
    const drawStarburst = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      // Fade trails
      ctx.fillStyle = palette.bg + '18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass, mid, high } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDist = Math.max(canvas.width, canvas.height) * 0.7;

      // Update and draw stars
      starsRef.current.forEach((star, i) => {
        const speedBoost = 1 + bass * 3 + (i % 3 === 0 ? high * 2 : 0);
        star.dist += star.speed * speedBoost * sensitivity;

        if (star.dist > maxDist) {
          star.dist = 0;
          star.angle = Math.random() * Math.PI * 2;
          star.speed = Math.random() * 2 + 0.5;
          star.colorIndex = Math.floor(Math.random() * 4);
        }

        const x = centerX + Math.cos(star.angle) * star.dist;
        const y = centerY + Math.sin(star.angle) * star.dist;
        const size = star.size * (1 + star.dist / maxDist * 3) * (1 + bass);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);

        const alpha = Math.min(1, star.dist / 100);
        const color = getColor(star.colorIndex, 4, alpha);
        ctx.fillStyle = color;
        ctx.shadowBlur = 10 + mid * 20;
        ctx.shadowColor = palette.colors[star.colorIndex];
        ctx.fill();

        // Trail line
        if (star.dist > 20) {
          const trailLength = Math.min(star.dist * 0.3, 50);
          const x2 = centerX + Math.cos(star.angle) * (star.dist - trailLength);
          const y2 = centerY + Math.sin(star.angle) * (star.dist - trailLength);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = getColor(star.colorIndex, 4, alpha * 0.5);
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        }
      });

      // Center burst on heavy bass
      if (bass > 0.6) {
        const burstGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150 * bass);
        burstGradient.addColorStop(0, getColor(0, 4, 0.8));
        burstGradient.addColorStop(0.5, getColor(1, 4, 0.3));
        burstGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = burstGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.shadowBlur = 0;
    };

    // === TUNNEL MODE ===
    const drawTunnel = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass, mid, high } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      tunnelRef.current.rotation += 0.01 + bass * 0.05;

      // Update rings
      tunnelRef.current.rings.forEach((ring, i) => {
        ring.z -= 5 + bass * 15;
        if (ring.z < 10) {
          ring.z = 1000;
          ring.rotation = Math.random() * Math.PI * 2;
        }
      });

      // Sort by z (far to near)
      const sortedRings = [...tunnelRef.current.rings].sort((a, b) => b.z - a.z);

      sortedRings.forEach((ring, i) => {
        const scale = 500 / ring.z;
        const radius = 300 * scale;
        const segments = 8;

        const dataIndex = Math.floor((i / sortedRings.length) * bufferLength);
        const audioValue = dataArray[dataIndex] / 255;
        const wobble = audioValue * 30 * scale;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.rotation + tunnelRef.current.rotation);

        for (let s = 0; s < segments; s++) {
          const angle1 = (s / segments) * Math.PI * 2;
          const angle2 = ((s + 1) / segments) * Math.PI * 2;

          const r1 = radius + Math.sin(angle1 * 3 + time * 0.003) * wobble;
          const r2 = radius + Math.sin(angle2 * 3 + time * 0.003) * wobble;

          ctx.beginPath();
          ctx.moveTo(Math.cos(angle1) * r1, Math.sin(angle1) * r1);
          ctx.lineTo(Math.cos(angle2) * r2, Math.sin(angle2) * r2);

          const alpha = Math.min(1, scale * 2);
          ctx.strokeStyle = getColor(s, segments, alpha);
          ctx.lineWidth = 3 * scale;
          ctx.shadowBlur = 15 * scale;
          ctx.shadowColor = palette.colors[s % 4];
          ctx.stroke();
        }

        ctx.restore();
      });

      ctx.shadowBlur = 0;
    };

    // === NEBULA MODE ===
    const drawNebula = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();

      // Fade trail effect
      ctx.fillStyle = palette.bg + '15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nebulaRef.current.time = time;
      const t = time * 0.001;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw flowing nebula blobs
      const blobCount = 8;
      for (let i = 0; i < blobCount; i++) {
        const angle = (i / blobCount) * Math.PI * 2 + t * 0.3;
        const distance = 150 + Math.sin(t + i) * 50 + bass * 100;

        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = 80 + mid * 100 + Math.sin(t * 2 + i) * 30;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        const color = palette.colors[i % palette.colors.length];
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(0.5, color + '30');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Inner rotating energy
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = 50 + ring * 40 + bass * 30;
        const segments = 12;

        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + t * (1 + ring * 0.5);
          const nextAngle = ((i + 1) / segments) * Math.PI * 2 + t * (1 + ring * 0.5);

          const wobble = Math.sin(t * 3 + i + ring) * 10 * high;
          const r1 = ringRadius + wobble;
          const r2 = ringRadius + Math.sin(t * 3 + i + 1 + ring) * 10 * high;

          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * r1, centerY + Math.sin(angle) * r1);
          ctx.lineTo(centerX + Math.cos(nextAngle) * r2, centerY + Math.sin(nextAngle) * r2);

          const color = palette.colors[(i + ring) % palette.colors.length];
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 + bass * 5;
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.stroke();
        }
      }

      // Central core pulse
      const coreSize = 30 + bass * 50;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.3, palette.colors[0]);
      coreGradient.addColorStop(0.6, palette.colors[1] + '80');
      coreGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowBlur = 40;
      ctx.shadowColor = palette.colors[0];
      ctx.fill();

      // Sparkles on high frequencies
      if (high > 0.3) {
        for (let i = 0; i < 10; i++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkDist = Math.random() * 300 + 50;
          const sparkX = centerX + Math.cos(sparkAngle) * sparkDist;
          const sparkY = centerY + Math.sin(sparkAngle) * sparkDist;
          const sparkSize = Math.random() * 3 + 1;

          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fillStyle = palette.colors[Math.floor(Math.random() * 4)];
          ctx.shadowBlur = 10;
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
    };

    const draw = (timestamp) => {
      const time = timestamp || 0;

      switch (mode) {
        case 'bars': drawBars(time); break;
        case 'wave': drawWave(time); break;
        case 'circle': drawCircle(time); break;
        case 'starburst': drawStarburst(time); break;
        case 'tunnel': drawTunnel(time); break;
        case 'nebula': drawNebula(time); break;
        default: drawBars(time);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw(0);
    const audioCheck = setInterval(checkAudio, 1000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      clearInterval(audioCheck);
    };
  }, [isOpen, mode, colorScheme, sensitivity, palette, getColor, createGradient]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && isOpen) {
        const container = canvasRef.current.parentElement;
        canvasRef.current.width = container.clientWidth;
        canvasRef.current.height = container.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-sm text-purple-400 font-bold tracking-wider">VISUALIZER</span>

          {/* Mode selector */}
          <div className="flex gap-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  mode === m.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Color selector */}
          <div className="flex gap-1 ml-2">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColorScheme(c.id)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  colorScheme === c.id ? 'border-white scale-110' : 'border-transparent hover:border-gray-500'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]}, ${c.colors[2]})`
                }}
                title={c.name}
              />
            ))}
          </div>

          {/* Sensitivity */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-400">Intensidad</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-20 accent-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasAudio && (
            <span className="text-xs text-yellow-500 animate-pulse">
              Demo mode - Dale Play para sincronizar
            </span>
          )}
          <span className="text-xs text-gray-500">ESC para cerrar</span>
          <button
            onClick={onClose}
            className="p-1.5 bg-red-600/80 text-white rounded hover:bg-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
