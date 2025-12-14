import { useEffect, useRef, useState, useCallback } from 'react';
import { getAudioContext } from '@strudel/webaudio';

const MODES = [
  { id: 'bars', name: 'Barras' },
  { id: 'wave', name: 'Onda' },
  { id: 'circle', name: 'Circular' },
  { id: 'particles', name: 'Particulas' },
  { id: 'milkdrop', name: 'Milkdrop' },
];

const COLORS = [
  { id: 'matrix', name: 'Matrix', primary: '#00ff41', secondary: '#003b00', bg: '#000000' },
  { id: 'fire', name: 'Fuego', primary: '#ff6600', secondary: '#ff0000', bg: '#1a0000' },
  { id: 'ice', name: 'Hielo', primary: '#00ffff', secondary: '#0066ff', bg: '#000a14' },
  { id: 'purple', name: 'Morado', primary: '#ff00ff', secondary: '#6600ff', bg: '#0d000d' },
  { id: 'rainbow', name: 'Arcoiris', primary: 'rainbow', secondary: 'rainbow', bg: '#000000' },
  { id: 'sunset', name: 'Atardecer', primary: '#ff7b00', secondary: '#ff006a', bg: '#1a0011' },
];

// Global analyser that persists
let globalAnalyser = null;
let globalGain = null;

function getOrCreateAnalyser() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    if (!globalAnalyser) {
      globalAnalyser = ctx.createAnalyser();
      globalAnalyser.fftSize = 1024;
      globalAnalyser.smoothingTimeConstant = 0.8;
      globalAnalyser.minDecibels = -90;
      globalAnalyser.maxDecibels = -10;

      // Try to connect to destination
      // This is a workaround - we create a gain node connected to the destination
      // and route audio through it
      if (!globalGain) {
        globalGain = ctx.createGain();
        globalGain.gain.value = 1;
        globalGain.connect(ctx.destination);
        globalGain.connect(globalAnalyser);
      }
    }
    return globalAnalyser;
  } catch (err) {
    console.warn('Could not create analyser:', err);
    return null;
  }
}

