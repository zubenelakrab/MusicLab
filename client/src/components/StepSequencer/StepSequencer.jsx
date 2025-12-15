import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Square, Copy, Trash2, Plus, Minus, RotateCcw, Shuffle } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { initAudio, startPreview, stopPreview } from '../../strudel/engine';

// Available drum/percussion sounds from dirt-samples
// Only includes verified working samples
const DEFAULT_SOUNDS = [
  // Basics (verified in dirt-samples)
  { id: 'bd', name: 'Kick', color: '#ef4444', category: 'basics' },
  { id: 'sd', name: 'Snare', color: '#f97316', category: 'basics' },
  { id: 'hh', name: 'HiHat', color: '#eab308', category: 'basics' },
  { id: 'ho', name: 'HiHat Open', color: '#84cc16', category: 'basics' },
  { id: 'cp', name: 'Clap', color: '#10b981', category: 'basics' },
  { id: 'cr', name: 'Crash', color: '#ec4899', category: 'basics' },
  { id: 'rd', name: 'Ride', color: '#14b8a6', category: 'basics' },
  // Toms
  { id: 'lt', name: 'Low Tom', color: '#f43f5e', category: 'toms' },
  { id: 'mt', name: 'Mid Tom', color: '#fb7185', category: 'toms' },
  { id: 'ht', name: 'High Tom', color: '#fda4af', category: 'toms' },
  // Electronic
  { id: 'drum', name: 'Drum', color: '#a855f7', category: 'electronic' },
  { id: 'techno', name: 'Techno', color: '#c084fc', category: 'electronic' },
  { id: 'clubkick', name: 'Club Kick', color: '#e879f9', category: 'electronic' },
  // Percussion
  { id: 'perc', name: 'Perc', color: '#0ea5e9', category: 'percussion' },
  { id: 'tabla', name: 'Tabla', color: '#22c55e', category: 'percussion' },
  { id: 'hand', name: 'Hand', color: '#bbf7d0', category: 'percussion' },
  { id: 'can', name: 'Can', color: '#e0f2fe', category: 'percussion' },
  { id: 'metal', name: 'Metal', color: '#67e8f9', category: 'percussion' },
  // Bass & other
  { id: 'bass', name: 'Bass', color: '#fb923c', category: 'misc' },
  { id: 'glitch', name: 'Glitch', color: '#f87171', category: 'misc' },
  { id: 'blip', name: 'Blip', color: '#fb7185', category: 'misc' },
  { id: 'arpy', name: 'Arpy', color: '#c084fc', category: 'misc' },
  { id: 'pluck', name: 'Pluck', color: '#34d399', category: 'misc' },
];

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
const CATEGORIES = ['basics', 'toms', 'electronic', 'percussion', 'misc'];

