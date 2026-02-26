import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Monitor, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import { getAnalyser } from '../../strudel/engine';

const MODE_CATEGORIES = {
  'Frequency': '📊', 'Waveform': '〰️', 'Particles': '✦',
  'Geometric': '◈', 'Nature': '🌿', 'Retro': '👾', 'Abstract': '🎨',
};

const MODES = [
  // Frequency
  { id: 'spectrum', name: 'Spectrum', cat: 'Frequency', desc: 'Winamp classic bars' },
  { id: 'bars', name: 'Bars', cat: 'Frequency', desc: 'Mirror frequency bars' },
  { id: 'circle', name: 'Circle', cat: 'Frequency', desc: 'Circular spectrum' },
  { id: 'terrain', name: 'Terrain', cat: 'Frequency', desc: 'Mountain ridgelines' },
  { id: 'radar', name: 'Radar', cat: 'Frequency', desc: 'Rotating sweep' },
  { id: 'heatmap', name: 'Heatmap', cat: 'Frequency', desc: 'Scrolling spectrogram' },
  { id: 'cityscape', name: 'Cityscape', cat: 'Frequency', desc: 'Building skyline' },
  { id: 'vuTowers', name: 'VU Towers', cat: 'Frequency', desc: 'LED segment meters' },
  { id: 'dotMatrix', name: 'Dot Matrix', cat: 'Frequency', desc: 'Pulsing dot grid' },
  // Waveform
  { id: 'scope', name: 'Scope', cat: 'Waveform', desc: 'CRT oscilloscope' },
  { id: 'wave', name: 'Wave', cat: 'Waveform', desc: 'Layered waveform' },
  { id: 'ribbon', name: 'Ribbon', cat: 'Waveform', desc: 'Thick twisting ribbon' },
  { id: 'heartbeat', name: 'Heartbeat', cat: 'Waveform', desc: 'ECG monitor sweep' },
  // Particles
  { id: 'starburst', name: 'Starburst', cat: 'Particles', desc: 'Flying star particles' },
  { id: 'fountain', name: 'Fountain', cat: 'Particles', desc: 'Upward particle spray' },
  { id: 'constellation', name: 'Constellation', cat: 'Particles', desc: 'Connected star map' },
  { id: 'firefly', name: 'Firefly', cat: 'Particles', desc: 'Glowing drift dots' },
  { id: 'rain', name: 'Rain', cat: 'Particles', desc: 'Falling streaks + ripples' },
  { id: 'confetti', name: 'Confetti', cat: 'Particles', desc: 'Spinning rectangles' },
  { id: 'embers', name: 'Embers', cat: 'Particles', desc: 'Rising glow sparks' },
  // Geometric
  { id: 'kaleido', name: 'Kaleido', cat: 'Geometric', desc: 'Kaleidoscope mandala' },
  { id: 'lissajous', name: 'Lissajous', cat: 'Geometric', desc: 'Parametric curves' },
  { id: 'spirograph', name: 'Spiro', cat: 'Geometric', desc: 'Hypotrochoid spirals' },
  { id: 'attractor', name: 'Attractor', cat: 'Geometric', desc: 'Strange attractor' },
  { id: 'phyllotaxis', name: 'Phyllotaxis', cat: 'Geometric', desc: 'Sunflower spiral' },
  { id: 'maurerRose', name: 'Maurer Rose', cat: 'Geometric', desc: 'Polar star polygons' },
  { id: 'harmonograph', name: 'Harmonograph', cat: 'Geometric', desc: 'Damped pendulum art' },
  { id: 'sacredGeo', name: 'Sacred Geo', cat: 'Geometric', desc: 'Flower of Life' },
  { id: 'moire', name: 'Moire', cat: 'Geometric', desc: 'Interference fringes' },
  { id: 'fractalTree', name: 'Fractal Tree', cat: 'Geometric', desc: 'Recursive branches' },
  // Nature
  { id: 'nebula', name: 'Nebula', cat: 'Nature', desc: 'Flowing space blobs' },
  { id: 'aurora', name: 'Aurora', cat: 'Nature', desc: 'Northern lights curtain' },
  { id: 'ripple', name: 'Ripple', cat: 'Nature', desc: 'Expanding rings' },
  { id: 'lightning', name: 'Lightning', cat: 'Nature', desc: 'Branching bolts' },
  // Retro
  { id: 'matrix', name: 'Matrix', cat: 'Retro', desc: 'Green falling code' },
  { id: 'starfield', name: 'Starfield', cat: 'Retro', desc: 'Star warp speed' },
  // Abstract
  { id: 'plasma', name: 'Plasma', cat: 'Abstract', desc: 'Demoscene sine patterns' },
  { id: 'milkdrop', name: 'Milkdrop', cat: 'Abstract', desc: 'Warp feedback spirals' },
  { id: 'tunnel', name: 'Tunnel', cat: 'Abstract', desc: '3D tunnel rings' },
  { id: 'flowField', name: 'Flow Field', cat: 'Abstract', desc: 'Noise particle trails' },
  { id: 'flame', name: 'Flame', cat: 'Abstract', desc: 'Doom fire columns' },
];

const COLORS = [
  { id: 'classic', name: 'Classic', colors: ['#00ff00', '#aaff00', '#ffff00', '#ff0000'], bg: '#000000' },
  { id: 'neon', name: 'Neon', colors: ['#ff00ff', '#00ffff', '#ff0080', '#00ff80'], bg: '#0a0014' },
  { id: 'fire', name: 'Fire', colors: ['#ff0000', '#ff6600', '#ffcc00', '#ff3300'], bg: '#1a0500' },
  { id: 'ocean', name: 'Ocean', colors: ['#0066ff', '#00ccff', '#0099cc', '#003366'], bg: '#000a14' },
  { id: 'matrix', name: 'Matrix', colors: ['#00ff41', '#00cc33', '#009922', '#00ff00'], bg: '#000800' },
  { id: 'ice', name: 'Ice', colors: ['#ffffff', '#aaddff', '#4499ff', '#0044cc'], bg: '#000408' },
  { id: 'sunset', name: 'Sunset', colors: ['#ff006a', '#ff7b00', '#ffcc00', '#ff3366'], bg: '#1a0011' },
  { id: 'cyber', name: 'Cyber', colors: ['#ff00ff', '#8800ff', '#0088ff', '#00ffff'], bg: '#05000a' },
  { id: 'acid', name: 'Acid', colors: ['#39ff14', '#ff073a', '#ffff00', '#ff00ff'], bg: '#050005' },
  { id: 'rainbow', name: 'Rainbow', colors: ['#ff0000', '#ff8800', '#ffff00', '#00ff00'], bg: '#020002' },
];

const FX_CATEGORIES = {
  'Retro': '📺', 'Glow': '✨', 'Color': '🎨', 'Beat': '💥',
  'Glitch': '⚡', 'Distort': '🌀', 'Mirror': '🪞',
};

const FX_LIST = [
  { id: 'crt', name: 'CRT', cat: 'Retro', desc: 'Scanlines + vignette + flicker' },
  { id: 'vhs', name: 'VHS', cat: 'Retro', desc: 'Tracking errors + noise' },
  { id: 'grain', name: 'Film Grain', cat: 'Retro', desc: 'Analog film noise' },
  { id: 'interlace', name: 'Interlace', cat: 'Retro', desc: 'Alternating scanlines' },
  { id: 'phosphor', name: 'Phosphor', cat: 'Retro', desc: 'CRT phosphor afterglow' },
  { id: 'bloom', name: 'Bloom', cat: 'Glow', desc: 'Soft light bleed' },
  { id: 'neonGlow', name: 'Neon Glow', cat: 'Glow', desc: 'Bright neon edges' },
  { id: 'lightLeak', name: 'Light Leak', cat: 'Glow', desc: 'Warm light at edges' },
  { id: 'radialBlur', name: 'Radial Blur', cat: 'Glow', desc: 'Zoom blur from center' },
  { id: 'hueShift', name: 'Hue Shift', cat: 'Color', desc: 'Rainbow color rotation' },
  { id: 'invert', name: 'Invert', cat: 'Color', desc: 'Negative colors' },
  { id: 'posterize', name: 'Posterize', cat: 'Color', desc: 'High contrast bands' },
  { id: 'solarize', name: 'Solarize', cat: 'Color', desc: 'Partial negative psychedelic' },
  { id: 'sepia', name: 'Sepia', cat: 'Color', desc: 'Warm vintage tone' },
  { id: 'grayscale', name: 'Grayscale', cat: 'Color', desc: 'Black & white' },
  { id: 'hypersaturate', name: 'Hypersaturate', cat: 'Color', desc: 'Extreme color boost' },
  { id: 'duotone', name: 'Duotone', cat: 'Color', desc: 'Two-color palette map' },
  { id: 'bassFlash', name: 'Bass Flash', cat: 'Beat', desc: 'Strobe on kick/bass' },
  { id: 'beatZoom', name: 'Beat Zoom', cat: 'Beat', desc: 'Zoom pulse on bass' },
  { id: 'screenShake', name: 'Screen Shake', cat: 'Beat', desc: 'Vibrate on bass hits' },
  { id: 'colorPulse', name: 'Color Pulse', cat: 'Beat', desc: 'Color wash on kick' },
  { id: 'strobe', name: 'Strobe', cat: 'Beat', desc: 'Hard white strobe' },
  { id: 'rgbSplit', name: 'RGB Split', cat: 'Glitch', desc: 'Chromatic aberration' },
  { id: 'glitchBlocks', name: 'Glitch Blocks', cat: 'Glitch', desc: 'Displaced scan strips' },
  { id: 'staticNoise', name: 'Static', cat: 'Glitch', desc: 'Random pixel noise' },
  { id: 'dataMosh', name: 'Data Mosh', cat: 'Glitch', desc: 'Block corruption' },
  { id: 'bitCrush', name: 'Bit Crush', cat: 'Glitch', desc: 'Reduced color depth' },
  { id: 'waveDist', name: 'Wave', cat: 'Distort', desc: 'Sine wave wobble' },
  { id: 'pixelate', name: 'Pixelate', cat: 'Distort', desc: 'Chunky mosaic blocks' },
  { id: 'melt', name: 'Melt', cat: 'Distort', desc: 'Dripping melt effect' },
  { id: 'mirrorH', name: 'Mirror H', cat: 'Mirror', desc: 'Left-right symmetry' },
  { id: 'mirrorV', name: 'Mirror V', cat: 'Mirror', desc: 'Top-bottom symmetry' },
  { id: 'quadMirror', name: 'Quad Mirror', cat: 'Mirror', desc: '4-fold symmetry' },
  { id: 'kaleido6', name: 'Kaleido-6', cat: 'Mirror', desc: '6-fold kaleidoscope' },
];