export default function Visualizer({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const historyRef = useRef([]);
  const milkdropRef = useRef({ time: 0, bass: 0, mid: 0, high: 0 });

  const [mode, setMode] = useState('bars');
  const [colorScheme, setColorScheme] = useState('matrix');
  const [sensitivity, setSensitivity] = useState(2);
  const [hasAudio, setHasAudio] = useState(false);

  const colors = COLORS.find(c => c.id === colorScheme) || COLORS[0];

  const getColor = useCallback((value, index, total) => {
    if (colors.primary === 'rainbow') {
      const hue = (index / total) * 360;
      return `hsl(${hue}, 100%, ${50 + value / 5}%)`;
    }
    return colors.primary;
  }, [colors]);

  const getGradient = useCallback((ctx, x, y, w, h, value, index, total) => {
    if (colors.primary === 'rainbow') {
      const hue = (index / total) * 360;
      const gradient = ctx.createLinearGradient(x, y + h, x, y);
      gradient.addColorStop(0, `hsl(${hue}, 100%, 30%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(hue + 30) % 360}, 100%, 70%)`);
      return gradient;
    }
    const gradient = ctx.createLinearGradient(x, y + h, x, y);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(0.5, colors.primary);
    gradient.addColorStop(1, colors.primary + 'cc');
    return gradient;
  }, [colors]);

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
    const analyser = getOrCreateAnalyser();

    // Setup buffers
    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 150; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          life: Math.random(),
          hue: Math.random() * 360,
        });
      }
    }

    // Check if we have actual audio data
    const checkAudio = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        setHasAudio(sum > 100);
      }
    };

    // Generate simulated data if no audio
    const simulateAudio = (time) => {
      for (let i = 0; i < bufferLength; i++) {
        const freq = i / bufferLength;
        const wave1 = Math.sin(time * 0.001 + i * 0.1) * 50;
        const wave2 = Math.sin(time * 0.002 + i * 0.05) * 30;
        const wave3 = Math.cos(time * 0.0015 + i * 0.15) * 40;
        dataArray[i] = Math.max(0, Math.min(255, 80 + wave1 + wave2 + wave3 * (1 - freq)));
      }
    };

    const drawBars = (time) => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Check for audio activity
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) {
        simulateAudio(time);
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barCount = 64;
      const barWidth = canvas.width / barCount;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * canvas.height * 0.85;

        const gradient = getGradient(ctx, i * barWidth, canvas.height - barHeight, barWidth, barHeight, value, i, barCount);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = getColor(value, i, barCount);

        // Main bar with rounded top
        const x = i * barWidth + 1;
        const y = canvas.height - barHeight;
        const w = barWidth - 2;
        const h = barHeight;
        const r = 3;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();

        // Reflection
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x, canvas.height, w, barHeight * 0.2);
        ctx.globalAlpha = 1;
      }
      ctx.shadowBlur = 0;
    };

    const drawWave = (time) => {
      if (analyser) {
        analyser.getByteTimeDomainData(waveArray);
      }

      const sum = waveArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0);
      if (sum < 50) {
        // Simulate wave
        for (let i = 0; i < bufferLength; i++) {
          waveArray[i] = 128 + Math.sin(time * 0.002 + i * 0.05) * 40;
        }
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple wave layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        ctx.lineWidth = 3 - layer;
        ctx.strokeStyle = colors.primary;
        ctx.globalAlpha = 1 - layer * 0.3;
        ctx.shadowBlur = 20 - layer * 5;
        ctx.shadowColor = colors.primary;

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        const offset = layer * 5;

        for (let i = 0; i < bufferLength; i++) {
          const v = waveArray[i] / 128.0;
          const y = (v * canvas.height) / 2 + Math.sin(time * 0.001 + layer) * offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Fill underneath
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = colors.primary;
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawCircle = (time) => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) {
        simulateAudio(time);
      }

      ctx.fillStyle = colors.bg + 'ee';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;

      // Get audio levels
      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
      const mid = dataArray.slice(10, 100).reduce((a, b) => a + b, 0) / 90 / 255;

      // Outer rotating rings
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = baseRadius * (1.3 + ring * 0.2) + bass * 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.primary;
        ctx.globalAlpha = 0.2 - ring * 0.05;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Circular bars
      const bars = 128;
      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * bufferLength);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * baseRadius * 0.6;

        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2 + time * 0.0003;
        const radius = baseRadius + bass * 15;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = getColor(value, i, bars);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = getColor(value, i, bars);
        ctx.stroke();
      }

      // Inner pulsing circle
      const pulseRadius = baseRadius * 0.4 + bass * baseRadius * 0.2;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(0.5, colors.primary + '88');
      gradient.addColorStop(1, colors.primary + '00');

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = colors.primary;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawParticles = (time) => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) {
        simulateAudio(time);
      }

      ctx.fillStyle = colors.bg + '15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bass = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5 / 255;
      const mid = dataArray.slice(5, 50).reduce((a, b) => a + b, 0) / 45 / 255;
      const high = dataArray.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255;

      particlesRef.current.forEach((p, i) => {
        // Update particle
        const speedMult = sensitivity * (1 + bass * 2);
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;
        p.life -= 0.003;
        p.hue = (p.hue + high * 5) % 360;

        // Attract to center on bass
        if (bass > 0.5) {
          const dx = canvas.width / 2 - p.x;
          const dy = canvas.height / 2 - p.y;
          p.vx += dx * 0.0001 * bass;
          p.vy += dy * 0.0001 * bass;
        }

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) p.vx *= -0.9;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -0.9;

        // Reset dead particles
        if (p.life <= 0) {
          p.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
          p.y = canvas.height / 2 + (Math.random() - 0.5) * 100;
          p.vx = (Math.random() - 0.5) * 4;
          p.vy = (Math.random() - 0.5) * 4;
          p.life = 1;
          p.size = Math.random() * 3 + 1 + bass * 5;
        }

        // Draw particle
        const size = p.size * (1 + mid * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);

        if (colors.primary === 'rainbow') {
          ctx.fillStyle = `hsla(${p.hue}, 100%, ${50 + p.life * 30}%, ${p.life})`;
        } else {
          ctx.fillStyle = colors.primary;
          ctx.globalAlpha = p.life;
        }
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Connect nearby particles
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.5;
      particlesRef.current.forEach((p1, i) => {
        particlesRef.current.slice(i + 1, i + 10).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = colors.primary;
            ctx.globalAlpha = (1 - dist / 100) * 0.3;
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;
    };

    const drawMilkdrop = (time) => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) {
        simulateAudio(time);
      }

      const md = milkdropRef.current;
      md.time = time;
      md.bass = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5 / 255;
      md.mid = dataArray.slice(5, 50).reduce((a, b) => a + b, 0) / 45 / 255;
      md.high = dataArray.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255;

      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Psychedelic spirals
      const spirals = 6;
      for (let s = 0; s < spirals; s++) {
        ctx.beginPath();
        const spiralOffset = (s / spirals) * Math.PI * 2;

        for (let i = 0; i < 200; i++) {
          const t = i / 200;
          const angle = t * Math.PI * 8 + time * 0.001 + spiralOffset + md.bass * 2;
          const radius = t * Math.min(canvas.width, canvas.height) * 0.5 * (1 + md.mid * 0.3);
          const wobble = Math.sin(t * 20 + time * 0.003) * 20 * md.high;

          const x = centerX + Math.cos(angle) * (radius + wobble);
          const y = centerY + Math.sin(angle) * (radius + wobble);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        const hue = (s / spirals) * 360 + time * 0.05;
        ctx.strokeStyle = colors.primary === 'rainbow'
          ? `hsla(${hue}, 100%, 50%, 0.5)`
          : colors.primary + '80';
        ctx.lineWidth = 2 + md.bass * 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
      }

      // Center burst on beat
      if (md.bass > 0.6) {
        const burstRadius = md.bass * 200;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, burstRadius);
        gradient.addColorStop(0, colors.primary + 'ff');
        gradient.addColorStop(0.5, colors.primary + '44');
        gradient.addColorStop(1, colors.primary + '00');

        ctx.beginPath();
        ctx.arc(centerX, centerY, burstRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    };

    let lastTime = 0;
    const draw = (timestamp) => {
      const time = timestamp || 0;

      switch (mode) {
        case 'bars':
          drawBars(time);
          break;
        case 'wave':
          drawWave(time);
          break;
        case 'circle':
          drawCircle(time);
          break;
        case 'particles':
          drawParticles(time);
          break;
        case 'milkdrop':
          drawMilkdrop(time);
          break;
        default:
          drawBars(time);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start the animation
    draw(0);

    // Check audio periodically
    const audioCheck = setInterval(checkAudio, 1000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      clearInterval(audioCheck);
    };
  }, [isOpen, mode, colorScheme, sensitivity, colors, getColor, getGradient]);

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
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur border-b border-gray-800">
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
                  background: c.primary === 'rainbow'
                    ? 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)'
                    : c.primary
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
            <span className="text-xs text-yellow-500">
              Demo mode - Play audio to sync
            </span>
          )}
          <span className="text-xs text-gray-500">ESC para cerrar</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-red-600/80 text-white rounded hover:bg-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
