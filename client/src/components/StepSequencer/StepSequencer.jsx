import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Square, Copy, Trash2, Plus, Minus, RotateCcw, Shuffle, Volume2, VolumeX, ChevronLeft, ChevronRight, MoreHorizontal, GripVertical } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { initAudio, startPreview, stopPreview } from '../../strudel/engine';
import { generateId, generateTrackId, generateClipId } from '../../utils/id';
import { SAMPLE_NAMES, SAMPLE_VARIANT_COUNTS } from '../../data/samples';

// Euclidean rhythm generator (Bresenham/Bjorklund distribution)
function euclidean(hits, totalSteps) {
  const pattern = new Array(totalSteps).fill(0);
  for (let i = 0; i < hits; i++) {
    pattern[Math.floor(i * totalSteps / hits)] = 3; // hard velocity
  }
  return pattern;
}

// Convert hex color to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SOUND_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];
const colorFromId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return SOUND_COLORS[Math.abs(hash) % SOUND_COLORS.length];
};
const supportsVariantSuffix = (sampleId) => !/\d$/.test(sampleId);
// Mini notation used by StepSequencer doesn't handle leading numeric sample names well.
const STEP_SAMPLE_NAMES = SAMPLE_NAMES.filter((id) => !/^\d/.test(id));
const DEFAULT_SOUNDS = STEP_SAMPLE_NAMES.map((id) => ({
  id,
  name: id,
  color: colorFromId(id),
  category: 'all',
}));