export default function Visualizer({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const starsRef = useRef([]);
  const tunnelRef = useRef({ rings: [], rotation: 0 });
  const nebulaRef = useRef({ blobs: [], time: 0 });
  const peaksRef = useRef([]);
  const milkdropRef = useRef({ time: 0, warpBuffer: null });
  const lissajousRef = useRef({ points: [], trail: [] });
  const attractorRef = useRef({ x: 0.1, y: 0.1, points: [] });
  const spiroRef = useRef({ angle: 0, points: [] });

  const [mode, setMode] = useState('spectrum');
  const [colorScheme, setColorScheme] = useState('classic');
  const [sensitivity, setSensitivity] = useState(2);
  const [hasAudio, setHasAudio] = useState(false);
  const [activeFx, setActiveFx] = useState(new Set());
  const [showPalette, setShowPalette] = useState(false);
  const [showFxPanel, setShowFxPanel] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);
  const extraRef = useRef({});
  const offscreenRef = useRef(null);
  const fxState = useRef({
    hueOffset: 0, prevBass: 0, flash: 0,
    beatZoom: 0, shakeX: 0, shakeY: 0,
    colorPulse: 0, colorPulseHue: 0,
    strobe: 0, glitchTimer: 0,
  });

  const palette = COLORS.find(c => c.id === colorScheme) || COLORS[0];
  const activeFxKey = [...activeFx].sort().join(',');
  const activeFxCount = activeFx.size;

  const toggleFx = (id) => {
    setActiveFx(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get color from palette based on value/index
  const getColor = useCallback((index, total, alpha = 1) => {
    const colorIndex = Math.floor((index / total) * palette.colors.length);
    const color = palette.colors[colorIndex % palette.colors.length];
    if (alpha < 1) {
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

  // Get color by amplitude (Winamp-style: low=green, mid=yellow, high=red)
  const getBarColor = useCallback((value, maxValue) => {
    const ratio = value / maxValue;
    const idx = Math.min(palette.colors.length - 1, Math.floor(ratio * palette.colors.length));
    return palette.colors[idx];
  }, [palette]);

  // HSL color from hue (0-360) for psychedelic rainbow
  const hslColor = useCallback((h, s = 100, l = 50, a = 1) => {
    return a < 1 ? `hsla(${h % 360},${s}%,${l}%,${a})` : `hsl(${h % 360},${s}%,${l}%)`;
  }, []);

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

    // Initialize peaks for spectrum
    if (peaksRef.current.length === 0) {
      peaksRef.current = new Array(128).fill(0);
    }

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

    const simulateWave = (time) => {
      for (let i = 0; i < bufferLength; i++) {
        waveArray[i] = 128 + Math.sin(time * 0.002 + i * 0.05) * 40;
      }
    };

    const getAudioLevels = () => {
      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
      const mid = dataArray.slice(10, 80).reduce((a, b) => a + b, 0) / 70 / 255;
      const high = dataArray.slice(80, 150).reduce((a, b) => a + b, 0) / 70 / 255;
      return { bass, mid, high };
    };

    // === Unified FX post-processing system ===
    const applyAllFx = (time) => {
      const s = fxState.current;
      const w = canvas.width, h = canvas.height;
      const t = time * 0.001;
      const has = (id) => activeFx.has(id);

      // Audio for beat FX
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
      const mid = dataArray.slice(10, 80).reduce((a, b) => a + b, 0) / 70 / 255;
      const high = dataArray.slice(80, 150).reduce((a, b) => a + b, 0) / 70 / 255;

      const bassHit = bass > 0.4 && bass - s.prevBass > 0.08;
      s.prevBass = bass;
      if (bassHit) {
        if (has('bassFlash')) s.flash = Math.min(1, s.flash + 0.7);
        if (has('beatZoom')) s.beatZoom = 0.06 + bass * 0.04;
        if (has('screenShake')) { s.shakeX = (Math.random() - 0.5) * 20; s.shakeY = (Math.random() - 0.5) * 20; }
        if (has('colorPulse')) { s.colorPulse = 0.7; s.colorPulseHue = Math.random() * 360; }
        if (has('strobe')) s.strobe = 1;
      }
      if (activeFx.size === 0) return;

      // Offscreen canvas helper
      if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
      const oc = offscreenRef.current;
      if (oc.width !== w || oc.height !== h) { oc.width = w; oc.height = h; }
      const octx = oc.getContext('2d');
      const snap = () => { octx.clearRect(0, 0, w, h); octx.drawImage(canvas, 0, 0); };

      // ── MIRROR (first) ──
      if (has('mirrorH')) {
        snap();
        ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(oc, 0, 0, Math.ceil(w / 2), h, 0, 0, Math.ceil(w / 2), h);
        ctx.restore();
      }
      if (has('mirrorV')) {
        snap();
        ctx.save(); ctx.translate(0, h); ctx.scale(1, -1);
        ctx.drawImage(oc, 0, 0, w, Math.ceil(h / 2), 0, 0, w, Math.ceil(h / 2));
        ctx.restore();
      }
      if (has('quadMirror')) {
        snap();
        const hw = Math.ceil(w / 2), hh2 = Math.ceil(h / 2);
        ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(oc, 0, 0, hw, hh2, 0, 0, hw, hh2); ctx.restore();
        ctx.save(); ctx.translate(0, h); ctx.scale(1, -1);
        ctx.drawImage(oc, 0, 0, hw, hh2, 0, 0, hw, hh2); ctx.restore();
        ctx.save(); ctx.translate(w, h); ctx.scale(-1, -1);
        ctx.drawImage(oc, 0, 0, hw, hh2, 0, 0, hw, hh2); ctx.restore();
      }
      if (has('kaleido6')) {
        snap();
        for (let i = 1; i < 6; i++) {
          ctx.save(); ctx.translate(w / 2, h / 2);
          ctx.rotate((i * Math.PI * 2) / 6);
          if (i % 2) ctx.scale(1, -1);
          ctx.globalAlpha = 0.5; ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(oc, 0, 0); ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      // ── DISTORTION ──
      if (has('waveDist')) {
        snap(); ctx.clearRect(0, 0, w, h);
        const amp = 8 + bass * 20, freq = 0.02 + mid * 0.03;
        for (let y = 0; y < h; y++) ctx.drawImage(oc, 0, y, w, 1, Math.sin(y * freq + t * 3) * amp, y, w, 1);
      }
      if (has('pixelate')) {
        const sz = Math.max(3, Math.floor(16 - bass * 10));
        const sw = Math.ceil(w / sz), sh = Math.ceil(h / sz);
        octx.clearRect(0, 0, w, h);
        octx.drawImage(canvas, 0, 0, sw, sh);
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(oc, 0, 0, sw, sh, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      }
      if (has('melt')) {
        snap(); ctx.clearRect(0, 0, w, h);
        for (let y = 0; y < h; y++) {
          const r = y / h;
          const dx = Math.sin(y * 0.01 + t * 2) * (5 + r * 25 * bass);
          ctx.drawImage(oc, 0, y, w, 1, dx, y + r * r * bass * 30, w, 1);
        }
      }

      // ── BEAT ZOOM ──
      if (has('beatZoom') && s.beatZoom > 0.001) {
        snap(); ctx.clearRect(0, 0, w, h);
        const z = 1 + s.beatZoom;
        ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);
        ctx.drawImage(oc, 0, 0); ctx.restore();
        s.beatZoom *= 0.88;
      }

      // ── SCREEN SHAKE ──
      if (has('screenShake') && (Math.abs(s.shakeX) > 0.5 || Math.abs(s.shakeY) > 0.5)) {
        snap(); ctx.clearRect(0, 0, w, h);
        ctx.drawImage(oc, s.shakeX, s.shakeY);
        s.shakeX *= 0.85; s.shakeY *= 0.85;
      }

      // ── COLOR FILTERS (css filter chain) ──
      const filters = [];
      if (has('invert')) filters.push('invert(1)');
      if (has('sepia')) filters.push('sepia(0.85)');
      if (has('grayscale')) filters.push('grayscale(1)');
      if (has('hypersaturate')) filters.push('saturate(3.5)');
      if (has('posterize')) filters.push('contrast(5) saturate(0.6)');
      if (filters.length > 0) {
        snap(); ctx.clearRect(0, 0, w, h);
        ctx.filter = filters.join(' ');
        ctx.drawImage(oc, 0, 0);
        ctx.filter = 'none';
      }

      // ── SOLARIZE ──
      if (has('solarize')) {
        snap(); ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.globalAlpha = 0.8;
        ctx.filter = 'brightness(1.5) contrast(1.3)';
        ctx.drawImage(oc, 0, 0);
        ctx.filter = 'none'; ctx.restore();
      }

      // ── DUOTONE ──
      if (has('duotone')) {
        snap();
        octx.clearRect(0, 0, w, h);
        octx.filter = 'grayscale(1)'; octx.drawImage(canvas, 0, 0); octx.filter = 'none';
        ctx.clearRect(0, 0, w, h); ctx.drawImage(oc, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        const dg = ctx.createLinearGradient(0, 0, w, h);
        dg.addColorStop(0, palette.colors[0]);
        dg.addColorStop(1, palette.colors[2] || palette.colors[1]);
        ctx.fillStyle = dg; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.3;
        ctx.fillStyle = palette.colors[palette.colors.length - 1];
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // ── HUE SHIFT ──
      if (has('hueShift')) {
        s.hueOffset += 2.5;
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        const hg = ctx.createLinearGradient(0, 0, w, h);
        const ho = s.hueOffset;
        for (let i = 0; i <= 4; i++) hg.addColorStop(i / 4, `hsla(${(ho + i * 90) % 360},100%,50%,0.12)`);
        ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'color';
        const hg2 = ctx.createLinearGradient(w, 0, 0, h);
        hg2.addColorStop(0, `hsla(${(ho + 45) % 360},100%,50%,0.06)`);
        hg2.addColorStop(1, `hsla(${(ho + 225) % 360},100%,50%,0.06)`);
        ctx.fillStyle = hg2; ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // ── GLOW ──
      if (has('bloom')) {
        snap(); ctx.save();
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.3;
        ctx.filter = 'blur(12px) brightness(1.4)';
        ctx.drawImage(oc, 0, 0); ctx.filter = 'none'; ctx.restore();
      }
      if (has('neonGlow')) {
        snap(); ctx.save();
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.15;
        ctx.filter = 'blur(6px) brightness(2) saturate(2)';
        ctx.drawImage(oc, 0, 0); ctx.filter = 'none'; ctx.restore();
      }
      if (has('phosphor')) {
        snap(); ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.08; ctx.filter = 'blur(4px)'; ctx.drawImage(oc, 0, 0);
        ctx.globalAlpha = 0.04; ctx.filter = 'blur(10px)'; ctx.drawImage(oc, 0, 0);
        ctx.filter = 'none'; ctx.restore();
      }
      if (has('lightLeak')) {
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const lx = w * (0.7 + Math.sin(t * 0.3) * 0.3), ly = h * (0.3 + Math.cos(t * 0.4) * 0.3);
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, h * 0.6);
        const lh = (t * 20) % 360;
        lg.addColorStop(0, `hsla(${lh},80%,60%,${0.15 + bass * 0.1})`);
        lg.addColorStop(0.5, `hsla(${(lh + 40) % 360},90%,50%,${0.08 + mid * 0.05})`);
        lg.addColorStop(1, 'transparent');
        ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h); ctx.restore();
      }
      if (has('radialBlur')) {
        snap(); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 1; i <= 8; i++) {
          ctx.globalAlpha = 0.08 / i;
          const sc = 1 + i * 0.008 * (1 + bass);
          ctx.setTransform(sc, 0, 0, sc, w / 2 * (1 - sc), h / 2 * (1 - sc));
          ctx.drawImage(oc, 0, 0);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.restore();
      }

      // ── GLITCH ──
      if (has('rgbSplit')) {
        snap(); const off = 3 + bass * 8;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5; ctx.drawImage(oc, -off, 0); ctx.drawImage(oc, off, 0);
        ctx.globalAlpha = 0.03; ctx.drawImage(oc, 0, -off * 0.5);
        ctx.restore();
      }
      if (has('glitchBlocks')) {
        s.glitchTimer++;
        if (s.glitchTimer % 3 === 0 || bassHit) {
          snap();
          const bc = 3 + Math.floor(bass * 6);
          for (let i = 0; i < bc; i++) {
            const by = Math.random() * h, bh2 = 5 + Math.random() * 30, bx = (Math.random() - 0.5) * 40;
            ctx.drawImage(oc, 0, by, w, bh2, bx, by, w, bh2);
          }
        }
      }
      if (has('staticNoise')) {
        ctx.save(); ctx.globalAlpha = 0.06 + bass * 0.04;
        for (let i = 0; i < 200; i++) {
          const nv = Math.random() * 255;
          ctx.fillStyle = `rgb(${nv},${nv},${nv})`;
          ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
        ctx.restore();
      }
      if (has('dataMosh')) {
        s.glitchTimer++;
        if (bassHit || s.glitchTimer % 10 === 0) {
          snap();
          for (let i = 0; i < 2 + Math.floor(bass * 4); i++) {
            const bx = Math.random() * w * 0.8, by = Math.random() * h * 0.8;
            const bw2 = 30 + Math.random() * 100, bh3 = 30 + Math.random() * 80;
            ctx.drawImage(oc, bx, by, bw2, bh3, bx + (Math.random() - 0.5) * 60, by + (Math.random() - 0.5) * 40, bw2, bh3);
          }
        }
      }
      if (has('bitCrush')) {
        snap(); ctx.clearRect(0, 0, w, h);
        ctx.filter = 'contrast(3) saturate(0.5)'; ctx.drawImage(oc, 0, 0); ctx.filter = 'none';
        const bSz = 3, bsw = Math.ceil(w / bSz), bsh = Math.ceil(h / bSz);
        octx.clearRect(0, 0, w, h); octx.drawImage(canvas, 0, 0, bsw, bsh);
        ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(oc, 0, 0, bsw, bsh, 0, 0, w, h); ctx.imageSmoothingEnabled = true;
      }

      // ── BEAT FLASH / STROBE ──
      if (has('bassFlash') && s.flash > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = s.flash * 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        const fg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
        const fh = (s.hueOffset * 3) % 360;
        fg.addColorStop(0, `hsla(${fh},100%,95%,${s.flash * 0.6})`);
        fg.addColorStop(0.4, `hsla(${(fh + 60) % 360},100%,70%,${s.flash * 0.3})`);
        fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h); ctx.restore();
        s.flash *= 0.78;
      }
      if (has('colorPulse') && s.colorPulse > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = s.colorPulse * 0.4;
        ctx.fillStyle = `hsl(${s.colorPulseHue},100%,50%)`;
        ctx.fillRect(0, 0, w, h); ctx.restore();
        s.colorPulse *= 0.82;
      }
      if (has('strobe') && s.strobe > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = s.strobe * 0.7; ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h); ctx.restore();
        s.strobe *= 0.6;
      }

      // ── RETRO (last, overlays on top) ──
      if (has('crt')) {
        ctx.save();
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
        for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
        ctx.globalAlpha = 0.06;
        for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.04; ctx.drawImage(canvas, -2, 0);
        ctx.globalAlpha = 0.03; ctx.drawImage(canvas, 2, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.02 + Math.random() * 0.03; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.7);
        vig.addColorStop(0, 'transparent'); vig.addColorStop(0.7, 'rgba(0,0,0,0.25)'); vig.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      if (has('vhs')) {
        snap();
        for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
          const sy = Math.random() * h, sh2 = 2 + Math.random() * 8;
          ctx.drawImage(oc, 0, sy, w, sh2, (Math.random() - 0.5) * 15, sy, w, sh2);
        }
        ctx.save(); ctx.globalAlpha = 0.03; ctx.fillStyle = '#fff';
        ctx.fillRect(0, (t * 100 + Math.random() * 50) % h, w, 3);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.02;
        ctx.drawImage(canvas, 1, 0); ctx.restore();
      }
      if (has('grain')) {
        ctx.save(); ctx.globalAlpha = 0.04 + bass * 0.02;
        for (let i = 0; i < 300; i++) {
          const gv = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgba(${gv},${gv},${gv},${0.3 + Math.random() * 0.4})`;
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
        ctx.restore();
      }
      if (has('interlace')) {
        ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
        for (let y = (Math.floor(t * 30) % 2); y < h; y += 2) ctx.fillRect(0, y, w, 1);
        ctx.restore();
      }
    };

    // === PLASMA MODE (Psychedelic demoscene) ===
    const drawPlasma = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();
      const t = time * 0.001;
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;

      // Downscale for performance
      const scale = 4;
      const w = Math.ceil(canvas.width / scale);
      const h = Math.ceil(canvas.height / scale);

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const x = px / w;
          const y = py / h;

          // Multiple sine wave interference — the classic plasma formula
          const v1 = Math.sin(x * 10 + t * (1 + bass));
          const v2 = Math.sin(y * 10 + t * 1.3);
          const v3 = Math.sin((x + y) * 8 + t * 0.7 + mid * 3);
          const v4 = Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 15 + t * (1.5 + high * 2));
          const v5 = Math.sin(x * 6 * Math.cos(t * 0.3) + y * 6 * Math.sin(t * 0.4) + bass * 5);

          const val = (v1 + v2 + v3 + v4 + v5) / 5;

          // Map to rainbow hue with audio-reactive offset
          const hue = (val * 180 + 180 + t * 40 + bass * 120) % 360;
          const sat = 85 + high * 15;
          const lit = 35 + mid * 30 + val * 15;

          // HSL to RGB conversion inline
          const hNorm = hue / 360;
          const sNorm = sat / 100;
          const lNorm = lit / 100;
          const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
          const p = 2 * lNorm - q;
          const hue2rgb = (p2, q2, t2) => {
            if (t2 < 0) t2 += 1;
            if (t2 > 1) t2 -= 1;
            if (t2 < 1/6) return p2 + (q2 - p2) * 6 * t2;
            if (t2 < 1/2) return q2;
            if (t2 < 2/3) return p2 + (q2 - p2) * (2/3 - t2) * 6;
            return p2;
          };
          const r = Math.round(hue2rgb(p, q, hNorm + 1/3) * 255);
          const g = Math.round(hue2rgb(p, q, hNorm) * 255);
          const b = Math.round(hue2rgb(p, q, hNorm - 1/3) * 255);

          // Fill scaled block
          for (let sy = 0; sy < scale && py * scale + sy < canvas.height; sy++) {
            for (let sx = 0; sx < scale && px * scale + sx < canvas.width; sx++) {
              const idx = ((py * scale + sy) * canvas.width + px * scale + sx) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Audio-reactive bright spots
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 0.5;
        const dist = 100 + bass * 150;
        const cx = canvas.width / 2 + Math.cos(angle) * dist;
        const cy = canvas.height / 2 + Math.sin(angle) * dist;
        const size = 40 + mid * 80;
        const spotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
        spotGrad.addColorStop(0, `hsla(${(t * 60 + i * 60) % 360},100%,80%,0.4)`);
        spotGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
      }

    };

    // === KALEIDO MODE (Kaleidoscope) ===
    const drawKaleido = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();
      const t = time * 0.001;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.45;

      // Slow fade for trails
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mirrors = 12;
      const sliceAngle = (Math.PI * 2) / mirrors;

      // Draw in each mirror slice
      for (let m = 0; m < mirrors; m++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sliceAngle * m + t * 0.1);

        // Flip every other slice for mirror effect
        if (m % 2 === 1) ctx.scale(1, -1);

        // Draw multiple reactive shapes
        const layers = 5;
        for (let l = 0; l < layers; l++) {
          const dataIdx = Math.floor((l / layers) * 60);
          const audioVal = (dataArray[dataIdx] || 128) / 255;
          const dist = 30 + l * (radius / layers) * (0.5 + audioVal * 0.8);
          const wobble = Math.sin(t * 2 + l * 1.5) * 20 * mid;
          const size = 4 + audioVal * 15 + bass * 8;

          const x = Math.cos(sliceAngle * 0.3 + t * 0.5 + l * 0.3) * dist;
          const y = Math.sin(sliceAngle * 0.3 + t * 0.7 + l * 0.5) * dist * 0.5 + wobble;

          const hue = (t * 30 + l * 50 + m * 20 + audioVal * 100) % 360;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue},100%,${50 + high * 30}%,${0.6 + audioVal * 0.4})`;
          ctx.shadowBlur = 15 + bass * 20;
          ctx.shadowColor = `hsl(${hue},100%,60%)`;
          ctx.fill();

          // Connecting lines between layers
          if (l > 0) {
            const prevDist = 30 + (l - 1) * (radius / layers) * (0.5 + ((dataArray[Math.floor(((l-1) / layers) * 60)] || 128) / 255) * 0.8);
            const prevX = Math.cos(sliceAngle * 0.3 + t * 0.5 + (l-1) * 0.3) * prevDist;
            const prevY = Math.sin(sliceAngle * 0.3 + t * 0.7 + (l-1) * 0.5) * prevDist * 0.5 + Math.sin(t * 2 + (l-1) * 1.5) * 20 * mid;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `hsla(${(hue + 30) % 360},100%,60%,0.3)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // Center mandala
      const mandalaLayers = 4;
      for (let ring = 0; ring < mandalaLayers; ring++) {
        const ringR = 20 + ring * 25 + bass * 30;
        const petals = 8 + ring * 4;
        for (let p = 0; p < petals; p++) {
          const angle = (p / petals) * Math.PI * 2 + t * (0.3 + ring * 0.1);
          const petalSize = 6 + mid * 12;
          const px = cx + Math.cos(angle) * ringR;
          const py = cy + Math.sin(angle) * ringR;
          const hue = (t * 50 + ring * 90 + p * 30) % 360;

          ctx.beginPath();
          ctx.arc(px, py, petalSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue},100%,65%,0.7)`;
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${hue},100%,50%)`;
          ctx.fill();
        }
      }

      // Bright core
      const coreSize = 15 + bass * 40;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, `hsl(${(t * 60) % 360},100%,70%)`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = 50;
      ctx.shadowColor = `hsl(${(t * 60) % 360},100%,50%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    // === SPECTRUM MODE (Winamp Classic) ===
    const drawSpectrum = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barCount = 64;
      const gap = 2;
      const barWidth = (canvas.width - gap * barCount) / barCount;
      const step = Math.floor(bufferLength / barCount);
      const maxBarH = canvas.height * 0.85;

      // Ensure peaks array length
      while (peaksRef.current.length < barCount) peaksRef.current.push(0);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const raw = dataArray[dataIndex] * sensitivity;
        const barHeight = Math.min((raw / 255) * maxBarH, maxBarH);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;

        // Draw bar with Winamp-style color gradient (green at bottom → red at top)
        const barGrad = ctx.createLinearGradient(x, canvas.height, x, y);
        barGrad.addColorStop(0, palette.colors[0]);
        barGrad.addColorStop(0.5, palette.colors[1]);
        barGrad.addColorStop(0.8, palette.colors[2]);
        barGrad.addColorStop(1, palette.colors[3]);
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Segmented look (horizontal lines through bars)
        ctx.fillStyle = palette.bg;
        for (let segY = canvas.height; segY > y; segY -= 5) {
          ctx.fillRect(x, segY - 1, barWidth, 1);
        }

        // Peak-hold dot
        if (barHeight > peaksRef.current[i]) {
          peaksRef.current[i] = barHeight;
        } else {
          peaksRef.current[i] = Math.max(0, peaksRef.current[i] - 1.5);
        }

        const peakY = canvas.height - peaksRef.current[i];
        if (peaksRef.current[i] > 2) {
          const peakColor = getBarColor(peaksRef.current[i], maxBarH);
          ctx.fillStyle = peakColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = peakColor;
          ctx.fillRect(x, peakY - 3, barWidth, 3);
          ctx.shadowBlur = 0;
        }
      }

      // Reflection (subtle mirrored bars at bottom)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.scale(1, -1);
      ctx.translate(0, -canvas.height * 2);
      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const raw = dataArray[dataIndex] * sensitivity;
        const barHeight = Math.min((raw / 255) * maxBarH * 0.3, maxBarH * 0.3);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.fillStyle = palette.colors[0];
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      ctx.restore();

    };

    // === SCOPE MODE (Winamp Classic Oscilloscope) ===
    const drawScope = (time) => {
      if (analyser) analyser.getByteTimeDomainData(waveArray);
      const sum = waveArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0);
      if (sum < 50) simulateWave(time);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass } = getAudioLevels();

      // Grid lines (retro CRT feel)
      ctx.strokeStyle = palette.colors[0] + '15';
      ctx.lineWidth = 1;
      // Horizontal
      for (let y = 0; y < canvas.height; y += canvas.height / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Vertical
      for (let x = 0; x < canvas.width; x += canvas.width / 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // Center line
      ctx.strokeStyle = palette.colors[0] + '30';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Glow trail (draw faded copy behind)
      const sliceWidth = canvas.width / bufferLength;
      ctx.beginPath();
      ctx.lineWidth = 8 + bass * 6;
      ctx.strokeStyle = palette.colors[0] + '20';
      ctx.shadowBlur = 30;
      ctx.shadowColor = palette.colors[0];
      for (let i = 0; i < bufferLength; i++) {
        const v = (waveArray[i] / 128.0 - 1) * sensitivity;
        const y = (canvas.height / 2) + v * (canvas.height * 0.35);
        const x = i * sliceWidth;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main scope line
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = palette.colors[0];
      ctx.shadowBlur = 12;
      ctx.shadowColor = palette.colors[0];
      for (let i = 0; i < bufferLength; i++) {
        const v = (waveArray[i] / 128.0 - 1) * sensitivity;
        const y = (canvas.height / 2) + v * (canvas.height * 0.35);
        const x = i * sliceWidth;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dot at each vertex for retro feel
      ctx.shadowBlur = 0;
      const dotStep = Math.max(1, Math.floor(bufferLength / 80));
      for (let i = 0; i < bufferLength; i += dotStep) {
        const v = (waveArray[i] / 128.0 - 1) * sensitivity;
        const y = (canvas.height / 2) + v * (canvas.height * 0.35);
        const x = i * sliceWidth;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = palette.colors[1] || palette.colors[0];
        ctx.fill();
      }

      ctx.shadowBlur = 0;
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
      if (sum < 50) simulateWave(time);

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

      const { bass } = getAudioLevels();
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
      ctx.fillStyle = palette.bg + '10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { bass, mid, high } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDist = Math.hypot(canvas.width, canvas.height) * 0.6;

      // Update and draw stars
      starsRef.current.forEach((star, i) => {
        const speedBoost = 1 + bass * 4 + (i % 3 === 0 ? high * 3 : 0);
        star.dist += star.speed * speedBoost * sensitivity;

        if (star.dist > maxDist) {
          star.dist = 0;
          star.angle = Math.random() * Math.PI * 2;
          star.speed = Math.random() * 3 + 1;
          star.colorIndex = Math.floor(Math.random() * 4);
        }

        const x = centerX + Math.cos(star.angle) * star.dist;
        const y = centerY + Math.sin(star.angle) * star.dist;
        const size = star.size * (1.5 + star.dist / maxDist * 5) * (1 + bass * 1.5);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);

        const alpha = Math.min(1, star.dist / 60);
        const color = getColor(star.colorIndex, 4, alpha);
        ctx.fillStyle = color;
        ctx.shadowBlur = 15 + mid * 30;
        ctx.shadowColor = palette.colors[star.colorIndex];
        ctx.fill();

        // Trail line
        if (star.dist > 15) {
          const trailLength = Math.min(star.dist * 0.5, 100);
          const x2 = centerX + Math.cos(star.angle) * (star.dist - trailLength);
          const y2 = centerY + Math.sin(star.angle) * (star.dist - trailLength);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = getColor(star.colorIndex, 4, alpha * 0.5);
          ctx.lineWidth = size * 0.7;
          ctx.stroke();
        }
      });

      // Center burst on heavy bass
      if (bass > 0.5) {
        const burstR = Math.min(canvas.width, canvas.height) * 0.4 * bass;
        const burstGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, burstR);
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

      const { bass } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      tunnelRef.current.rotation += 0.01 + bass * 0.05;

      // Update rings
      tunnelRef.current.rings.forEach((ring) => {
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

    // === MILKDROP MODE ===
    const drawMilkdrop = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const t = time * 0.001;

      // Darken previous frame (creates motion blur/trail)
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Warp: rotate the canvas image slightly toward center
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(0.005 + bass * 0.02);
      const warpScale = 1.005 + bass * 0.01;
      ctx.scale(warpScale, warpScale);
      ctx.translate(-centerX, -centerY);
      ctx.globalAlpha = 0.97;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

      // Kaleidoscope symmetric lines
      const segments = 8;
      const radius = Math.min(canvas.width, canvas.height) * 0.4;

      for (let seg = 0; seg < segments; seg++) {
        const baseAngle = (seg / segments) * Math.PI * 2 + t * 0.2;

        // Draw multiple wave arms
        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          const color = palette.colors[(seg + wave) % palette.colors.length];
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 + bass * 3;
          ctx.shadowBlur = 15 + mid * 25;
          ctx.shadowColor = color;

          const points = 30;
          for (let p = 0; p < points; p++) {
            const ratio = p / points;
            const dist = ratio * radius * (0.5 + mid + bass * 0.5);
            const wobble = Math.sin(t * 3 + p * 0.5 + wave * 2) * 30 * high;
            const spiralAngle = baseAngle + ratio * (1 + wave * 0.5) + wobble * 0.01;

            const x = centerX + Math.cos(spiralAngle) * (dist + wobble);
            const y = centerY + Math.sin(spiralAngle) * (dist + wobble);

            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // Center pulsing orb
      const orbSize = 20 + bass * 60;
      const orbGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbSize);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.2, palette.colors[0]);
      orbGrad.addColorStop(0.6, palette.colors[2] + '80');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.shadowBlur = 60;
      ctx.shadowColor = palette.colors[0];
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbSize, 0, Math.PI * 2);
      ctx.fill();

      // Floating particles on high frequencies
      if (high > 0.2) {
        const particleCount = Math.floor(high * 20);
        for (let i = 0; i < particleCount; i++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = Math.random() * radius * 0.8 + 30;
          const px = centerX + Math.cos(pAngle) * pDist;
          const py = centerY + Math.sin(pAngle) * pDist;
          const pSize = Math.random() * 3 + 1;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = palette.colors[Math.floor(Math.random() * palette.colors.length)];
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }

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

    // === LISSAJOUS MODE (Parametric curves: x=sin(at+δ), y=sin(bt)) ===
    const drawLissajous = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);
      if (analyser) analyser.getByteTimeDomainData(waveArray);

      const { bass, mid, high } = getAudioLevels();
      const t = time * 0.001;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.38;

      // Slow fade for persistent trails
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Audio-reactive frequency ratios — these create the different figures
      const freqA = 1 + Math.round(bass * 4);    // 1-5
      const freqB = 2 + Math.round(mid * 5);     // 2-7
      const delta = t * 0.5 + high * Math.PI;     // phase shift

      // Draw multiple overlapping Lissajous curves
      const curves = 4;
      for (let c = 0; c < curves; c++) {
        const a = freqA + c * 0.3;
        const b = freqB + c * 0.2;
        const d = delta + c * Math.PI * 0.25;
        const points = 600;

        ctx.beginPath();
        const hue = (t * 40 + c * 80) % 360;
        ctx.strokeStyle = `hsla(${hue},100%,${55 + high * 30}%,${0.8 - c * 0.15})`;
        ctx.lineWidth = 3 - c * 0.5;
        ctx.shadowBlur = 15 + bass * 25;
        ctx.shadowColor = `hsl(${hue},100%,60%)`;

        for (let i = 0; i <= points; i++) {
          const p = (i / points) * Math.PI * 2;
          // Classic Lissajous equations
          const x = cx + Math.sin(a * p + d) * radius * (0.7 + bass * 0.3);
          const y = cy + Math.sin(b * p) * radius * (0.7 + mid * 0.3);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Glowing dots at current position along the curve
      const dotCount = 8;
      for (let i = 0; i < dotCount; i++) {
        const p = t * (1 + i * 0.3);
        const x = cx + Math.sin(freqA * p + delta + i * 0.5) * radius * (0.7 + bass * 0.3);
        const y = cy + Math.sin(freqB * p + i * 0.3) * radius * (0.7 + mid * 0.3);
        const dotSize = 5 + bass * 8;
        const hue = (t * 60 + i * 45) % 360;

        const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, dotSize * 2);
        dotGrad.addColorStop(0, `hsla(${hue},100%,90%,0.9)`);
        dotGrad.addColorStop(0.5, `hsla(${hue},100%,60%,0.4)`);
        dotGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(x, y, dotSize * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Display current ratio
      ctx.shadowBlur = 0;
      ctx.font = '14px monospace';
      ctx.fillStyle = `hsla(${(t * 50) % 360},80%,70%,0.6)`;
      ctx.fillText(`${freqA}:${freqB}`, 20, canvas.height - 20);

    };

    // === SPIROGRAPH MODE (Hypotrochoid: epitrochoid curves) ===
    const drawSpirograph = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();
      const t = time * 0.001;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.35;

      // Very slow fade — spirograph builds up over time
      ctx.fillStyle = 'rgba(0,0,0,0.015)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hypotrochoid parameters: audio-reactive
      // R = outer radius, r = inner radius, d = pen distance
      const R = 5 + Math.round(bass * 3);
      const r = 2 + Math.round(mid * 3);
      const d = 1 + high * 4;

      // Draw the spirograph curve incrementally
      spiroRef.current.angle += 0.08 + bass * 0.1;
      const maxAngle = spiroRef.current.angle;
      const startAngle = Math.max(0, maxAngle - Math.PI * 20); // Keep last ~10 rotations

      const layers = 3;
      for (let layer = 0; layer < layers; layer++) {
        const layerR = R + layer * 0.3;
        const layerD = d + layer * 0.5;
        const hue = (t * 30 + layer * 120) % 360;

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${hue},100%,${55 + high * 30}%,${0.7 - layer * 0.15})`;
        ctx.lineWidth = 2.5 - layer * 0.5;
        ctx.shadowBlur = 12 + bass * 20;
        ctx.shadowColor = `hsl(${hue},100%,50%)`;

        const step = 0.02;
        let first = true;
        for (let a = startAngle; a <= maxAngle; a += step) {
          // Hypotrochoid equations
          const x = cx + ((layerR - r) * Math.cos(a) + layerD * Math.cos(((layerR - r) / r) * a)) * scale / (layerR + layerD);
          const y = cy + ((layerR - r) * Math.sin(a) - layerD * Math.sin(((layerR - r) / r) * a)) * scale / (layerR + layerD);
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Pen position dot (where the "pen" is now)
      const penX = cx + ((R - r) * Math.cos(maxAngle) + d * Math.cos(((R - r) / r) * maxAngle)) * scale / (R + d);
      const penY = cy + ((R - r) * Math.sin(maxAngle) - d * Math.sin(((R - r) / r) * maxAngle)) * scale / (R + d);
      const penSize = 6 + bass * 12;
      const penHue = (t * 80) % 360;
      const penGrad = ctx.createRadialGradient(penX, penY, 0, penX, penY, penSize * 3);
      penGrad.addColorStop(0, `hsla(${penHue},100%,95%,1)`);
      penGrad.addColorStop(0.3, `hsla(${penHue},100%,70%,0.6)`);
      penGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = penGrad;
      ctx.beginPath();
      ctx.arc(penX, penY, penSize * 3, 0, Math.PI * 2);
      ctx.fill();

      // Show parameters
      ctx.shadowBlur = 0;
      ctx.font = '14px monospace';
      ctx.fillStyle = `hsla(${(t * 50) % 360},80%,70%,0.5)`;
      ctx.fillText(`R=${R} r=${r} d=${d.toFixed(1)}`, 20, canvas.height - 20);

    };

    // === ATTRACTOR MODE (Clifford Strange Attractor) ===
    const drawAttractor = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      if (sum < 100) simulateAudio(time);

      const { bass, mid, high } = getAudioLevels();
      const t = time * 0.001;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.18;

      // Very slow fade for point accumulation
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clifford attractor parameters — audio-modulated
      // x_{n+1} = sin(a*y_n) + c*cos(a*x_n)
      // y_{n+1} = sin(b*x_n) + d*cos(b*y_n)
      const a = -1.4 + Math.sin(t * 0.1) * 0.3 + bass * 0.5;
      const b = 1.6 + Math.cos(t * 0.13) * 0.2 + mid * 0.3;
      const c = 1.0 + Math.sin(t * 0.07) * 0.3 - high * 0.2;
      const d = 0.7 + Math.cos(t * 0.09) * 0.2 + bass * 0.3;

      let { x, y } = attractorRef.current;

      // Iterate the attractor — many points per frame
      const iterations = 3000 + Math.floor(bass * 3000);
      for (let i = 0; i < iterations; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x);
        const ny = Math.sin(b * x) + d * Math.cos(b * y);
        x = nx;
        y = ny;

        const px = cx + x * scale;
        const py = cy + y * scale;

        // Color based on position + time
        const hue = (Math.atan2(y, x) * 180 / Math.PI + 180 + t * 20) % 360;
        const brightness = 50 + high * 30;
        const alpha = 0.15 + mid * 0.15;

        ctx.fillStyle = `hsla(${hue},100%,${brightness}%,${alpha})`;
        ctx.fillRect(px, py, 1.5, 1.5);
      }

      // Save state for next frame
      attractorRef.current.x = x;
      attractorRef.current.y = y;

      // Glowing center
      const coreSize = 30 + bass * 50;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(0, `hsla(${(t * 60) % 360},100%,80%,0.15)`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Parameter display
      ctx.font = '12px monospace';
      ctx.fillStyle = `hsla(${(t * 40) % 360},60%,60%,0.4)`;
      ctx.fillText(`Clifford: a=${a.toFixed(2)} b=${b.toFixed(2)} c=${c.toFixed(2)} d=${d.toFixed(2)}`, 20, canvas.height - 20);

    };

    // ===================== NEW MODES =====================

    // --- TERRAIN: layered mountain ridgelines ---
    const drawTerrain = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const layers = 8;
      for (let l = 0; l < layers; l++) {
        const baseY = canvas.height * 0.25 + l * canvas.height * 0.09;
        ctx.beginPath(); ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 3) {
          const di = Math.floor((x / canvas.width) * bufferLength * 0.5);
          const val = dataArray[di] * sensitivity / 255;
          const mY = baseY - val * canvas.height * 0.28 * (1 - l * 0.07) + Math.sin(x * 0.008 + time * 0.001 + l) * 8;
          ctx.lineTo(x, mY);
        }
        ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
        ctx.fillStyle = getColor(l, layers, 0.6 - l * 0.04);
        ctx.fill();
        ctx.strokeStyle = getColor(l, layers, 0.9); ctx.lineWidth = 1.5; ctx.stroke();
      }
    };

    // --- RADAR: rotating sweep with frequency blips ---
    const drawRadar = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) * 0.85;
      const angle = (time * 0.001) % (Math.PI * 2);
      // Grid rings
      ctx.strokeStyle = palette.colors[0] + '20'; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, r * i / 4, 0, Math.PI * 2); ctx.stroke(); }
      // Sweep
      const sg = ctx.createConicalGradient ? null : ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.save(); ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle - 0.4, angle); ctx.closePath();
      ctx.fillStyle = palette.colors[0] + '30'; ctx.fill(); ctx.restore();
      // Sweep line
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = palette.colors[0]; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = palette.colors[0]; ctx.stroke();
      // Blips at current angle
      for (let i = 0; i < 32; i++) {
        const di = Math.floor((i / 32) * bufferLength * 0.5);
        const val = dataArray[di] * sensitivity / 255;
        if (val > 0.3) {
          const br = r * (i / 32); const bx = cx + Math.cos(angle) * br; const by = cy + Math.sin(angle) * br;
          ctx.beginPath(); ctx.arc(bx, by, 2 + val * 4, 0, Math.PI * 2);
          ctx.fillStyle = getColor(i, 32, val); ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    };

    // --- HEATMAP: scrolling spectrogram ---
    const drawHeatmap = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      // Scroll left
      ctx.drawImage(canvas, -2, 0);
      // Draw new column on right edge
      const colW = 3;
      for (let i = 0; i < 128; i++) {
        const val = dataArray[Math.floor((i / 128) * bufferLength)] * sensitivity / 255;
        const y = canvas.height - (i / 128) * canvas.height;
        const hue = val * 270; // blue(cold) → red(hot)
        ctx.fillStyle = `hsl(${270 - hue},100%,${val * 55}%)`;
        ctx.fillRect(canvas.width - colW, y - canvas.height / 128, colW, canvas.height / 128 + 1);
      }
    };

    // --- CITYSCAPE: frequency skyline ---
    const drawCityscape = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const buildings = 50; const bw = canvas.width / buildings;
      for (let i = 0; i < buildings; i++) {
        const di = Math.floor((i / buildings) * bufferLength * 0.5);
        const val = dataArray[di] * sensitivity / 255;
        const bh = val * canvas.height * 0.75;
        const x = i * bw; const y = canvas.height - bh;
        ctx.fillStyle = getColor(i, buildings, 0.8);
        ctx.fillRect(x + 1, y, bw - 2, bh);
        // Windows
        ctx.fillStyle = `rgba(255,255,200,${0.3 + Math.random() * 0.4})`;
        for (let wy = y + 6; wy < canvas.height - 4; wy += 8) {
          for (let wx = x + 3; wx < x + bw - 4; wx += 5) {
            if (Math.random() > 0.3) ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
      // Ground reflection
      ctx.save(); ctx.globalAlpha = 0.15; ctx.scale(1, -1); ctx.translate(0, -canvas.height * 2);
      ctx.drawImage(canvas, 0, canvas.height * 0.5, canvas.width, canvas.height * 0.5, 0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);
      ctx.restore();
    };

    // --- VU TOWERS: LED segment meters ---
    const drawVuTowers = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bands = 16; const bw = canvas.width / bands; const segH = 6; const gap = 2;
      const maxSegs = Math.floor(canvas.height * 0.8 / (segH + gap));
      if (!extraRef.current.vuPeaks) extraRef.current.vuPeaks = new Array(bands).fill(0);
      const peaks = extraRef.current.vuPeaks;
      for (let i = 0; i < bands; i++) {
        const di = Math.floor((i / bands) * bufferLength * 0.4);
        const val = dataArray[di] * sensitivity / 255;
        const segs = Math.floor(val * maxSegs);
        if (segs > peaks[i]) peaks[i] = segs; else peaks[i] = Math.max(0, peaks[i] - 0.3);
        for (let s = 0; s < maxSegs; s++) {
          const y = canvas.height - 20 - s * (segH + gap);
          const ratio = s / maxSegs;
          const color = ratio < 0.6 ? palette.colors[0] : ratio < 0.85 ? palette.colors[1] : palette.colors[3];
          ctx.fillStyle = s < segs ? color : color + '15';
          ctx.fillRect(i * bw + 4, y, bw - 8, segH);
        }
        // Peak indicator
        if (peaks[i] > 1) {
          const py = canvas.height - 20 - Math.floor(peaks[i]) * (segH + gap);
          ctx.fillStyle = palette.colors[3]; ctx.fillRect(i * bw + 4, py, bw - 8, segH);
        }
      }
    };

    // --- DOT MATRIX: pulsing dot grid ---
    const drawDotMatrix = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cols = 32, rows = 20;
      const cw = canvas.width / cols, ch = canvas.height / rows;
      const maxR = Math.min(cw, ch) * 0.4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const di = Math.floor((c / cols) * bufferLength * 0.5);
          const val = dataArray[di] * sensitivity / 255;
          const radius = val * maxR * (1 - r * 0.02);
          if (radius < 1) continue;
          const x = c * cw + cw / 2, y = r * ch + ch / 2;
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = getColor(c, cols, 0.7 + val * 0.3);
          ctx.shadowBlur = radius * 2; ctx.shadowColor = getColor(c, cols);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    };

    // --- RIBBON: thick waveform ribbon ---
    const drawRibbon = (time) => {
      if (analyser) analyser.getByteTimeDomainData(waveArray);
      let sum = waveArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0); if (sum < 50) simulateWave(time);
      ctx.fillStyle = palette.bg + 'ee'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const t = time * 0.001; const { bass } = getAudioLevels();
      const ribbonW = 20 + bass * 30;
      const sl = canvas.width / bufferLength;
      // Top edge
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const v = (waveArray[i] / 128 - 1) * sensitivity;
        const y = canvas.height / 2 + v * canvas.height * 0.3 - ribbonW / 2 + Math.sin(t + i * 0.05) * 5;
        if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * sl, y);
      }
      // Bottom edge (reverse)
      for (let i = bufferLength - 1; i >= 0; i--) {
        const v = (waveArray[i] / 128 - 1) * sensitivity;
        const y = canvas.height / 2 + v * canvas.height * 0.3 + ribbonW / 2 + Math.sin(t + i * 0.05) * 5;
        ctx.lineTo(i * sl, y);
      }
      ctx.closePath();
      const rg = createGradient(ctx, 0, 0, canvas.width, 0);
      ctx.fillStyle = rg; ctx.shadowBlur = 20; ctx.shadowColor = palette.colors[0]; ctx.fill();
      ctx.strokeStyle = palette.colors[0]; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // --- HEARTBEAT: ECG monitor sweep ---
    const drawHeartbeat = (time) => {
      if (analyser) analyser.getByteTimeDomainData(waveArray);
      let sum = waveArray.reduce((a, b) => Math.abs(a - 128) + Math.abs(b - 128), 0); if (sum < 50) simulateWave(time);
      if (!extraRef.current.ecgX) extraRef.current.ecgX = 0;
      const ecg = extraRef.current;
      const speed = 3; ecg.ecgX = (ecg.ecgX + speed) % canvas.width;
      // Erase bar ahead
      ctx.fillStyle = palette.bg; ctx.fillRect(ecg.ecgX, 0, 30, canvas.height);
      // Grid
      ctx.strokeStyle = palette.colors[0] + '12'; ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      for (let x = 0; x < canvas.width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      // Draw trace at current X
      const wi = Math.floor((ecg.ecgX / canvas.width) * bufferLength);
      const v = (waveArray[wi] / 128 - 1) * sensitivity;
      const y = canvas.height / 2 + v * canvas.height * 0.35;
      ctx.beginPath(); ctx.arc(ecg.ecgX, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = palette.colors[0]; ctx.shadowBlur = 15; ctx.shadowColor = palette.colors[0]; ctx.fill();
      // Trail line behind
      ctx.beginPath(); ctx.moveTo(ecg.ecgX, y);
      for (let dx = 1; dx < 200 && ecg.ecgX - dx >= 0; dx++) {
        const wi2 = Math.floor(((ecg.ecgX - dx) / canvas.width) * bufferLength);
        const v2 = (waveArray[wi2] / 128 - 1) * sensitivity;
        ctx.lineTo(ecg.ecgX - dx, canvas.height / 2 + v2 * canvas.height * 0.35);
      }
      ctx.strokeStyle = palette.colors[0]; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // --- FOUNTAIN: upward particle spray ---
    const drawFountain = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!extraRef.current.fountain) extraRef.current.fountain = [];
      const parts = extraRef.current.fountain;
      const W = canvas.width, H = canvas.height;
      // Spawn from multiple points across the bottom
      const spawn = Math.floor(bass * 30 + mid * 10 + high * 8);
      for (let i = 0; i < spawn; i++) {
        const srcX = W * 0.2 + Math.random() * W * 0.6;
        parts.push({ x: srcX, y: H, vx: (Math.random() - 0.5) * 12, vy: -6 - Math.random() * 12 - bass * 10, life: 1, ci: Math.floor(Math.random() * 4), size: 3 + Math.random() * 4 });
      }
      // Update + draw
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.005;
        if (p.life <= 0 || p.y > H + 10) { parts.splice(i, 1); continue; }
        const r = p.size * (0.5 + p.life);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
        g.addColorStop(0, getColor(p.ci, 4, p.life)); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (parts.length > 1200) parts.splice(0, parts.length - 1200);
    };

    // --- CONSTELLATION: connected star map ---
    const drawConstellation = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      if (!extraRef.current.stars2 || extraRef.current.stars2._w !== W) {
        extraRef.current.stars2 = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8 }));
        extraRef.current.stars2._w = W;
      }
      const pts = extraRef.current.stars2;
      const thresh = 160 + bass * 100;
      pts.forEach((p, i) => {
        p.x += p.vx + Math.sin(time * 0.001 + i) * 0.5 * mid; p.y += p.vy + Math.cos(time * 0.001 + i) * 0.5 * mid;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      });
      // Lines
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < thresh) {
            const alpha = 0.4 * (1 - d / thresh);
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = getColor(i % 4, 4, alpha); ctx.lineWidth = 1.5 * (1 - d / thresh); ctx.stroke();
          }
        }
      }
      // Dots
      pts.forEach((p, i) => {
        const di = Math.floor((i / pts.length) * bufferLength * 0.5);
        const val = dataArray[di] / 255;
        const r = 3 + val * 8 + bass * 4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        g.addColorStop(0, getColor(i % 4, 4, 0.9)); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    // --- FIREFLY: glowing drift dots ---
    const drawFirefly = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.025)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      if (!extraRef.current.flies || extraRef.current.flies._w !== W) {
        extraRef.current.flies = Array.from({ length: 150 }, (_, i) => ({
          x: Math.random() * W, y: Math.random() * H, phase: Math.random() * Math.PI * 2,
          ci: i % 4, speed: 0.3 + Math.random() * 0.7, size: 0.5 + Math.random() * 1.0,
        }));
        extraRef.current.flies._w = W;
      }
      const t = time * 0.001;
      ctx.globalCompositeOperation = 'lighter';
      extraRef.current.flies.forEach((f, i) => {
        f.x += Math.sin(t * 0.7 + f.phase) * f.speed * (1.5 + mid * 4);
        f.y += Math.cos(t * 0.5 + f.phase * 1.3) * f.speed * (1.5 + mid * 4);
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
        if (f.y < -20) f.y = H + 20; if (f.y > H + 20) f.y = -20;
        const brightness = 0.5 + Math.sin(t * 3 + f.phase) * 0.3 + bass * 0.4;
        const r = (12 + bass * 25 + high * 10) * f.size;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, getColor(f.ci, 4, brightness));
        g.addColorStop(0.4, getColor(f.ci, 4, brightness * 0.4));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    // --- RAIN: falling streaks + ripples ---
    const drawRain = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = palette.bg + 'cc'; ctx.fillRect(0, 0, W, H);
      if (!extraRef.current.drops) extraRef.current.drops = [];
      if (!extraRef.current.splashes) extraRef.current.splashes = [];
      const drops = extraRef.current.drops, splashes = extraRef.current.splashes;
      // Spawn drops across full width
      const rate = Math.floor(10 + high * 40 + mid * 15);
      for (let i = 0; i < rate; i++) {
        const wind = (Math.sin(time * 0.0005) * 2);
        drops.push({ x: Math.random() * (W + 100) - 50, y: -20 - Math.random() * 40, speed: 6 + Math.random() * 12 + bass * 8, len: 15 + Math.random() * 35 + bass * 15, wind, ci: Math.floor(Math.random() * 4) });
      }
      // Update drops
      ctx.globalCompositeOperation = 'lighter';
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.y += d.speed; d.x += d.wind;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.wind * 2, d.y - d.len);
        ctx.strokeStyle = getColor(d.ci, 4, 0.4); ctx.lineWidth = 1.5 + bass; ctx.stroke();
        if (d.y > H) {
          splashes.push({ x: d.x, y: H - 5 - Math.random() * 20, r: 1, ci: d.ci, maxR: 30 + bass * 40 });
          drops.splice(i, 1);
        }
      }
      // Splashes — bigger ripples
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]; s.r += 2 + bass;
        const alpha = Math.max(0, 1 - s.r / s.maxR);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.strokeStyle = getColor(s.ci, 4, alpha * 0.6); ctx.lineWidth = 2 * alpha; ctx.stroke();
        if (s.r > s.maxR) splashes.splice(i, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (drops.length > 600) drops.splice(0, drops.length - 600);
      if (splashes.length > 200) splashes.splice(0, splashes.length - 200);
    };

    // --- CONFETTI: spinning rectangles ---
    const drawConfetti = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, W, H);
      if (!extraRef.current.confetti) extraRef.current.confetti = [];
      const parts = extraRef.current.confetti;
      // Spawn from top + sides; more on beat
      const count = bass > 0.3 ? Math.floor(15 + bass * 25) : Math.floor(2 + mid * 5);
      for (let i = 0; i < count; i++) {
        const fromSide = Math.random() < 0.3;
        parts.push({
          x: fromSide ? (Math.random() < 0.5 ? -10 : W + 10) : Math.random() * W,
          y: fromSide ? Math.random() * H * 0.5 : -15,
          vx: (Math.random() - 0.5) * 8 + (fromSide ? (parts[parts.length-1]?.x < W/2 ? 3 : -3) : 0),
          vy: 1.5 + Math.random() * 4, rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.3, w: 8 + Math.random() * 14,
          h: 5 + Math.random() * 10, ci: Math.floor(Math.random() * 4),
        });
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.025; p.rot += p.rotV; p.vx *= 0.995;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = palette.colors[p.ci]; ctx.shadowBlur = 6; ctx.shadowColor = palette.colors[p.ci];
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        if (p.y > H + 30 || p.x < -50 || p.x > W + 50) parts.splice(i, 1);
      }
      ctx.shadowBlur = 0;
      if (parts.length > 1000) parts.splice(0, parts.length - 1000);
    };

    // --- EMBERS: rising glow sparks ---
    const drawEmbers = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, W, H);
      if (!extraRef.current.embers) extraRef.current.embers = [];
      const parts = extraRef.current.embers;
      // Spawn from bottom + sides, more on beat
      const count = 4 + Math.floor(bass * 15 + mid * 5);
      for (let i = 0; i < count; i++) {
        const fromSide = Math.random() < 0.2;
        parts.push({
          x: fromSide ? (Math.random() < 0.5 ? -5 : W + 5) : Math.random() * W,
          y: fromSide ? H * 0.5 + Math.random() * H * 0.5 : H + 5,
          vy: -0.8 - Math.random() * 3, life: 1,
          ci: Math.floor(Math.random() * 4), phase: Math.random() * Math.PI * 2,
          size: 0.5 + Math.random() * 1.5,
        });
      }
      const t = time * 0.001;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.y += p.vy - bass * 3; p.x += Math.sin(t * 2 + p.phase) * 1.5 * (1 + mid); p.life -= 0.004;
        if (p.life <= 0 || p.y < -20) { parts.splice(i, 1); continue; }
        const r = (8 + p.life * 16 + bass * 12) * p.size;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, getColor(p.ci, 4, p.life * 0.9));
        g.addColorStop(0.3, getColor(p.ci, 4, p.life * 0.4));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (parts.length > 800) parts.splice(0, parts.length - 800);
    };

    // --- PHYLLOTAXIS: sunflower spiral ---
    const drawPhyllotaxis = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const golden = 137.508 * Math.PI / 180;
      const t = time * 0.001;
      const count = 300;
      for (let i = 0; i < count; i++) {
        const di = Math.floor((i / count) * bufferLength * 0.5);
        const val = dataArray[di] * sensitivity / 255;
        const angle = i * golden + t * 0.3;
        const r = Math.sqrt(i) * (8 + bass * 4);
        const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
        const dotR = 2 + val * 6;
        ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2);
        const hue = (i * 2 + t * 30) % 360;
        ctx.fillStyle = `hsla(${hue},100%,${45 + val * 30}%,${0.6 + val * 0.4})`;
        ctx.shadowBlur = val * 10; ctx.shadowColor = `hsl(${hue},100%,50%)`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    // --- MAURER ROSE: polar star polygons ---
    const drawMaurerRose = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const scale = Math.min(cx, cy) * 0.8;
      const t = time * 0.001;
      const n = 2 + Math.round(bass * 5); // petals
      const d = 30 + Math.round(mid * 70 + Math.sin(t * 0.3) * 20); // step degrees
      ctx.beginPath();
      for (let k = 0; k <= 360; k++) {
        const theta = (k * d) * Math.PI / 180;
        const r = Math.sin(n * theta) * scale;
        const x = cx + r * Math.cos(theta), y = cy + r * Math.sin(theta);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const hue = (t * 40) % 360;
      ctx.strokeStyle = `hsla(${hue},100%,${55 + high * 30}%,0.7)`;
      ctx.lineWidth = 1.5; ctx.shadowBlur = 12; ctx.shadowColor = `hsl(${hue},100%,50%)`; ctx.stroke();
      // Inner rose curve
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.01) {
        const r = Math.sin(n * theta) * scale;
        const x = cx + r * Math.cos(theta), y = cy + r * Math.sin(theta);
        if (theta === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${(hue + 180) % 360},100%,60%,0.5)`;
      ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
    };

    // --- HARMONOGRAPH: damped pendulum art ---
    const drawHarmonograph = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const scale = Math.min(cx, cy) * 0.7;
      const t = time * 0.001;
      const f1 = 2 + bass * 3, f2 = 3 + mid * 4, f3 = 1.5 + high * 2;
      const d = 0.002 + bass * 0.003; // damping
      ctx.beginPath();
      const hue = (t * 25) % 360;
      ctx.strokeStyle = `hsla(${hue},100%,60%,0.6)`;
      ctx.lineWidth = 1.5; ctx.shadowBlur = 8; ctx.shadowColor = `hsl(${hue},100%,50%)`;
      for (let i = 0; i < 2000; i++) {
        const tt = t + i * 0.005;
        const decay = Math.exp(-d * i);
        const x = cx + (Math.sin(f1 * tt + 1) + Math.sin(f3 * tt * 0.7 + 2)) * scale * 0.5 * decay;
        const y = cy + (Math.sin(f2 * tt + 3) + Math.cos(f1 * tt * 0.6 + 1)) * scale * 0.5 * decay;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
    };

    // --- SACRED GEO: Flower of Life ---
    const drawSacredGeo = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const baseR = 40 + bass * 20; const t = time * 0.001;
      // Flower of Life: center + 6 around it, then 12, etc.
      const centers = [{ x: cx, y: cy }];
      for (let ring = 1; ring <= 3; ring++) {
        const n = ring * 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + t * 0.1 * ring;
          centers.push({ x: cx + Math.cos(a) * baseR * ring, y: cy + Math.sin(a) * baseR * ring });
        }
      }
      centers.forEach((c, i) => {
        const di = Math.floor((i / centers.length) * bufferLength * 0.4);
        const val = dataArray[di] * sensitivity / 255;
        const r = baseR * (0.8 + val * 0.4);
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        const hue = (i * 15 + t * 20) % 360;
        ctx.strokeStyle = `hsla(${hue},80%,${50 + val * 30}%,${0.3 + val * 0.4})`;
        ctx.lineWidth = 1.5 + val * 2;
        ctx.shadowBlur = 10 + val * 15; ctx.shadowColor = `hsl(${hue},100%,50%)`;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    };

    // --- MOIRE: interference fringes ---
    const drawMoire = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const t = time * 0.001;
      const maxR = Math.max(canvas.width, canvas.height) * 0.6;
      ctx.lineWidth = 1;
      // First set of circles from center
      ctx.strokeStyle = palette.colors[0] + '40';
      const spacing1 = 12 + bass * 8;
      for (let r = spacing1; r < maxR; r += spacing1) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
      // Second set offset
      const ox = Math.sin(t * 0.5) * 60 * (1 + mid), oy = Math.cos(t * 0.4) * 60 * (1 + mid);
      ctx.strokeStyle = palette.colors[1] + '40';
      const spacing2 = 13 + mid * 8;
      for (let r = spacing2; r < maxR; r += spacing2) { ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2); ctx.stroke(); }
      // Third set
      ctx.strokeStyle = palette.colors[2] + '30';
      const ox2 = Math.cos(t * 0.3) * 40, oy2 = Math.sin(t * 0.6) * 40;
      for (let r = 15; r < maxR; r += 15) { ctx.beginPath(); ctx.arc(cx + ox2, cy + oy2, r, 0, Math.PI * 2); ctx.stroke(); }
    };

    // --- FRACTAL TREE: recursive branches ---
    const drawFractalTree = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const t = time * 0.001;
      const drawBranch = (x, y, angle, len, depth) => {
        if (depth > 10 || len < 3) return;
        const x2 = x + Math.cos(angle) * len, y2 = y + Math.sin(angle) * len;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        const hue = (depth * 30 + t * 20) % 360;
        ctx.strokeStyle = `hsla(${hue},80%,${40 + high * 30}%,${0.9 - depth * 0.07})`;
        ctx.lineWidth = Math.max(1, 8 - depth * 0.7); ctx.stroke();
        const sway = Math.sin(t * 2 + depth * 0.5) * 0.1 * mid;
        const spread = 0.4 + bass * 0.3;
        drawBranch(x2, y2, angle - spread + sway, len * (0.67 + high * 0.1), depth + 1);
        drawBranch(x2, y2, angle + spread + sway, len * (0.67 + high * 0.1), depth + 1);
      };
      drawBranch(canvas.width / 2, canvas.height, -Math.PI / 2, 120 + bass * 40, 0);
    };

    // --- AURORA: northern lights ---
    const drawAurora = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid, high } = getAudioLevels();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const t = time * 0.001;
      const curtains = 5;
      for (let c = 0; c < curtains; c++) {
        const yBase = canvas.height * (0.15 + c * 0.12);
        const di = Math.floor((c / curtains) * bufferLength * 0.3);
        const val = dataArray[di] * sensitivity / 255;
        ctx.beginPath(); ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 4) {
          const wave = Math.sin(x * 0.005 + t * (0.5 + c * 0.2)) * 40 * (1 + mid);
          const wave2 = Math.sin(x * 0.01 + t * 0.8 + c) * 20 * bass;
          ctx.lineTo(x, yBase + wave + wave2 - val * canvas.height * 0.2);
        }
        ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
        const hue = (120 + c * 40 + t * 10) % 360;
        const ag = ctx.createLinearGradient(0, yBase - 100, 0, canvas.height);
        ag.addColorStop(0, `hsla(${hue},80%,60%,${0.15 + val * 0.2})`);
        ag.addColorStop(0.3, `hsla(${(hue + 30) % 360},90%,40%,${0.1 + val * 0.15})`);
        ag.addColorStop(1, 'transparent');
        ctx.fillStyle = ag; ctx.fill();
      }
    };

    // --- RIPPLE: expanding concentric rings ---
    const drawRipple = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!extraRef.current.rings) extraRef.current.rings = [];
      const rings = extraRef.current.rings;
      // Spawn on bass
      if (bass > 0.4) rings.push({ x: canvas.width / 2, y: canvas.height / 2, r: 5, life: 1, hue: Math.random() * 360 });
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]; ring.r += 3 + bass * 5; ring.life -= 0.01;
        if (ring.life <= 0) { rings.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ring.hue},100%,60%,${ring.life * 0.6})`;
        ctx.lineWidth = 2 + ring.life * 4; ctx.shadowBlur = 10; ctx.shadowColor = `hsla(${ring.hue},100%,50%,0.5)`; ctx.stroke();
      }
      if (rings.length > 40) rings.splice(0, rings.length - 40);
      ctx.shadowBlur = 0;
    };

    // --- LIGHTNING: branching bolts ---
    const drawLightning = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (bass < 0.35) return;
      const bolt = (x1, y1, x2, y2, depth) => {
        if (depth > 5) return;
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * (80 / (depth + 1));
        const my = (y1 + y2) / 2 + (Math.random() - 0.5) * (40 / (depth + 1));
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(mx, my); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(200,220,255,${0.8 - depth * 0.12})`; ctx.lineWidth = 3 - depth * 0.4;
        ctx.shadowBlur = 20 - depth * 3; ctx.shadowColor = palette.colors[0]; ctx.stroke();
        bolt(x1, y1, mx, my, depth + 1);
        bolt(mx, my, x2, y2, depth + 1);
        if (Math.random() > 0.6) bolt(mx, my, mx + (Math.random() - 0.5) * 100, my + 50 + Math.random() * 80, depth + 1);
      };
      const sx = canvas.width * (0.3 + Math.random() * 0.4);
      bolt(sx, 0, sx + (Math.random() - 0.5) * 100, canvas.height, 0);
      ctx.shadowBlur = 0;
    };

    // --- MATRIX: falling green code ---
    const drawMatrix = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const fontSize = 14; const cols = Math.floor(canvas.width / fontSize);
      if (!extraRef.current.matrixDrops) extraRef.current.matrixDrops = new Array(cols).fill(0).map(() => Math.random() * canvas.height / fontSize);
      const drops = extraRef.current.matrixDrops;
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols; i++) {
        const di = Math.floor((i / cols) * bufferLength * 0.3);
        const val = dataArray[di] / 255;
        const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        ctx.fillStyle = `rgba(0,${180 + val * 75},0,${0.6 + val * 0.4})`;
        ctx.shadowBlur = val * 8; ctx.shadowColor = palette.colors[0];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5 + bass * 1.5 + val * 0.5;
      }
      ctx.shadowBlur = 0;
    };

    // --- STARFIELD: star warp speed ---
    const drawStarfield = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!extraRef.current.warpStars) extraRef.current.warpStars = Array.from({ length: 300 }, () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() * 4 }));
      const stars = extraRef.current.warpStars;
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const speed = 0.02 + bass * 0.08;
      stars.forEach(s => {
        const pz = s.z; s.z -= speed;
        if (s.z <= 0.01) { s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; s.z = 4; return; }
        const sx = cx + (s.x / s.z) * 400, sy = cy + (s.y / s.z) * 400;
        const px = cx + (s.x / pz) * 400, py = cy + (s.y / pz) * 400;
        if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) { s.z = 4; return; }
        const brightness = (1 - s.z / 4);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy);
        ctx.strokeStyle = getColor(0, 4, brightness * 0.8); ctx.lineWidth = brightness * 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, brightness * 2, 0, Math.PI * 2);
        ctx.fillStyle = getColor(0, 4, brightness); ctx.fill();
      });
    };

    // --- FLOW FIELD: noise particle trails ---
    const drawFlowField = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid } = getAudioLevels();
      ctx.fillStyle = 'rgba(0,0,0,0.02)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!extraRef.current.flowParts) extraRef.current.flowParts = Array.from({ length: 500 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, ci: Math.floor(Math.random() * 4) }));
      const parts = extraRef.current.flowParts;
      const t = time * 0.0003;
      const scale = 0.003 + mid * 0.002;
      parts.forEach(p => {
        // Simple noise approximation using sin/cos
        const angle = Math.sin(p.x * scale + t) * Math.cos(p.y * scale + t * 0.7) * Math.PI * 2 + bass * Math.sin(t * 5);
        const speed = 1.5 + bass * 2;
        p.x += Math.cos(angle) * speed; p.y += Math.sin(angle) * speed;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) { p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height; }
        ctx.fillStyle = getColor(p.ci, 4, 0.3);
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      });
    };

    // --- FLAME: doom fire columns ---
    const drawFlame = (time) => {
      if (analyser) analyser.getByteFrequencyData(dataArray);
      let sum = dataArray.reduce((a, b) => a + b, 0); if (sum < 100) simulateAudio(time);
      const { bass, mid } = getAudioLevels();
      const scale = 4; const fw = Math.ceil(canvas.width / scale); const fh = Math.ceil(canvas.height / scale);
      if (!extraRef.current.fireGrid || extraRef.current.fireGrid.length !== fw * fh) extraRef.current.fireGrid = new Uint8Array(fw * fh);
      const grid = extraRef.current.fireGrid;
      // Seed bottom row
      for (let x = 0; x < fw; x++) {
        const di = Math.floor((x / fw) * bufferLength * 0.5);
        const val = dataArray[di] * sensitivity / 255;
        grid[(fh - 1) * fw + x] = Math.min(255, Math.floor((150 + bass * 100) * val + Math.random() * 40));
      }
      // Propagate up
      for (let y = 0; y < fh - 1; y++) {
        for (let x = 0; x < fw; x++) {
          const below = grid[(y + 1) * fw + x];
          const left = grid[(y + 1) * fw + Math.max(0, x - 1)];
          const right = grid[(y + 1) * fw + Math.min(fw - 1, x + 1)];
          const avg = (below + left + right) / 3;
          grid[y * fw + x] = Math.max(0, Math.floor(avg - 1.5 - Math.random() * 2));
        }
      }
      // Render
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const v = grid[y * fw + x];
          const r2 = Math.min(255, v * 2), g2 = Math.min(255, Math.max(0, v - 80) * 3), b2 = Math.max(0, v - 200) * 5;
          for (let sy = 0; sy < scale && y * scale + sy < canvas.height; sy++) {
            for (let sx = 0; sx < scale && x * scale + sx < canvas.width; sx++) {
              const idx = ((y * scale + sy) * canvas.width + x * scale + sx) * 4;
              data[idx] = r2; data[idx + 1] = g2; data[idx + 2] = b2; data[idx + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    };

    let lastFrameTime = 0;
    const targetFrameInterval = 1000 / 45;

    const draw = (timestamp) => {
      const time = timestamp || 0;
      if (time - lastFrameTime < targetFrameInterval) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = time;

      switch (mode) {
        case 'spectrum': drawSpectrum(time); break;
        case 'scope': drawScope(time); break;
        case 'bars': drawBars(time); break;
        case 'wave': drawWave(time); break;
        case 'plasma': drawPlasma(time); break;
        case 'kaleido': drawKaleido(time); break;
        case 'lissajous': drawLissajous(time); break;
        case 'spirograph': drawSpirograph(time); break;
        case 'attractor': drawAttractor(time); break;
        case 'circle': drawCircle(time); break;
        case 'starburst': drawStarburst(time); break;
        case 'tunnel': drawTunnel(time); break;
        case 'milkdrop': drawMilkdrop(time); break;
        case 'nebula': drawNebula(time); break;
        // Frequency
        case 'terrain': drawTerrain(time); break;
        case 'radar': drawRadar(time); break;
        case 'heatmap': drawHeatmap(time); break;
        case 'cityscape': drawCityscape(time); break;
        case 'vuTowers': drawVuTowers(time); break;
        case 'dotMatrix': drawDotMatrix(time); break;
        // Waveform
        case 'ribbon': drawRibbon(time); break;
        case 'heartbeat': drawHeartbeat(time); break;
        // Particles
        case 'fountain': drawFountain(time); break;
        case 'constellation': drawConstellation(time); break;
        case 'firefly': drawFirefly(time); break;
        case 'rain': drawRain(time); break;
        case 'confetti': drawConfetti(time); break;
        case 'embers': drawEmbers(time); break;
        // Geometric
        case 'phyllotaxis': drawPhyllotaxis(time); break;
        case 'maurerRose': drawMaurerRose(time); break;
        case 'harmonograph': drawHarmonograph(time); break;
        case 'sacredGeo': drawSacredGeo(time); break;
        case 'moire': drawMoire(time); break;
        case 'fractalTree': drawFractalTree(time); break;
        // Nature
        case 'aurora': drawAurora(time); break;
        case 'ripple': drawRipple(time); break;
        case 'lightning': drawLightning(time); break;
        // Retro
        case 'matrix': drawMatrix(time); break;
        case 'starfield': drawStarfield(time); break;
        // Abstract
        case 'flowField': drawFlowField(time); break;
        case 'flame': drawFlame(time); break;
        default: drawSpectrum(time);
      }

      applyAllFx(time);
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
  }, [isOpen, mode, colorScheme, sensitivity, activeFxKey, palette, getColor, createGradient, getBarColor, hslColor, activeFx]);

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
      <div className="flex items-center justify-between px-4 py-2 glass-panel shadow-panel border-b border-gray-800 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-purple-400 font-bold tracking-wider">VISUALIZER</span>

          {/* Mode selector — dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModePanel(!showModePanel)}
              className="btn-pro flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <Monitor size={12} className="text-purple-400" />
              <span className="text-gray-200">{MODES.find(m => m.id === mode)?.name || mode}</span>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${showModePanel ? 'rotate-180' : ''}`} />
            </button>

            {showModePanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModePanel(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-[28rem] overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
                  {Object.entries(MODE_CATEGORIES).map(([cat, icon]) => {
                    const items = MODES.filter(m => m.cat === cat);
                    return (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-900/80 sticky top-0">
                          {icon} {cat}
                        </div>
                        {items.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setMode(m.id); setShowModePanel(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
                              mode === m.id
                                ? 'bg-purple-600/20 border-l-2 border-purple-400'
                                : 'hover:bg-gray-800 border-l-2 border-transparent'
                            }`}
                          >
                            <span className={`text-sm flex-shrink-0 ${mode === m.id ? 'text-white font-medium' : 'text-gray-300'}`}>
                              {m.name}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Color selector — dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="btn-pro flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <div
                className="w-14 h-4 rounded-sm"
                style={{
                  background: `linear-gradient(90deg, ${palette.colors.join(', ')})`
                }}
              />
              <span className="text-gray-200">{palette.name}</span>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${showPalette ? 'rotate-180' : ''}`} />
            </button>

            {showPalette && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPalette(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setColorScheme(c.id); setShowPalette(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        colorScheme === c.id
                          ? 'bg-purple-600/30 border-l-2 border-purple-400'
                          : 'hover:bg-gray-800 border-l-2 border-transparent'
                      }`}
                    >
                      <div
                        className="w-20 h-5 rounded-md flex-shrink-0 ring-1 ring-white/10"
                        style={{
                          background: `linear-gradient(90deg, ${c.colors.join(', ')})`
                        }}
                      />
                      <span className={`text-sm ${colorScheme === c.id ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {c.name}
                      </span>
                      <div className="flex gap-0.5 ml-auto">
                        {c.colors.map((col, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sensitivity */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-400">Intensity</span>
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

          {/* FX dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowFxPanel(!showFxPanel)}
              className={`btn-pro flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                activeFxCount > 0 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Zap size={12} />
              FX{activeFxCount > 0 ? ` (${activeFxCount})` : ''}
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${showFxPanel ? 'rotate-180' : ''}`} />
            </button>

            {showFxPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFxPanel(false)} />
                <div className="absolute top-full right-0 mt-1 z-50 w-72 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
                  {/* Clear all button */}
                  {activeFxCount > 0 && (
                    <button
                      onClick={() => setActiveFx(new Set())}
                      className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-gray-800 text-right border-b border-gray-800"
                    >
                      Clear all ({activeFxCount})
                    </button>
                  )}
                  {Object.entries(FX_CATEGORIES).map(([cat, icon]) => {
                    const items = FX_LIST.filter(f => f.cat === cat);
                    return (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-900/80 sticky top-0">
                          {icon} {cat}
                        </div>
                        {items.map(fx => (
                          <button
                            key={fx.id}
                            onClick={() => toggleFx(fx.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
                              activeFx.has(fx.id)
                                ? 'bg-purple-600/20 border-l-2 border-purple-400'
                                : 'hover:bg-gray-800 border-l-2 border-transparent'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              activeFx.has(fx.id) ? 'bg-purple-400' : 'bg-gray-700'
                            }`} />
                            <span className={`text-sm flex-shrink-0 ${activeFx.has(fx.id) ? 'text-white font-medium' : 'text-gray-300'}`}>
                              {fx.name}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">{fx.desc}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasAudio && (
            <span className="text-xs text-yellow-500 animate-pulse">
              Demo mode - Press Play to sync
            </span>
          )}
          <span className="text-xs text-gray-500">ESC to close</span>
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
