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
  const drumsTrack = {
    id: generateTrackId(),
    name: 'Drums',
    color: TRACK_COLORS[0],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 1.0,
      cutoff: 4500,
      reverb: 0.05,
    },
    groove: { ...defaultGroove },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Intro',
        startBar: 0,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ , hh*4', 'Drums')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Break',
        startBar: 4,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd ~ ~ ~ ~ sd ~ ~ ~ bd ~ ~ ~ sd ~ ~ ~ , hh*8 , ~ ~ ~ ~ ~ ~ ho ~', 'Drums')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Build',
        startBar: 8,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd ~ ~ ~ ~ sd ~ ~ ~ bd ~ bd ~ sd ~ ~ ~ , hh*8 , perc*4', 'Drums')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Drop',
        startBar: 12,
        durationBars: 4,
        color: TRACK_COLORS[0],
        layers: [createLayer('bd ~ ~ ~ ~ sd ~ ~ ~ bd ~ ~ ~ sd ~ ~ ~ , hh*8 , ~ ~ ~ ~ ~ ~ ho ~ , lt ~ mt ~ ht ~ ~ ~', 'Drums')],
      },
    ],
  };

  const bassTrack = {
    id: generateTrackId(),
    name: 'Sub Bass',
    color: TRACK_COLORS[1],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.95,
      cutoff: 600,
      reverb: 0.12,
    },
    groove: { ...defaultGroove },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Reese',
        startBar: 0,
        durationBars: 8,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("<a1 f1 c1 g1>").sound("jvbass").gain(0.95)', 'Sub Bass')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Roll',
        startBar: 8,
        durationBars: 8,
        color: TRACK_COLORS[1],
        layers: [createLayer('note("a1 ~ a1 ~ a1 a1 ~ a1 ~").sound("jvbass").gain(0.9)', 'Sub Bass')],
      },
    ],
  };

  const keysTrack = {
    id: generateTrackId(),
    name: 'Pad',
    color: TRACK_COLORS[2],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.42,
      cutoff: 2600,
      reverb: 0.45,
      reverbSize: 3.5,
    },
    groove: { ...defaultGroove },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Atmos',
        startBar: 0,
        durationBars: 8,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[a3,c4,e4,g4] [f3,a3,c4,e4] [c3,e4,g4,b4] [g3,b3,d4,f4]>").sound("juno").gain(0.42)', 'Pad')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Shimmer',
        startBar: 8,
        durationBars: 8,
        color: TRACK_COLORS[2],
        layers: [createLayer('note("<[c4,e4,g4,b4] [a3,c4,e4,g4] [f3,a3,c4,e4] [g3,b3,d4,f4]>").sound("glass").gain(0.38)', 'Pad')],
      },
    ],
  };

  const leadTrack = {
    id: generateTrackId(),
    name: 'Lead',
    color: TRACK_COLORS[3],
    muted: false,
    solo: false,
    height: 100,
    params: {
      ...defaultLayerParams,
      gain: 0.55,
      cutoff: 3800,
      reverb: 0.2,
      delay: 0.22,
      delayTime: 0.375,
      delayFeedback: 0.35,
    },
    groove: { ...defaultGroove },
    automation: createDefaultTrackAutomation(defaultLayerParams),
    clips: [
      {
        id: generateClipId(),
        patternId: null,
        name: 'Top Line',
        startBar: 0,
        durationBars: 8,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("a4 ~ c5 ~ e5 ~ d5 ~ a4 ~ c5 ~ e5 ~ g5 ~").sound("pluck").gain(0.55)', 'Lead')],
      },
      {
        id: generateClipId(),
        patternId: null,
        name: 'Arp',
        startBar: 8,
        durationBars: 8,
        color: TRACK_COLORS[3],
        layers: [createLayer('note("<[a4,c5] [e5,a5] [g5,e5] [c5,a4] [a4,c5] [e5,a5] [g5,e5] [c5,a4]>").sound("arpy").gain(0.5)', 'Lead')],
      },
    ],
  };

  return {
    id: null,
    name: 'DnB Sketch',
    lengthBars: 16,
    tracks: [drumsTrack, bassTrack, keysTrack, leadTrack],
    groove: { swing: 0, humanize: 5 },
    loopEnabled: true,
    loopStart: 0,
    loopEnd: 16,
  };
};