// Pattern presets (1 = on, 0 = off)
const PRESETS = [
  // Basic genres
  {
    name: 'Rock',
    sounds: ['bd', 'sd', 'hh', 'cr'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      cr: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    }
  },
  {
    name: 'House',
    sounds: ['bd', 'cp', 'hh', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Techno',
    sounds: ['bd', 'hh', 'ho', 'cp'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    }
  },
  // Complex patterns
  {
    name: 'Funky House',
    sounds: ['bd', 'sd', 'hh', 'ho', 'cp'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      cp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    }
  },
  {
    name: 'Trap Hard',
    sounds: ['bd', 'sd', 'hh', 'ho', 'cp'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    }
  },
  {
    name: 'Breakbeat',
    sounds: ['bd', 'sd', 'hh', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
      hh: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Drum & Bass',
    sounds: ['bd', 'sd', 'hh', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    }
  },
  {
    name: 'Reggaeton',
    sounds: ['bd', 'sd', 'hh', 'ho'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      sd: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Lo-Fi Chill',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      perc: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    }
  },
  // World & Latin
  {
    name: 'Bossa Nova',
    sounds: ['bd', 'sd', 'hh', 'perc'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      perc: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    }
  },
  {
    name: 'Salsa',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      perc: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    }
  },
  {
    name: 'Afrobeat',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      perc: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    }
  },
  {
    name: 'Samba',
    sounds: ['bd', 'sd', 'hh', 'perc', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      perc: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  // Electronic subgenres
  {
    name: 'Acid Techno',
    sounds: ['bd', 'hh', 'ho', 'cp', 'perc'],
    patterns: {
      bd: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      perc: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    }
  },
  {
    name: 'Deep House',
    sounds: ['bd', 'cp', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      perc: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    }
  },
  {
    name: 'Trance',
    sounds: ['bd', 'sd', 'hh', 'ho', 'cr'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      cr: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    }
  },
  {
    name: 'Dubstep',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      perc: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    }
  },
  {
    name: 'Garage UK',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      hh: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      perc: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    }
  },
  // Hip-hop variants
  {
    name: 'Boom Bap',
    sounds: ['bd', 'sd', 'hh', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Drill',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      sd: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      perc: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    }
  },
  // Polyrhythmic
  {
    name: 'Polyrhythm 3/4',
    sounds: ['bd', 'sd', 'hh', 'perc', 'ho'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      perc: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Tribal',
    sounds: ['bd', 'perc', 'hh', 'ho', 'tabla'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      perc: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      tabla: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    }
  },
  // Industrial & experimental
  {
    name: 'Industrial',
    sounds: ['bd', 'sd', 'metal', 'perc', 'hh'],
    patterns: {
      bd: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
      metal: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      perc: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    }
  },
  {
    name: 'Glitch Hop',
    sounds: ['bd', 'sd', 'hh', 'glitch', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
      hh: [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
      glitch: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
      perc: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    }
  },
  // Arcade / Videogames
  {
    name: 'Super Mario',
    sounds: ['bd', 'sd', 'hh', 'blip'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      blip: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    }
  },
  {
    name: 'Pac-Man Chase',
    sounds: ['bd', 'hh', 'blip', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      blip: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1],
      perc: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    }
  },
  {
    name: 'Space Invaders',
    sounds: ['bd', 'perc', 'blip', 'metal'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      perc: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      blip: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      metal: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Tetris Drop',
    sounds: ['bd', 'sd', 'hh', 'blip', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      blip: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      perc: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Mega Man Boss',
    sounds: ['bd', 'sd', 'hh', 'blip', 'perc'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      blip: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      perc: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    }
  },
  {
    name: 'Zelda Dungeon',
    sounds: ['bd', 'perc', 'metal', 'hh'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      perc: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
      metal: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      hh: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    }
  },
  {
    name: 'Castlevania',
    sounds: ['bd', 'sd', 'hh', 'ho', 'perc'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ho: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      perc: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    }
  },
  {
    name: 'Sonic Speed',
    sounds: ['bd', 'sd', 'hh', 'blip', 'cp'],
    patterns: {
      bd: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      blip: [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    }
  },
  {
    name: 'Street Fighter',
    sounds: ['bd', 'sd', 'hh', 'cp', 'perc'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      cp: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      perc: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    }
  },
  {
    name: 'Final Fantasy',
    sounds: ['bd', 'sd', 'hh', 'perc', 'rd'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      perc: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      rd: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    }
  },
  // Jazz & Funk
  {
    name: 'Jazz Swing',
    sounds: ['bd', 'sd', 'hh', 'ho', 'rd'],
    patterns: {
      bd: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      ho: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      rd: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
    }
  },
  {
    name: 'Funk',
    sounds: ['bd', 'sd', 'hh', 'ho', 'cp'],
    patterns: {
      bd: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      cp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    }
  },
  {
    name: 'Disco',
    sounds: ['bd', 'sd', 'hh', 'ho', 'cp'],
    patterns: {
      bd: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      sd: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hh: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ho: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      cp: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    }
  },
];

const STEP_OPTIONS = [8, 16, 32];
const VELOCITY_GAIN = [0, 0.4, 0.7, 1.0];
const INITIAL_SOUND_IDS = ['bd', 'sd', 'hh', 'cp'];

// Track colors
const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

export default function StepSequencer({ isOpen, onClose }) {
  const { arrangement, setEditingClip, bpm, setPlaying } = useStore();
  const { initializeAudio, audioReady } = useStrudel();

  // Core state
  const [steps, setSteps] = useState(16);
  const [sounds, setSounds] = useState(
    INITIAL_SOUND_IDS
      .map((id) => DEFAULT_SOUNDS.find((s) => s.id === id))
      .filter(Boolean)
  );
  const [grid, setGrid] = useState({}); // {soundId: number[]} where 0=off, 1-3=velocity
  const [variations, setVariations] = useState({}); // {soundId: number} sample variation
  const [swing, setSwing] = useState(0); // 0-100%
  const [currentStep, setCurrentStep] = useState(0);
  const [previewCode, setPreviewCode] = useState('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const stepIntervalRef = useRef(null);

  // Pro state
  const [rowMutes, setRowMutes] = useState({}); // {soundId: bool}
  const [rowSolos, setRowSolos] = useState({}); // {soundId: bool}
  const [rowVolumes, setRowVolumes] = useState({}); // {soundId: number 0-1}
  const [accents, setAccents] = useState([]); // boolean[] per step
  const [clipboard, setClipboard] = useState(null); // number[] or null
  const [openRowMenu, setOpenRowMenu] = useState(null); // soundId or null
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [euclideanRow, setEuclideanRow] = useState(null); // soundId or null
  const [euclideanHits, setEuclideanHits] = useState(4);
  const [draggedSoundIndex, setDraggedSoundIndex] = useState(null);
  const [randomDensity, setRandomDensity] = useState(30);

  const stopPreviewPlayback = useCallback((resetPreviewState = true) => {
    stopPreview();
    if (resetPreviewState) {
      setIsPreviewPlaying(false);
    }
    // Preview uses the same scheduler, so the main transport must be marked as stopped.
    setPlaying(false);
  }, [setPlaying]);

  // Initialize grid and row state when sounds or steps change
  useEffect(() => {
    const newGrid = {};
    const newVariations = {};
    sounds.forEach(sound => {
      if (!grid[sound.id]) {
        newGrid[sound.id] = new Array(steps).fill(0);
      } else {
        const existing = grid[sound.id];
        newGrid[sound.id] = new Array(steps).fill(0).map((_, i) => existing[i] || 0);
      }
      newVariations[sound.id] = variations[sound.id] || 0;
    });
    setGrid(newGrid);
    setVariations(newVariations);

    // Resize accents array
    setAccents(prev => {
      const newAccents = new Array(steps).fill(false);
      prev.forEach((v, i) => { if (i < steps) newAccents[i] = v; });
      return newAccents;
    });

    // Initialize row state for new sounds
    setRowMutes(prev => {
      const next = {};
      sounds.forEach(s => { next[s.id] = prev[s.id] || false; });
      return next;
    });
    setRowSolos(prev => {
      const next = {};
      sounds.forEach(s => { next[s.id] = prev[s.id] || false; });
      return next;
    });
    setRowVolumes(prev => {
      const next = {};
      sounds.forEach(s => { next[s.id] = prev[s.id] ?? 0.8; });
      return next;
    });
  }, [sounds, steps]);

  // Generate mini notation from grid with velocity/mute/solo/volume/accent support
  const generateCode = useCallback(() => {
    const safeSounds = Array.isArray(sounds) ? sounds : [];
    const hasSolo = Object.values(rowSolos).some(v => v);
    const activeSounds = safeSounds.filter(s => {
      if (rowMutes[s.id]) return false;
      if (hasSolo && !rowSolos[s.id]) return false;
      return grid[s.id]?.some(v => v > 0);
    });

    if (activeSounds.length === 0) return '~';

    const patterns = activeSounds.map(sound => {
      const variation = variations[sound.id] || 0;
      const canUseVariation = supportsVariantSuffix(sound.id);
      const soundName = variation > 0 && canUseVariation ? `${sound.id}:${variation}` : sound.id;
      const rowVol = rowVolumes[sound.id] ?? 0.8;
      const soundGrid = Array.isArray(grid[sound.id]) ? grid[sound.id] : [];

      const stepPattern = soundGrid.map(vel => vel > 0 ? soundName : '~').join(' ');

      // Check if we need per-step gain pattern
      const activeSteps = soundGrid.filter(v => v > 0);
      if (activeSteps.length === 0) return null;

      const allSameVel = activeSteps.every(v => v === activeSteps[0]);
      const noAccents = !accents.some((a, i) => a && (soundGrid[i] || 0) > 0);

      if (allSameVel && noAccents) {
        // Uniform velocity - apply single gain
        const baseGain = VELOCITY_GAIN[activeSteps[0]] * rowVol;
        const gainStr = Math.abs(baseGain - 1) > 0.01 ? `.gain(${baseGain.toFixed(2)})` : '';
        return `[${stepPattern}]${gainStr}`;
      }

      // Mixed velocities or accents - generate per-step gain pattern
      const gainPattern = soundGrid.map((vel, i) => {
        if (vel === 0) return '~';
        let g = VELOCITY_GAIN[vel] * rowVol;
        if (accents[i]) g = Math.min(1, g + 0.3);
        return g.toFixed(2);
      }).join(' ');

      return `[${stepPattern}].gain([${gainPattern}])`;
    }).filter(Boolean);

    if (patterns.length === 0) return '~';
    return patterns.length === 1 ? patterns[0] : patterns.join(' , ');
  }, [grid, sounds, variations, rowMutes, rowSolos, rowVolumes, accents]);

  // Update preview when grid changes
  useEffect(() => {
    setPreviewCode(generateCode());
  }, [generateCode]);

  // Animate current step when playing preview
  useEffect(() => {
    if (!isPreviewPlaying) {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setCurrentStep(0);
      return;
    }

    const cycleDuration = (60 / bpm) * 4 * 1000;
    const stepDuration = cycleDuration / steps;

    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps);
    }, stepDuration);

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    };
  }, [isPreviewPlaying, steps, bpm]);

  // --- Step & accent toggling ---

  // Cycle velocity: off(0) -> soft(1) -> medium(2) -> hard(3) -> off(0)
  const toggleStep = (soundId, stepIndex) => {
    setGrid(prev => ({
      ...prev,
      [soundId]: prev[soundId].map((v, i) => i === stepIndex ? (v + 1) % 4 : v)
    }));
  };

  const toggleAccent = (stepIndex) => {
    setAccents(prev => prev.map((v, i) => i === stepIndex ? !v : v));
  };

  // --- Row operations ---

  const shiftLeft = (soundId) => {
    setGrid(prev => {
      const row = prev[soundId];
      return { ...prev, [soundId]: [...row.slice(1), row[0]] };
    });
  };

  const shiftRight = (soundId) => {
    setGrid(prev => {
      const row = prev[soundId];
      return { ...prev, [soundId]: [row[row.length - 1], ...row.slice(0, -1)] };
    });
  };

  const reverseRow = (soundId) => {
    setGrid(prev => ({
      ...prev, [soundId]: [...prev[soundId]].reverse()
    }));
  };

  const randomFillRow = (soundId, density = 0.3) => {
    setGrid(prev => ({
      ...prev,
      [soundId]: prev[soundId].map(() =>
        Math.random() < density ? Math.ceil(Math.random() * 3) : 0
      )
    }));
  };

  const clearRow = (soundId) => {
    setGrid(prev => ({
      ...prev, [soundId]: new Array(steps).fill(0)
    }));
  };

  const copyRow = (soundId) => {
    setClipboard([...(grid[soundId] || [])]);
  };

  const pasteRow = (soundId) => {
    if (!clipboard) return;
    setGrid(prev => ({
      ...prev,
      [soundId]: new Array(steps).fill(0).map((_, i) => clipboard[i] || 0)
    }));
  };

  const applyEuclidean = (soundId) => {
    const pattern = euclidean(euclideanHits, steps);
    setGrid(prev => ({ ...prev, [soundId]: pattern }));
    setEuclideanRow(null);
  };

  // --- Global operations ---

  const randomFillAll = () => {
    const density = randomDensity / 100;
    setGrid(prev => {
      const newGrid = {};
      Object.keys(prev).forEach(soundId => {
        newGrid[soundId] = prev[soundId].map(() =>
          Math.random() < density ? Math.ceil(Math.random() * 3) : 0
        );
      });
      return newGrid;
    });
  };

  const doublePattern = () => {
    setGrid(prev => {
      const newGrid = {};
      Object.keys(prev).forEach(soundId => {
        const row = prev[soundId];
        const halfLength = Math.floor(row.length / 2);
        newGrid[soundId] = row.map((_, i) => row[i % halfLength]);
      });
      return newGrid;
    });
    setAccents(prev => {
      const halfLength = Math.floor(prev.length / 2);
      return prev.map((_, i) => prev[i % halfLength]);
    });
  };

  // Clear entire grid
  const clearAll = () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    setOpenRowMenu(null);
    setEuclideanRow(null);
    const newGrid = {};
    sounds.forEach(sound => {
      newGrid[sound.id] = new Array(steps).fill(0);
    });
    setGrid(newGrid);
    setAccents(new Array(steps).fill(false));
    setRowMutes({});
    setRowSolos({});
  };

  // Load preset pattern
  const loadPreset = (preset) => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    setOpenRowMenu(null);
    setEuclideanRow(null);

    const presetSounds = preset.sounds.map(id => DEFAULT_SOUNDS.find(s => s.id === id)).filter(Boolean);
    setSounds(presetSounds);

    const newGrid = {};
    presetSounds.forEach(sound => {
      const presetPattern = preset.patterns[sound.id] || [];
      newGrid[sound.id] = new Array(steps).fill(0).map((_, i) => {
        const v = presetPattern[i % presetPattern.length] || 0;
        return v ? 3 : 0; // Convert on/off to hard velocity
      });
    });
    setGrid(newGrid);
    setAccents(new Array(steps).fill(false));
    setRowMutes({});
    setRowSolos({});
    setRowVolumes({});
  };

  // --- Sound management ---

  const addSound = () => {
    const availableSounds = DEFAULT_SOUNDS.filter(s => !sounds.find(existing => existing.id === s.id));
    if (availableSounds.length > 0) {
      setSounds([...sounds, availableSounds[0]]);
    }
  };

  const removeSound = (soundId) => {
    if (sounds.length > 1) {
      if (openRowMenu === soundId) setOpenRowMenu(null);
      if (euclideanRow === soundId) setEuclideanRow(null);
      setSounds(sounds.filter(s => s.id !== soundId));
      setGrid(prev => {
        const newGrid = { ...prev };
        delete newGrid[soundId];
        return newGrid;
      });
      setRowMutes(prev => { const n = { ...prev }; delete n[soundId]; return n; });
      setRowSolos(prev => { const n = { ...prev }; delete n[soundId]; return n; });
      setRowVolumes(prev => { const n = { ...prev }; delete n[soundId]; return n; });
    }
  };

  const changeSound = (oldId, newId) => {
    const newSound = DEFAULT_SOUNDS.find(s => s.id === newId);
    if (newSound) {
      setSounds(sounds.map(s => s.id === oldId ? newSound : s));
      setGrid(prev => {
        const newGrid = { ...prev };
        newGrid[newId] = prev[oldId] || new Array(steps).fill(0);
        delete newGrid[oldId];
        return newGrid;
      });
      setVariations(prev => {
        const newVars = { ...prev };
        newVars[newId] = 0;
        delete newVars[oldId];
        return newVars;
      });
      setRowMutes(prev => { const n = { ...prev }; n[newId] = prev[oldId] || false; delete n[oldId]; return n; });
      setRowSolos(prev => { const n = { ...prev }; n[newId] = prev[oldId] || false; delete n[oldId]; return n; });
      setRowVolumes(prev => { const n = { ...prev }; n[newId] = prev[oldId] ?? 0.8; delete n[oldId]; return n; });
    }
  };

  const changeVariation = (soundId, variation) => {
    setVariations(prev => ({ ...prev, [soundId]: variation }));
  };

  // --- Drag reorder ---

  const handleDragStart = (e, index) => {
    setDraggedSoundIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedSoundIndex === null || draggedSoundIndex === targetIndex) return;
    setSounds(prev => {
      const newSounds = [...prev];
      const [removed] = newSounds.splice(draggedSoundIndex, 1);
      newSounds.splice(targetIndex, 0, removed);
      return newSounds;
    });
    setDraggedSoundIndex(null);
  };

  // --- Row menu ---

  const handleOpenRowMenu = (soundId, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 220)
    });
    setOpenRowMenu(openRowMenu === soundId ? null : soundId);
    setEuclideanRow(null);
  };

  const menuAction = (action) => {
    action();
    setOpenRowMenu(null);
  };

  // --- Track creation ---

  const applyAsTrack = () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    const code = generateCode();
    if (!code || code === '~') {
      onClose();
      return;
    }

    const trackCount = arrangement.tracks.length;
    const color = TRACK_COLORS[trackCount % TRACK_COLORS.length];
    const trackId = generateTrackId();
    const clipId = generateClipId();

    const newTrack = {
      id: trackId,
      name: 'Drums',
      color,
      muted: false,
      solo: false,
      height: 100,
      params: {
        gain: 1, cutoff: 8000, resonance: 0, speed: 1, pan: 0,
        reverb: 0, reverbSize: 2, delay: 0, delayTime: 0.25, delayFeedback: 0.3,
        distortion: 0, hpf: 0, phaser: 0, phaserDepth: 0.5,
      },
      groove: { swing: 0, humanize: 0 },
      automation: {
        gain: { enabled: false, min: 0, max: 1, points: [{ bar: 0, value: 1 }] },
        pan: { enabled: false, min: -1, max: 1, points: [{ bar: 0, value: 0 }] },
        cutoff: { enabled: false, min: 200, max: 12000, points: [{ bar: 0, value: 8000 }] },
      },
      clips: [{
        id: clipId,
        patternId: null,
        name: 'Step Pattern',
        startBar: 0,
        durationBars: 4,
        color,
        layers: [{
          id: generateId(),
          name: 'Drums',
          code,
          muted: false,
          solo: false,
          params: {},
        }],
      }],
    };

    useStore.setState((state) => ({
      arrangement: {
        ...state.arrangement,
        tracks: [...state.arrangement.tracks, newTrack],
      },
    }));

    setEditingClip(trackId, clipId);
    onClose();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(previewCode);
  };

  // --- Preview playback ---

  const togglePreview = async () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    } else {
      // Preview takes over the scheduler, so keep transport state in sync.
      setPlaying(false);
      if (!audioReady) {
        await initializeAudio();
      }
      await initAudio();

      const code = generateCode();
      if (code && code !== '~') {
        const result = await startPreview(code, bpm, swing);
        if (result.success) {
          setIsPreviewPlaying(true);
          setCurrentStep(0);
        }
      }
    }
  };

  // Update preview when pattern or swing changes during playback
  useEffect(() => {
    if (isPreviewPlaying && previewCode && previewCode !== '~') {
      const updatePreview = async () => {
        stopPreviewPlayback(false);
        const result = await startPreview(previewCode, bpm, swing);
        if (!result.success) {
          setIsPreviewPlaying(false);
        }
      };
      updatePreview();
    }
  }, [previewCode, swing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      stopPreviewPlayback(false);
    };
  }, [stopPreviewPlayback]);

  // Stop preview when modal closes
  const handleClose = () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    onClose();
  };

  const randomizeSounds = () => {
    if (DEFAULT_SOUNDS.length < sounds.length) return;

    const shuffled = [...DEFAULT_SOUNDS].sort(() => Math.random() - 0.5);
    const nextSounds = shuffled.slice(0, sounds.length);
    const oldSounds = sounds;

    const nextGrid = {};
    const nextVariations = {};
    const nextRowMutes = {};
    const nextRowSolos = {};
    const nextRowVolumes = {};

    nextSounds.forEach((newSound, index) => {
      const oldSound = oldSounds[index];
      nextGrid[newSound.id] = oldSound ? (grid[oldSound.id] || new Array(steps).fill(0)) : new Array(steps).fill(0);
      const maxVariants = Math.max(1, SAMPLE_VARIANT_COUNTS[newSound.id] || 1);
      if (supportsVariantSuffix(newSound.id) && maxVariants > 1) {
        // Keep randomize under one button: pick :1 or :2 when those variations exist.
        const available = [1, 2].filter((v) => v <= (maxVariants - 1));
        nextVariations[newSound.id] = available.length
          ? available[Math.floor(Math.random() * available.length)]
          : 0;
      } else {
        nextVariations[newSound.id] = 0;
      }
      nextRowMutes[newSound.id] = oldSound ? !!rowMutes[oldSound.id] : false;
      nextRowSolos[newSound.id] = oldSound ? !!rowSolos[oldSound.id] : false;
      nextRowVolumes[newSound.id] = oldSound ? (rowVolumes[oldSound.id] ?? 0.8) : 0.8;
    });

    setSounds(nextSounds);
    setGrid(nextGrid);
    setVariations(nextVariations);
    setRowMutes(nextRowMutes);
    setRowSolos(nextRowSolos);
    setRowVolumes(nextRowVolumes);
  };

  // Generate a musically-related variation from current pattern
  const generateVariation = () => {
    const density = randomDensity / 100;
    setGrid(prev => {
      const next = {};
      Object.keys(prev).forEach(soundId => {
        const row = prev[soundId] || [];
        const shift = Math.random() < 0.5 ? 1 : -1;
        const shifted = row.map((_, i) => row[(i - shift + row.length) % row.length] || 0);
        next[soundId] = shifted.map((v) => {
          // Keep some existing hits, remove some, add a few new ones.
          if (v > 0 && Math.random() < 0.2) return 0;
          if (v === 0 && Math.random() < density * 0.12) return Math.ceil(Math.random() * 3);
          if (v > 0 && Math.random() < 0.2) return Math.min(3, Math.max(1, v + (Math.random() < 0.5 ? -1 : 1)));
          return v;
        });
      });
      return next;
    });
  };

  if (!isOpen) return null;

  const hasSolos = Object.values(rowSolos).some(v => v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-studio-800 to-studio-900 rounded-2xl shadow-panel border border-white/[0.06] animate-scale-in w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 pro-header bg-gradient-modal">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Step Sequencer</h2>
            <button
              onClick={togglePreview}
              className={`btn-pro px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                isPreviewPlaying
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-accent-primary text-black hover:bg-emerald-400'
              }`}
            >
              {isPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
              {isPreviewPlaying ? 'Stop' : 'Preview'}
            </button>
            {isPreviewPlaying && (
              <span className="text-xs text-accent-primary animate-pulse">{bpm} BPM</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="btn-pro px-2 py-1 text-xs bg-red-600/50 text-red-200 rounded hover:bg-red-600 flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
            <button onClick={handleClose} className="btn-pro p-1.5 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-4 px-4 py-2 bg-studio-750 border-b border-white/[0.04] flex-wrap">
          {/* Steps selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Steps:</span>
            {STEP_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSteps(n)}
                className={`px-2 py-1 text-xs rounded ${
                  steps === n ? 'bg-blue-600 text-white' : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Swing control */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <Shuffle size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Swing:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-20 h-1 accent-accent-primary"
            />
            <span className="text-xs text-accent-primary w-8">{swing}%</span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <RotateCcw size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Preset:</span>
            <select
              onChange={(e) => {
                const preset = PRESETS.find(p => p.name === e.target.value);
                if (preset) loadPreset(preset);
              }}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
              defaultValue=""
            >
              <option value="" disabled>Choose...</option>
              {PRESETS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Random Fill All */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <span className="text-xs text-gray-400">Density:</span>
            <input
              type="range"
              min={20}
              max={60}
              value={randomDensity}
              onChange={(e) => setRandomDensity(Number(e.target.value))}
              className="w-14 h-1 accent-purple-400"
            />
            <span className="text-xs text-purple-400 w-6">{randomDensity}%</span>
            <button
              onClick={randomFillAll}
              className="px-2 py-1 text-xs bg-purple-600/50 text-purple-200 rounded hover:bg-purple-600 flex items-center gap-1"
            >
              <Shuffle size={12} />
              Random All
            </button>
            <button
              onClick={randomizeSounds}
              className="px-2 py-1 text-xs bg-indigo-600/50 text-indigo-100 rounded hover:bg-indigo-600 flex items-center gap-1"
              title="Randomly replace current row sounds"
            >
              <Shuffle size={12} />
              Random Sounds
            </button>
          </div>

          {/* Double */}
          <button
            onClick={doublePattern}
            className="px-2 py-1 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 border-l border-studio-600 ml-0"
            title="Copy first half pattern to second half"
          >
            Double
          </button>
          <button
            onClick={generateVariation}
            className="px-2 py-1 text-xs bg-indigo-600/50 text-indigo-100 rounded hover:bg-indigo-600"
            title="Generate a variation from the current groove"
          >
            Variation
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-max">
            {/* Step numbers header */}
            <div className="flex mb-1">
              <div className="w-64 flex-shrink-0" />
              <div className="flex gap-0.5">
                {Array.from({ length: steps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-5 flex items-center justify-center text-xs ${
                      i % 4 === 0 ? 'text-accent-primary/60' : 'text-gray-600'
                    } ${currentStep === i && isPreviewPlaying ? 'text-accent-primary font-bold' : ''} ${
                      i > 0 && i % 4 === 0 ? 'ml-1.5' : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Accent row */}
            <div className="flex items-center mb-2">
              <div className="w-64 flex-shrink-0 flex items-center gap-1 pr-1">
                <span className="text-xs text-yellow-400 font-bold px-2 ml-auto">&#9733; ACCENT</span>
              </div>
              <div className="flex gap-0.5">
                {accents.map((active, i) => (
                  <button
                    key={i}
                    onClick={() => toggleAccent(i)}
                    className={`w-7 h-5 rounded-sm text-xs font-bold transition-all ${
                      i > 0 && i % 4 === 0 ? 'ml-1.5' : ''
                    } ${
                      active
                        ? 'bg-yellow-500 text-yellow-900 shadow-md shadow-yellow-500/30'
                        : 'bg-studio-700 hover:bg-studio-600 text-transparent'
                    } ${currentStep === i && isPreviewPlaying ? 'ring-1 ring-accent-primary/60' : ''}`}
                  >
                    {active ? '\u2605' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-studio-600/50 mb-2" />

            {/* Sound rows */}
            {sounds.map((sound, soundIndex) => {
              const isMuted = rowMutes[sound.id];
              const isSoloed = rowSolos[sound.id];
              const isEffectivelyMuted = isMuted || (hasSolos && !isSoloed);

              return (
                <div key={sound.id}>
                  <div
                    className={`flex items-center mb-1 group transition-opacity ${
                      isEffectivelyMuted ? 'opacity-30' : ''
                    } ${isSoloed ? 'bg-yellow-900/10 rounded' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, soundIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, soundIndex)}
                    onDragEnd={() => setDraggedSoundIndex(null)}
                  >
                    {/* Left controls panel */}
                    <div className="w-64 flex-shrink-0 flex items-center gap-0.5 pr-1">
                      {/* Grip handle */}
                      <div className="cursor-grab active:cursor-grabbing p-0.5 text-gray-600 hover:text-gray-400 flex-shrink-0">
                        <GripVertical size={12} />
                      </div>

                      {/* Mute button */}
                      <button
                        onClick={() => setRowMutes(prev => ({ ...prev, [sound.id]: !prev[sound.id] }))}
                        className={`w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-colors ${
                          isMuted
                            ? 'bg-red-900/60 text-red-400'
                            : 'bg-studio-700 text-gray-500 hover:text-gray-300'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                      </button>

                      {/* Solo button */}
                      <button
                        onClick={() => setRowSolos(prev => ({ ...prev, [sound.id]: !prev[sound.id] }))}
                        className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold flex-shrink-0 transition-colors ${
                          isSoloed
                            ? 'bg-yellow-500 text-black'
                            : 'bg-studio-700 text-gray-500 hover:text-gray-300'
                        }`}
                        title={isSoloed ? 'Unsolo' : 'Solo'}
                      >
                        S
                      </button>

                      {/* Volume slider */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((rowVolumes[sound.id] ?? 0.8) * 100)}
                        onChange={(e) => setRowVolumes(prev => ({ ...prev, [sound.id]: Number(e.target.value) / 100 }))}
                        className="w-10 h-1 accent-gray-400 ml-0.5 flex-shrink-0"
                        title={`Volume: ${Math.round((rowVolumes[sound.id] ?? 0.8) * 100)}%`}
                      />

                      {/* Color indicator */}
                      <div
                        className="w-1 h-6 rounded-sm flex-shrink-0 ml-1"
                        style={{ backgroundColor: sound.color }}
                      />

                      {/* Sound selector */}
                      <select
                        value={sound.id}
                        onChange={(e) => changeSound(sound.id, e.target.value)}
                        className="flex-1 min-w-0 px-1 py-1 text-xs bg-studio-700 border border-studio-600 rounded text-white truncate ml-1"
                      >
                        <optgroup label="All Samples">
                          {DEFAULT_SOUNDS.map(s => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={sounds.some(x => x.id === s.id && x.id !== sound.id)}
                            >
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      {/* Sample variation selector */}
                      <select
                        value={variations[sound.id] || 0}
                        onChange={(e) => changeVariation(sound.id, Number(e.target.value))}
                        className="w-9 px-0.5 py-1 text-xs bg-studio-700 border border-studio-600 rounded text-gray-400 ml-0.5 flex-shrink-0"
                        title={supportsVariantSuffix(sound.id) ? 'Sample variation' : 'This sample name does not safely support :variant syntax'}
                        disabled={!supportsVariantSuffix(sound.id)}
                      >
                        {Array.from({
                          length: supportsVariantSuffix(sound.id)
                            ? Math.max(1, SAMPLE_VARIANT_COUNTS[sound.id] || 1)
                            : 1,
                        }, (_, i) => (
                          <option key={i} value={i}>:{i}</option>
                        ))}
                      </select>
                    </div>

                    {/* Steps */}
                    <div className="flex gap-0.5">
                      {grid[sound.id]?.map((vel, stepIndex) => {
                        const isBeat = stepIndex % 4 === 0;
                        const isCurrentCol = currentStep === stepIndex && isPreviewPlaying;
                        const hasBeatGap = stepIndex > 0 && stepIndex % 4 === 0;
                        const hasAccent = accents[stepIndex];

                        return (
                          <button
                            key={stepIndex}
                            onClick={() => toggleStep(sound.id, stepIndex)}
                            className={`w-7 h-7 rounded transition-all relative flex items-center justify-center ${
                              vel > 0
                                ? `shadow-lg ${vel === 1 ? 'scale-90' : vel === 2 ? 'scale-95' : 'scale-105'}`
                                : isBeat
                                ? 'bg-studio-600 hover:bg-studio-500'
                                : 'bg-studio-700 hover:bg-studio-600'
                            } ${isCurrentCol ? 'ring-2 ring-accent-primary/60' : ''} ${
                              hasBeatGap ? 'ml-1.5' : ''
                            } ${hasAccent && vel > 0 ? 'ring-1 ring-yellow-400/50' : ''}`}
                            style={vel > 0 ? {
                              backgroundColor: hexToRgba(sound.color, [0, 0.45, 0.7, 1.0][vel]),
                              boxShadow: vel === 3 ? `0 0 12px ${sound.color}60` : undefined,
                            } : undefined}
                          >
                            {/* Velocity indicator bars */}
                            {vel > 0 && (
                              <div className="flex gap-px">
                                {Array.from({ length: vel }, (_, k) => (
                                  <div key={k} className="w-0.5 h-2 bg-white/80 rounded-full" />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Row operations button */}
                    <button
                      onClick={(e) => handleOpenRowMenu(sound.id, e)}
                      className="ml-1.5 p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Row operations"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* Remove button */}
                    {sounds.length > 1 && (
                      <button
                        onClick={() => removeSound(sound.id)}
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Euclidean popover (rendered below the row) */}
                  {euclideanRow === sound.id && (
                    <div className="flex items-center gap-2 mb-2 ml-64 p-2 bg-studio-700 rounded border border-studio-600">
                      <span className="text-xs text-gray-300 font-medium">Euclidean:</span>
                      <label className="text-xs text-gray-400">Hits</label>
                      <input
                        type="number"
                        min={1}
                        max={steps}
                        value={euclideanHits}
                        onChange={(e) => setEuclideanHits(Math.max(1, Math.min(steps, Number(e.target.value) || 1)))}
                        className="w-12 px-1 py-0.5 text-xs bg-studio-600 border border-studio-500 rounded text-white text-center"
                      />
                      <span className="text-xs text-gray-500">/ {steps} steps</span>
                      <button
                        onClick={() => applyEuclidean(sound.id)}
                        className="px-2 py-0.5 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400 font-medium"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setEuclideanRow(null)}
                        className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add sound button */}
            {sounds.length < DEFAULT_SOUNDS.length && (
              <button
                onClick={addSound}
                className="mt-2 px-3 py-1 text-xs bg-studio-700 text-gray-400 rounded hover:bg-studio-600 hover:text-white flex items-center gap-1"
              >
                <Plus size={12} />
                Add sound
              </button>
            )}
          </div>
        </div>

        {/* Row operations dropdown menu (fixed position) */}
        {openRowMenu !== null && (
          <>
            {/* Backdrop to close menu */}
            <div className="fixed inset-0 z-40" onClick={() => setOpenRowMenu(null)} />
            <div
              className="fixed z-50 glass-panel shadow-panel animate-slide-down py-1 w-48"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button
                onClick={() => menuAction(() => copyRow(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                <Copy size={11} /> Copy pattern
              </button>
              <button
                onClick={() => menuAction(() => pasteRow(openRowMenu))}
                className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 ${
                  clipboard ? 'text-gray-300 hover:bg-studio-600' : 'text-gray-600 cursor-not-allowed'
                }`}
                disabled={!clipboard}
              >
                <Copy size={11} className="scale-x-[-1]" /> Paste pattern
              </button>
              <button
                onClick={() => menuAction(() => clearRow(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                <Trash2 size={11} /> Clear row
              </button>
              <div className="border-t border-studio-600 my-1" />
              <button
                onClick={() => menuAction(() => shiftLeft(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                <ChevronLeft size={11} /> Shift left
              </button>
              <button
                onClick={() => menuAction(() => shiftRight(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                <ChevronRight size={11} /> Shift right
              </button>
              <button
                onClick={() => menuAction(() => reverseRow(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                &#8596; Reverse
              </button>
              <div className="border-t border-studio-600 my-1" />
              <button
                onClick={() => menuAction(() => randomFillRow(openRowMenu))}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                <Shuffle size={11} /> Random fill
              </button>
              <button
                onClick={() => {
                  setEuclideanRow(openRowMenu);
                  setOpenRowMenu(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-studio-600 flex items-center gap-2"
              >
                &#9673; Euclidean
              </button>
            </div>
          </>
        )}

        {/* Preview & Actions */}
        <div className="border-t border-white/[0.04] pro-header p-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Generated code:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-studio-900 rounded text-accent-tertiary font-mono text-xs overflow-x-auto max-h-16">
                  {previewCode}
                </code>
                <button
                  onClick={copyCode}
                  className="btn-pro p-2 bg-studio-600 text-gray-300 rounded-lg hover:bg-studio-500"
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={applyAsTrack}
              className="btn-pro px-4 py-2 bg-accent-primary text-black rounded-lg font-medium hover:bg-emerald-400 flex items-center gap-2 shadow-glow-primary"
            >
              <Plus size={16} />
              Create Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
