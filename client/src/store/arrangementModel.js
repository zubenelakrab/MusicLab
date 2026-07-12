import { generateId, generateTrackId, generateClipId } from '../utils/id.js';

export const defaultLayerParams = {
  gain: 0.8,
  cutoff: 8000,
  resonance: 0,
  speed: 1,
  pan: 0,
  reverb: 0,
  reverbSize: 2,
  delay: 0,
  delayTime: 0.25,
  delayFeedback: 0.3,
  distortion: 0,
  hpf: 0,
  phaser: 0,
  phaserDepth: 0.5,
};

export const defaultGroove = {
  swing: 0,
  humanize: 0,
};

export const AUTOMATION_BOUNDS = {
  gain: { min: 0, max: 1 },
  pan: { min: -1, max: 1 },
  cutoff: { min: 200, max: 12000 },
};

export const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function getAutomationBounds(param) {
  return AUTOMATION_BOUNDS[param] || { min: 0, max: 1 };
}

export function createAutomationLane(param, initialValue) {
  const { min, max } = getAutomationBounds(param);
  return {
    enabled: false,
    min,
    max,
    points: [{ bar: 0, value: clamp(initialValue, min, max) }],
  };
}

export function createDefaultTrackAutomation(params = defaultLayerParams) {
  return {
    gain: createAutomationLane('gain', params.gain ?? 0.8),
    pan: createAutomationLane('pan', params.pan ?? 0),
    cutoff: createAutomationLane('cutoff', params.cutoff ?? 8000),
  };
}

export const createLayer = (code = '', name = 'Layer') => ({
  id: generateId(),
  name,
  code,
  muted: false,
  solo: false,
  params: { ...defaultLayerParams },
});

export const createTrack = (name = 'Track', colorIndex = 0) => ({
  id: generateTrackId(),
  name,
  color: TRACK_COLORS[colorIndex % TRACK_COLORS.length],
  muted: false,
  solo: false,
  height: 100,
  params: { ...defaultLayerParams },
  groove: { ...defaultGroove },
  automation: createDefaultTrackAutomation(defaultLayerParams),
  clips: [],
});

export function normalizeTrack(track = {}, colorIndex = 0) {
  const base = createTrack(track.name || 'Track', colorIndex);
  const params = { ...base.params, ...(track.params || {}) };
  const automation = createDefaultTrackAutomation(params);

  if (track.automation && typeof track.automation === 'object') {
    Object.keys(automation).forEach((param) => {
      const lane = track.automation[param];
      if (!lane || typeof lane !== 'object') return;
      const { min, max } = getAutomationBounds(param);
      const points = Array.isArray(lane.points)
        ? lane.points
          .filter((point) => point && Number.isFinite(point.bar) && Number.isFinite(point.value))
          .map((point) => ({
            bar: Math.max(0, point.bar),
            value: clamp(point.value, min, max),
          }))
          .sort((a, b) => a.bar - b.bar)
        : automation[param].points;

      automation[param] = {
        ...automation[param],
        enabled: Boolean(lane.enabled),
        points: points.length > 0 ? points : automation[param].points,
      };
    });
  }

  return {
    ...base,
    ...track,
    params,
    groove: { ...defaultGroove, ...(track.groove || {}) },
    automation,
    clips: Array.isArray(track.clips) ? track.clips : [],
  };
}

export const createClip = (
  startBar,
  durationBars,
  patternId = null,
  name = 'Clip',
  color = '#00d4aa',
  code = ''
) => ({
  id: generateClipId(),
  patternId,
  name,
  startBar,
  durationBars,
  color,
  layers: patternId ? null : [createLayer(code, 'Layer 1')],
});

