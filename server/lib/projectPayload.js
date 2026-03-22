const PROJECT_VERSION = '2.1';
const DEFAULT_GROOVE = {
  swing: 0,
  humanize: 0,
};

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeGroove(groove) {
  if (!isPlainObject(groove)) {
    return { ...DEFAULT_GROOVE };
  }

  return {
    swing: isFiniteNumber(groove.swing) ? clamp(groove.swing, 0, 100) : DEFAULT_GROOVE.swing,
    humanize: isFiniteNumber(groove.humanize) ? clamp(groove.humanize, 0, 100) : DEFAULT_GROOVE.humanize,
  };
}

function resolveTracks(project) {
  if (Array.isArray(project?.arrangement?.tracks)) return project.arrangement.tracks;
  if (Array.isArray(project?.tracks)) return project.tracks;
  return [];
}

export function validateProjectPayload(payload, options = {}) {
  const { partial = false } = options;
  const errors = [];

  if (!isPlainObject(payload)) {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  if (!partial && payload.name === undefined) {
    errors.push('name is required');
  }
  if (payload.name !== undefined && (typeof payload.name !== 'string' || payload.name.length > 200)) {
    errors.push('name must be a string (max 200 chars)');
  }

  if (payload.version !== undefined && (typeof payload.version !== 'string' || payload.version.length > 20)) {
    errors.push('version must be a string (max 20 chars)');
  }

  if (!partial && payload.bpm === undefined) {
    errors.push('bpm is required');
  }
  if (payload.bpm !== undefined && (!isFiniteNumber(payload.bpm) || payload.bpm < 20 || payload.bpm > 400)) {
    errors.push('bpm must be a number between 20 and 400');
  }

  if (payload.arrangement !== undefined && !isPlainObject(payload.arrangement)) {
    errors.push('arrangement must be an object');
  }

  if (payload.tracks !== undefined && !Array.isArray(payload.tracks)) {
    errors.push('tracks must be an array');
  }

  if (payload.arrangement?.tracks !== undefined && !Array.isArray(payload.arrangement.tracks)) {
    errors.push('arrangement.tracks must be an array');
  }

  if (payload.arrangement?.lengthBars !== undefined && (!isFiniteNumber(payload.arrangement.lengthBars) || payload.arrangement.lengthBars < 1)) {
    errors.push('arrangement.lengthBars must be a positive number');
  }

  if (payload.arrangement?.loopEnabled !== undefined && typeof payload.arrangement.loopEnabled !== 'boolean') {
    errors.push('arrangement.loopEnabled must be a boolean');
  }

  if (payload.arrangement?.loopStart !== undefined && (!isFiniteNumber(payload.arrangement.loopStart) || payload.arrangement.loopStart < 0)) {
    errors.push('arrangement.loopStart must be a non-negative number');
  }

  if (payload.arrangement?.loopEnd !== undefined && (!isFiniteNumber(payload.arrangement.loopEnd) || payload.arrangement.loopEnd < 0)) {
    errors.push('arrangement.loopEnd must be a non-negative number');
  }

  if (payload.arrangement?.groove !== undefined && !isPlainObject(payload.arrangement.groove)) {
    errors.push('arrangement.groove must be an object');
  }

  if (payload.arrangement?.groove?.swing !== undefined && (!isFiniteNumber(payload.arrangement.groove.swing) || payload.arrangement.groove.swing < 0 || payload.arrangement.groove.swing > 100)) {
    errors.push('arrangement.groove.swing must be a number between 0 and 100');
  }

  if (payload.arrangement?.groove?.humanize !== undefined && (!isFiniteNumber(payload.arrangement.groove.humanize) || payload.arrangement.groove.humanize < 0 || payload.arrangement.groove.humanize > 100)) {
    errors.push('arrangement.groove.humanize must be a number between 0 and 100');
  }

  return { valid: errors.length === 0, errors };
}

export function toCanonicalProject(payload, existing = {}) {
  const arrangement = isPlainObject(payload.arrangement) ? payload.arrangement : {};
  const existingArrangement = isPlainObject(existing.arrangement) ? existing.arrangement : {};
  const tracks = resolveTracks(payload);
  const existingTracks = resolveTracks(existing);
  const loopStart = arrangement.loopStart ?? payload.loopStart ?? existingArrangement.loopStart ?? existing.loopStart ?? 0;
  const loopEnd = arrangement.loopEnd ?? payload.loopEnd ?? existingArrangement.loopEnd ?? existing.loopEnd ?? 8;

  return {
    id: existing.id ?? payload.id ?? null,
    version: payload.version ?? existing.version ?? PROJECT_VERSION,
    name: payload.name ?? existing.name ?? 'Untitled Project',
    bpm: payload.bpm ?? existing.bpm ?? 120,
    arrangement: {
      lengthBars: arrangement.lengthBars ?? payload.lengthBars ?? existingArrangement.lengthBars ?? existing.lengthBars ?? 32,
      loopEnabled: arrangement.loopEnabled ?? payload.loopEnabled ?? existingArrangement.loopEnabled ?? existing.loopEnabled ?? false,
      loopStart: Math.max(0, loopStart),
      loopEnd: Math.max(Math.max(0, loopStart) + 1, loopEnd),
      groove: normalizeGroove(arrangement.groove ?? payload.groove ?? existingArrangement.groove ?? existing.groove),
      tracks: tracks.length > 0 ? tracks : existingTracks,
    },
    createdAt: existing.createdAt ?? payload.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
}

export function hydrateStoredProject(project) {
  return toCanonicalProject(project, project);
}