export default function StepSequencer({ isOpen, onClose }) {
  const { currentPattern, updateLayerCode, selectedLayerIndex, bpm } = useStore();
  const { initializeAudio, audioReady } = useStrudel();

  const [steps, setSteps] = useState(16);
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS.slice(0, 4));
  const [grid, setGrid] = useState({}); // {soundId: number[]} where 0=off, 1-3=velocity
  const [variations, setVariations] = useState({}); // {soundId: number} sample variation
  const [swing, setSwing] = useState(0); // 0-100%
  const [currentStep, setCurrentStep] = useState(0);
  const [previewCode, setPreviewCode] = useState('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const stepIntervalRef = useRef(null);

  // Initialize grid when sounds or steps change
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
  }, [sounds, steps]);

  // Generate mini notation from grid (for export/display)
  const generateCode = useCallback(() => {
    const activeSounds = sounds.filter(s => grid[s.id]?.some(v => v > 0));

    if (activeSounds.length === 0) return '~';

    // Generate pattern for each sound
    const patterns = activeSounds.map(sound => {
      const variation = variations[sound.id] || 0;
      const soundName = variation > 0 ? `${sound.id}:${variation}` : sound.id;

      const pattern = grid[sound.id].map((vel) => {
        return vel > 0 ? soundName : '~';
      }).join(' ');
      return `[${pattern}]`;
    });

    // Build final code
    if (patterns.length === 1) {
      return patterns[0];
    }
    // Multiple sounds - use stack notation: [pattern1 , pattern2 , pattern3]
    // The comma inside brackets creates parallel/stacked patterns
    return patterns.join(' , ');
  }, [grid, sounds, variations]);

  // Update preview when grid changes
  useEffect(() => {
    setPreviewCode(generateCode());
  }, [grid, generateCode]);

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

  // Simple toggle on/off
  const toggleStep = (soundId, stepIndex) => {
    setGrid(prev => ({
      ...prev,
      [soundId]: prev[soundId].map((v, i) => i === stepIndex ? (v ? 0 : 1) : v)
    }));
  };

  // Clear entire grid
  const clearAll = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    const newGrid = {};
    sounds.forEach(sound => {
      newGrid[sound.id] = new Array(steps).fill(0);
    });
    setGrid(newGrid);
  };

  // Load preset pattern
  const loadPreset = (preset) => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }

    // Set sounds from preset
    const presetSounds = preset.sounds.map(id => DEFAULT_SOUNDS.find(s => s.id === id)).filter(Boolean);
    setSounds(presetSounds);

    // Set grid with preset patterns (pad/truncate to current steps)
    const newGrid = {};
    presetSounds.forEach(sound => {
      const presetPattern = preset.patterns[sound.id] || [];
      newGrid[sound.id] = new Array(steps).fill(0).map((_, i) => presetPattern[i % presetPattern.length] || 0);
    });
    setGrid(newGrid);
  };

  // Add a sound row
  const addSound = () => {
    const availableSounds = DEFAULT_SOUNDS.filter(s => !sounds.find(existing => existing.id === s.id));
    if (availableSounds.length > 0) {
      setSounds([...sounds, availableSounds[0]]);
    }
  };

  // Remove a sound row
  const removeSound = (soundId) => {
    if (sounds.length > 1) {
      setSounds(sounds.filter(s => s.id !== soundId));
      setGrid(prev => {
        const newGrid = { ...prev };
        delete newGrid[soundId];
        return newGrid;
      });
    }
  };

  // Change a sound
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
    }
  };

  // Change sample variation
  const changeVariation = (soundId, variation) => {
    setVariations(prev => ({ ...prev, [soundId]: variation }));
  };

  // Apply to current layer
  const applyToLayer = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    const code = generateCode();
    updateLayerCode(selectedLayerIndex, code);
    onClose();
  };

  // Copy to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(previewCode);
  };

  // Toggle preview playback
  const togglePreview = async () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    } else {
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
        stopPreview();
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
      stopPreview();
    };
  }, []);

  // Stop preview when modal closes
  const handleClose = () => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-studio-800 rounded-lg shadow-2xl border border-studio-600 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-studio-700 border-b border-studio-600">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Step Sequencer</h2>
            {/* Preview controls */}
            <button
              onClick={togglePreview}
              className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${
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
              className="px-2 py-1 text-xs bg-red-600/50 text-red-200 rounded hover:bg-red-600 flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-4 px-4 py-2 bg-studio-750 border-b border-studio-600">
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
              <option value="" disabled>Elegir...</option>
              {PRESETS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-max">
            {/* Step numbers header */}
            <div className="flex mb-2">
              <div className="w-32 flex-shrink-0" />
              <div className="flex gap-0.5">
                {Array.from({ length: steps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-5 flex items-center justify-center text-xs ${
                      i % 4 === 0 ? 'text-gray-400' : 'text-gray-600'
                    } ${currentStep === i && isPreviewPlaying ? 'text-accent-primary font-bold' : ''}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Sound rows */}
            {sounds.map((sound) => (
              <div key={sound.id} className="flex items-center mb-1 group">
                {/* Sound selector + variation */}
                <div className="w-32 flex-shrink-0 flex items-center gap-1 pr-1">
                  <div
                    className="w-1.5 h-8 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: sound.color }}
                  />
                  <select
                    value={sound.id}
                    onChange={(e) => changeSound(sound.id, e.target.value)}
                    className="flex-1 min-w-0 px-1 py-1 text-xs bg-studio-700 border border-studio-600 rounded text-white truncate"
                  >
                    {CATEGORIES.map(category => (
                      <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                        {DEFAULT_SOUNDS.filter(s => s.category === category).map(s => (
                          <option
                            key={s.id}
                            value={s.id}
                            disabled={sounds.some(x => x.id === s.id && x.id !== sound.id)}
                          >
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* Sample variation selector */}
                  <select
                    value={variations[sound.id] || 0}
                    onChange={(e) => changeVariation(sound.id, Number(e.target.value))}
                    className="w-10 px-0.5 py-1 text-xs bg-studio-700 border border-studio-600 rounded text-gray-400"
                    title="Sample variation"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i}>:{i}</option>
                    ))}
                  </select>
                </div>

                {/* Steps */}
                <div className="flex gap-0.5">
                  {grid[sound.id]?.map((active, stepIndex) => {
                    const isBeat = stepIndex % 4 === 0;
                    const isCurrentStepActive = currentStep === stepIndex && isPreviewPlaying;

                    return (
                      <button
                        key={stepIndex}
                        onClick={() => toggleStep(sound.id, stepIndex)}
                        className={`w-7 h-7 rounded transition-all ${
                          active
                            ? 'shadow-lg scale-105'
                            : isBeat
                            ? 'bg-studio-600 hover:bg-studio-500'
                            : 'bg-studio-700 hover:bg-studio-600'
                        } ${isCurrentStepActive ? 'ring-2 ring-white ring-opacity-80' : ''}`}
                        style={{
                          backgroundColor: active ? sound.color : undefined,
                          boxShadow: active ? `0 0 8px ${sound.color}50` : undefined
                        }}
                      />
                    );
                  })}
                </div>

                {/* Remove button */}
                {sounds.length > 1 && (
                  <button
                    onClick={() => removeSound(sound.id)}
                    className="ml-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}

            {/* Add sound button */}
            {sounds.length < DEFAULT_SOUNDS.length && (
              <button
                onClick={addSound}
                className="mt-2 px-3 py-1 text-xs bg-studio-700 text-gray-400 rounded hover:bg-studio-600 hover:text-white flex items-center gap-1"
              >
                <Plus size={12} />
                Agregar sonido
              </button>
            )}
          </div>
        </div>

        {/* Preview & Actions */}
        <div className="border-t border-studio-600 bg-studio-700 p-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Codigo generado:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-studio-900 rounded text-accent-tertiary font-mono text-xs overflow-x-auto max-h-16">
                  {previewCode}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2 bg-studio-600 text-gray-300 rounded hover:bg-studio-500"
                  title="Copiar"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={applyToLayer}
              className="px-4 py-2 bg-accent-primary text-black rounded font-medium hover:bg-emerald-400 flex items-center gap-2"
            >
              <Play size={16} />
              Aplicar a Layer {selectedLayerIndex + 1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