export const createInitialArrangement = () => {
  // ============================================================
  // SUPER MARIO THEME — DRUM & BASS (from scratch)
  // Una composición completa, rica y reconocible
  // La melodía del Mario Theme es el centro, con capas, variaciones
  // y soporte completo de todas las pistas. No simple, no delgado.
  // ============================================================

  const drumsTrack = {
    id: generateTrackId(),
    name: 'Breaks',
    color: TRACK_COLORS[0],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.9,
      cutoff: 8000,
      reverb: 0.03,
    },
    groove: { swing: 0, humanize: 0 },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Intro',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[0],
        // Ligero, groove DnB clásico para dejar entrar la melodía
        layers: [createLayer('bd ~ ~ ~ ~ ~ bd ~ , ~ ~ sd ~ ~ ~ ~ ~ , hh*16', 'Breaks')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Build',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd ~ ~ ~ ~ ~ bd ~ , ~ ~ sd ~ ~ ~ sd ~ , hh*16 , [~ cp]*2', 'Breaks')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Drop',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[0],
        // Auténtico DnB con break real (amencutup) + roller
        layers: [createLayer('[bd ~ ~ ~ ~ ~ bd ~] [~ ~ sd ~ ~ ~ ~ ~] , hh*16 , [~ cp]*4 , amencutup:0 amencutup:4 amencutup:8 amencutup:12', 'Breaks')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Climax',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[0],
        // Energía máxima + toms + más break
        layers: [createLayer('[bd ~ ~ ~ ~ ~ bd ~] [~ ~ sd ~ ~ ~ ~ ~] , hh*16 , [~ cp]*4 , amencutup:0 amencutup:4 amencutup:8 amencutup:12 , [~ ~ ~ ~] [~ ~ ~ ~] [~ ~ ~ ~] [lt ~ mt ~ ht ~ ~ ~]', 'Breaks')],
      },
    ],
  };

  const bassTrack = {
    id: generateTrackId(),
    name: 'Bass',
    color: TRACK_COLORS[1],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.72,
      cutoff: 1100,
      reverb: 0.05,
    },
    groove: { swing: 0, humanize: 0 },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Sub',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("c2 ~ e2 ~ g1 ~ c2 ~ ~").sound("jvbass").gain(0.74)', 'Bass')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Lift',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("<c2 ~ e2 g1 c2> <~ e2 ~ g2 ~>").sound("jvbass").gain(0.72)', 'Bass')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Roll',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("c2 ~ e2 ~ g1 c2 ~ ~ e2 ~").sound("jungbass").gain(0.7)', 'Bass')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Full',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("<c2 ~ e2 g1> <c2 ~ e2 ~ g2 c2>").sound("jvbass").gain(0.76)', 'Bass')],
      },
    ],
  };

  const atmosTrack = {
    id: generateTrackId(),
    name: 'Pad',
    color: TRACK_COLORS[2],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.18,
      cutoff: 2200,
      reverb: 0.65,
      reverbSize: 7,
    },
    groove: { swing: 0, humanize: 0 },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'C',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[c4,e4,g4] [g3,b3,d4]>").sound("juno").gain(0.18)', 'Pad')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'G',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[c4,e4,g4] [g3,b3,d4] [f3,a3,c4] [g3,b3,d4]>").sound("juno").gain(0.16)', 'Pad')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Rise',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[c4,e4,g4] [g3,b3,d4] [c4,e4,g4] [g3,b3,d4]>").sound("juno").gain(0.2)', 'Pad')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Climax',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[c4,e4,g4] [g3,b3,d4] [f3,a3,c4] [g3,b3,d4]>").sound("juno").gain(0.17)', 'Pad')],
      },
    ],
  };

  const stabTrack = {
    id: generateTrackId(),
    name: 'Stabs',
    color: TRACK_COLORS[3],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.28,
      cutoff: 4200,
      reverb: 0.25,
      delay: 0.18,
      delayTime: 0.375,
      delayFeedback: 0.36,
    },
    groove: { swing: 0, humanize: 0 },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Power',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("g5 ~ c6 ~ e6 ~ ~ ~").sound("stab").gain(0.28)', 'Stabs')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Echo',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("g5 c6 ~ <e6 g6> ~").sound("stab").gain(0.25)', 'Stabs')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Hits',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("<g5 c6 e6> ~ <c6 g6 e6> ~").sound("stab").gain(0.24)', 'Stabs')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Final',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("c6 ~ g6 e6 ~ g5 c6 ~ ~").sound("stab").gain(0.27)', 'Stabs')],
      },
    ],
  };

  const marioTrack = {
    id: generateTrackId(),
    name: 'Mario',
    color: TRACK_COLORS[5],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.38,
      cutoff: 5800,
      reverb: 0.18,
      delay: 0.28,
      delayTime: 0.25,
      delayFeedback: 0.4,
    },
    groove: { swing: 0, humanize: 0 },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Theme',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[5],
        // Apertura completa y reconocible del Mario Theme + armonía + brillo
        layers: [
          createLayer('note("e5 e5 e5 c5 e5 g5@2 ~ g4 ~ ~ ~ c5 e5 g5 a5").sound("casio").gain(0.42)', 'Main'),
          createLayer('note("g4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~").sound("casio").gain(0.22)', 'Harmony'),
          createLayer('note("~ ~ ~ ~ ~ ~ g6 ~ ~ c7 ~ e6 ~ g6 ~").sound("arpy").gain(0.14)', 'Sparkle'),
        ],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Climb',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[5],
        // La subida clásica + contramelodía + brillo alto
        layers: [
          createLayer('note("c5 e5 g5 a5 g5 e5 c5 d5 e5 g5 ~ a5 g5 e5 ~").sound("casio").gain(0.38)', 'Main'),
          createLayer('note("g4 ~ ~ c5 ~ ~ e5 ~ ~ g4 ~ ~ ~ ~ ~").sound("casio").gain(0.2)', 'Harmony'),
          createLayer('note("~ ~ ~ g6 ~ ~ c7 ~ e6 ~ ~ g6 ~ ~ ~ ~").sound("arpy").gain(0.13)', 'Sparkle'),
        ],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Run',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[5],
        // Sección con movimiento descendente + energía + capas
        layers: [
          createLayer('note("e5 d5 c5 e5 g5 ~ a5 g5 e5 ~ c5 d5 e5 g5 ~ ~").sound("casio").gain(0.37)', 'Main'),
          createLayer('note("~ ~ g4 ~ ~ c5 ~ ~ e5 ~ ~ g4 ~ ~ ~ ~").sound("casio").gain(0.2)', 'Harmony'),
          createLayer('note("~ ~ g6 ~ ~ c7 ~ e6 ~ g6 ~ ~ ~ ~ ~").sound("arpy").gain(0.12)', 'Sparkle'),
        ],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Star',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[5],
        // Clímax épico: hook completo + armonía + alto brillo + monedas + extra capa
        layers: [
          createLayer('note("e5 e5 e5 c5 e5 g5@2 ~ g4 ~ ~ ~ c5 e5 g5 a5 g5 e5 c5 d5").sound("casio").gain(0.41)', 'Main'),
          createLayer('note("g4 ~ ~ ~ ~ ~ ~ ~ ~ ~ c5 ~ ~ ~ ~").sound("casio").gain(0.22)', 'Harmony'),
          createLayer('note("~ ~ g6 ~ ~ c7 ~ e6 ~ ~ g6 ~ ~ ~ ~").sound("arpy").gain(0.13)', 'Sparkle'),
          createLayer('[~ ~ coins ~ ~ ~ coins ~].gain(0.18)', 'Coins'),
          createLayer('note("~ ~ ~ ~ e6 ~ ~ g6 ~ ~ ~ ~ c7 ~ ~").sound("arpy").gain(0.1)', 'Extra'),
        ],
      },
    ],
  };

  return {
    id: null,
    name: 'Super Mario DnB',
    lengthBars: 16,
    tracks: [drumsTrack, bassTrack, atmosTrack, stabTrack, marioTrack],
    groove: { swing: 0, humanize: 0 },
    loopEnabled: true,
    loopStart: 0,
    loopEnd: 16,
  };
};
