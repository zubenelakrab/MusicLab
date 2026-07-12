import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Square, Copy, Trash2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Shuffle, ArrowUp, ArrowDown } from 'lucide-react';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { initAudio, startMelodicPreview, stopPreview, isInPreviewMode } from '../../strudel/engine';
import { generateId, generateTrackId, generateClipId } from '../../utils/id';
import { SAMPLE_NAMES, SAMPLE_VARIANT_COUNTS } from '../../data/samples';

// Full chromatic scale
const CHROMATIC_NOTES = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'];
const CHROMATIC_LABELS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Scale definitions (semitone intervals from root)
const SCALES = {
  chromatic:     [0,1,2,3,4,5,6,7,8,9,10,11],
  major:         [0,2,4,5,7,9,11],
  minor:         [0,2,3,5,7,8,10],
  pentatonic:    [0,2,4,7,9],
  blues:         [0,3,5,6,7,10],
  dorian:        [0,2,3,5,7,9,10],
  mixolydian:    [0,2,4,5,7,9,10],
  harmonicMinor: [0,2,3,5,7,8,11],
};

const SCALE_LABELS = {
  chromatic: 'Chromatic',
  major: 'Major',
  minor: 'Minor',
  pentatonic: 'Pentatonic',
  blues: 'Blues',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
  harmonicMinor: 'Harmonic Minor',
};

// Note colors - 12 chromatic
const NOTE_COLORS = {
  c: '#ef4444', 'c#': '#f97316', d: '#fb923c', 'd#': '#eab308',
  e: '#a3e635', f: '#22c55e', 'f#': '#14b8a6', g: '#3b82f6',
  'g#': '#6366f1', a: '#8b5cf6', 'a#': '#d946ef', b: '#ec4899',
};

// Black keys for piano styling
const BLACK_KEYS = new Set(['c#','d#','f#','g#','a#']);

const SYNTHS = SAMPLE_NAMES.map((id) => ({ id, name: id, cat: 'All Samples' }));
const SYNTH_CATEGORIES = ['All Samples'];
const supportsVariantSuffix = (sampleId) => !/\d$/.test(sampleId);

const VELOCITY_GAIN = [0, 0.40, 0.70, 1.00];

// Presets using new grid format { stepIndex: { noteKey: velocity } }
const PRESETS = [
  // --- Arpeggios ---
  {
    name: 'Trance Arp',
    synth: 'arpy',
    grid: {
      0: { c3: 3 }, 1: { e3: 2 }, 2: { g3: 3 }, 3: { c4: 2 },
      4: { e4: 3 }, 5: { g3: 2 }, 6: { c4: 3 }, 7: { e3: 2 },
      8: { c3: 3 }, 9: { e3: 2 }, 10: { g3: 3 }, 11: { c4: 2 },
      12: { g4: 3 }, 13: { e4: 2 }, 14: { c4: 1 }, 15: { g3: 2 },
    },
  },
  {
    name: 'Minor Sweep',
    synth: 'fm',
    grid: {
      0: { a2: 3 }, 1: { c3: 2 }, 2: { e3: 3 }, 3: { a3: 2 },
      4: { c4: 3 }, 5: { e4: 3 }, 6: { a4: 3 }, 7: { e4: 2 },
      8: { c4: 3 }, 9: { a3: 2 }, 10: { e3: 3 }, 11: { c3: 2 },
      12: { a2: 3 }, 13: { e3: 1 }, 14: { a3: 2 }, 15: { e3: 1 },
    },
  },
  {
    name: 'Pluck Arp',
    synth: 'pluck',
    grid: {
      0: { e3: 3 }, 1: { g3: 2 }, 2: { b3: 3 }, 3: { e4: 2 },
      4: { d3: 3 }, 5: { 'f#3': 2 }, 6: { a3: 3 }, 7: { d4: 2 },
      8: { c3: 3 }, 9: { e3: 2 }, 10: { g3: 3 }, 11: { c4: 2 },
      12: { b2: 3 }, 13: { d3: 2 }, 14: { 'f#3': 3 }, 15: { b3: 1 },
    },
  },
  {
    name: 'Bouncing Arp',
    synth: 'casio',
    grid: {
      0: { c4: 3 }, 1: { g3: 2 }, 2: { e3: 1 }, 3: { g3: 2 },
      4: { c4: 3 }, 5: { e4: 3 }, 6: { g4: 2 }, 7: { e4: 1 },
      8: { f4: 3 }, 9: { c4: 2 }, 10: { a3: 1 }, 11: { c4: 2 },
      12: { f4: 3 }, 13: { a4: 3 }, 14: { c5: 2 }, 15: { a4: 1 },
    },
  },
  // --- Basslines ---
  {
    name: 'Acid Bass',
    synth: 'bass3',
    grid: {
      0: { c2: 3 }, 1: { c2: 1 }, 2: { c3: 3 }, 3: { c2: 2 },
      4: { 'd#2': 3 }, 6: { c2: 3 }, 7: { g2: 1 },
      8: { 'a#1': 3 }, 9: { 'a#1': 1 }, 10: { 'a#2': 3 }, 11: { f2: 2 },
      12: { g2: 3 }, 13: { g2: 1 }, 14: { 'a#2': 2 }, 15: { g2: 3 },
    },
  },
  {
    name: 'Acid Squelch',
    synth: 'bass3',
    grid: {
      0: { d2: 3 }, 1: { d2: 1 }, 2: { d3: 3 },
      4: { f2: 3 }, 5: { f2: 1 }, 6: { a2: 3 }, 7: { d2: 2 },
      8: { c2: 3 }, 9: { c2: 1 }, 10: { 'd#2': 3 }, 11: { c3: 3 },
      12: { 'a#1': 3 }, 14: { c2: 2 }, 15: { d2: 1 },
    },
  },
  {
    name: 'TB-303 Line',
    synth: 'bass3',
    grid: {
      0: { e2: 3 }, 1: { e2: 1 }, 3: { e3: 3 },
      4: { g2: 3 }, 5: { e2: 2 }, 7: { b2: 3 },
      8: { a2: 3 }, 9: { a2: 1 }, 10: { e2: 2 }, 11: { a2: 3 },
      12: { g2: 3 }, 13: { e2: 1 }, 14: { b2: 3 }, 15: { g2: 2 },
    },
  },
  {
    name: 'Disco Octaves',
    synth: 'jvbass',
    grid: {
      0: { c2: 3 }, 1: { c3: 2 }, 2: { c2: 3 }, 3: { c3: 1 },
      4: { f2: 3 }, 5: { f3: 2 }, 6: { f2: 3 }, 7: { f3: 1 },
      8: { g2: 3 }, 9: { g3: 2 }, 10: { g2: 3 }, 11: { g3: 1 },
      12: { f2: 3 }, 13: { f3: 2 }, 14: { 'd#2': 3 }, 15: { d2: 2 },
    },
  },
  {
    name: 'Funky Moog',
    synth: 'moog',
    grid: {
      0: { e2: 3 }, 2: { g2: 2 }, 3: { a2: 3 },
      5: { e2: 2 }, 6: { e2: 1 }, 7: { b2: 3 },
      8: { a2: 3 }, 10: { g2: 2 }, 11: { e2: 3 },
      12: { d2: 3 }, 13: { e2: 2 }, 15: { g2: 1 },
    },
  },
  {
    name: 'Deep House',
    synth: 'jvbass',
    grid: {
      0: { g2: 3 }, 3: { g2: 1 }, 4: { 'a#2': 3 },
      6: { c3: 2 }, 7: { 'a#2': 1 },
      8: { f2: 3 }, 11: { f2: 1 }, 12: { d2: 3 },
      14: { f2: 2 }, 15: { g2: 1 },
    },
  },
  {
    name: 'Techno Sub',
    synth: 'bass1',
    grid: {
      0: { c2: 3 }, 4: { c2: 3 },
      6: { 'd#2': 2 }, 7: { c2: 1 },
      8: { c2: 3 }, 12: { c2: 3 },
      14: { 'a#1': 2 }, 15: { c2: 1 },
    },
  },
  {
    name: 'DnB Reese',
    synth: 'moog',
    grid: {
      0: { e2: 3 }, 2: { e2: 1 },
      4: { g2: 3 }, 5: { e2: 2 },
      7: { b2: 3 }, 8: { a2: 3 },
      10: { g2: 2 }, 11: { e2: 1 },
      12: { d2: 3 }, 14: { e2: 2 }, 15: { g2: 3 },
    },
  },
  {
    name: 'Slap Bass',
    synth: 'bass2',
    grid: {
      0: { e2: 3 }, 1: { e2: 1 }, 3: { g2: 3 },
      4: { a2: 3 }, 5: { a2: 1 }, 7: { e2: 2 },
      8: { d2: 3 }, 9: { d2: 1 }, 10: { e2: 2 }, 11: { g2: 3 },
      12: { a2: 3 }, 13: { b2: 2 }, 14: { a2: 3 }, 15: { g2: 1 },
    },
  },
  {
    name: 'Dub Bass',
    synth: 'bass1',
    grid: {
      0: { a1: 3 }, 3: { a2: 2 },
      5: { e2: 1 }, 7: { a1: 3 },
      8: { d2: 3 }, 11: { d3: 2 },
      13: { a2: 1 }, 15: { d2: 3 },
    },
  },
  {
    name: 'Walking Bass',
    synth: 'bass1',
    grid: {
      0: { c2: 3 }, 2: { d2: 2 }, 4: { e2: 3 }, 6: { g2: 2 },
      8: { a2: 3 }, 10: { g2: 2 }, 12: { f2: 3 }, 14: { e2: 2 },
    },
  },
  {
    name: 'Wobble Bass',
    synth: 'wobble',
    grid: {
      0: { c2: 3 }, 1: { c2: 2 }, 2: { c2: 3 }, 3: { c2: 1 },
      4: { 'd#2': 3 }, 5: { 'd#2': 2 }, 6: { 'd#2': 3 }, 7: { 'd#2': 1 },
      8: { f2: 3 }, 9: { f2: 2 }, 10: { f2: 3 }, 11: { f2: 1 },
      12: { 'd#2': 3 }, 13: { 'd#2': 2 }, 14: { c2: 3 }, 15: { c2: 2 },
    },
  },
  // --- Melodies ---
  {
    name: 'Synth Pop',
    synth: 'juno',
    grid: {
      0: { e4: 3 }, 1: { e4: 1 }, 2: { 'f#4': 2 }, 3: { g4: 3 },
      5: { e4: 2 }, 7: { d4: 1 },
      8: { c4: 3 }, 9: { c4: 1 }, 10: { d4: 2 }, 11: { e4: 3 },
      13: { d4: 2 }, 14: { c4: 1 }, 15: { b3: 2 },
    },
  },
  {
    name: 'Sad Piano',
    synth: 'pluck',
    grid: {
      0: { a3: 3 }, 2: { c4: 2 }, 3: { e4: 3 },
      6: { d4: 2 }, 7: { c4: 1 },
      8: { b3: 3 }, 10: { a3: 2 }, 11: { g3: 1 },
      12: { a3: 3 }, 14: { e4: 2 }, 15: { d4: 1 },
    },
  },
  {
    name: 'Film Score',
    synth: 'padlong',
    grid: {
      0: { d3: 3 }, 2: { f3: 2 }, 4: { a3: 3 }, 5: { d4: 3 },
      8: { c4: 3 }, 10: { a3: 2 }, 12: { 'a#3': 3 }, 14: { a3: 2 },
    },
  },
  {
    name: 'Retro Game',
    synth: 'sid',
    grid: {
      0: { e4: 3 }, 1: { e4: 1 }, 2: { e4: 3 }, 4: { c4: 3 },
      5: { e4: 2 }, 7: { g4: 3 },
      8: { g3: 3 }, 10: { c4: 2 }, 11: { e4: 3 },
      12: { g4: 3 }, 13: { 'f#4': 2 }, 14: { f4: 3 }, 15: { d4: 2 },
    },
  },
  {
    name: 'Italo Disco',
    synth: 'arpy',
    grid: {
      0: { a3: 3 }, 1: { e4: 2 }, 2: { a4: 3 }, 3: { e4: 1 },
      4: { g3: 3 }, 5: { d4: 2 }, 6: { g4: 3 }, 7: { d4: 1 },
      8: { f3: 3 }, 9: { c4: 2 }, 10: { f4: 3 }, 11: { c4: 1 },
      12: { e3: 3 }, 13: { b3: 2 }, 14: { e4: 3 }, 15: { g3: 2 },
    },
  },
  {
    name: 'Stranger Things',
    synth: 'juno',
    grid: {
      0: { c3: 3 }, 2: { e3: 2 }, 4: { g3: 3 }, 6: { b3: 2 },
      8: { c4: 3 }, 10: { b3: 2 }, 12: { g3: 3 }, 14: { e3: 1 },
    },
  },
  {
    name: 'Hoover Lead',
    synth: 'hoover',
    grid: {
      0: { c4: 3 }, 2: { 'd#4': 3 }, 3: { d4: 2 }, 4: { c4: 3 },
      6: { g3: 2 }, 7: { 'a#3': 3 },
      8: { c4: 3 }, 10: { 'd#4': 3 }, 11: { f4: 2 },
      12: { 'd#4': 3 }, 13: { d4: 2 }, 14: { c4: 3 }, 15: { 'a#3': 1 },
    },
  },
  // --- Chords ---
  {
    name: 'House Chords',
    synth: 'stab',
    grid: {
      0: { c3: 3, e3: 3, g3: 3 }, 3: { c3: 1, e3: 1, g3: 1 },
      4: { f3: 3, a3: 3, c4: 3 }, 6: { f3: 2, a3: 2, c4: 2 },
      8: { a3: 3, c4: 3, e4: 3 }, 11: { a3: 1, c4: 1, e4: 1 },
      12: { g3: 3, b3: 3, d4: 3 }, 14: { g3: 2, b3: 2, d4: 2 },
    },
  },
  {
    name: 'Reggae Skank',
    synth: 'arpy',
    grid: {
      1: { 'a#3': 2, d4: 2, f4: 2 }, 2: { 'a#3': 3, d4: 3, f4: 3 },
      5: { c4: 2, e4: 2, g4: 2 }, 6: { c4: 3, e4: 3, g4: 3 },
      9: { 'a#3': 2, d4: 2, f4: 2 }, 10: { 'a#3': 3, d4: 3, f4: 3 },
      13: { f3: 2, a3: 2, c4: 2 }, 14: { f3: 3, a3: 3, c4: 3 },
    },
  },
  {
    name: 'Rave Stabs',
    synth: 'rave',
    grid: {
      0: { c4: 3, 'd#4': 3, g4: 3 },
      4: { 'a#3': 3, d4: 3, f4: 3 }, 5: { 'a#3': 1, d4: 1, f4: 1 },
      8: { 'g#3': 3, c4: 3, 'd#4': 3 },
      12: { 'a#3': 3, d4: 3, f4: 3 }, 13: { 'a#3': 2, d4: 2, f4: 2 }, 14: { 'a#3': 1, d4: 1, f4: 1 },
    },
  },
  {
    name: 'Ambient Pads',
    synth: 'padlong',
    grid: {
      0: { c3: 2, e3: 2, g3: 2 },
      4: { d3: 2, f3: 2, a3: 2 },
      8: { e3: 2, g3: 2, b3: 2 },
      12: { c3: 2, f3: 2, a3: 2 },
    },
  },
  {
    name: 'Garage Stab',
    synth: 'rave2',
    grid: {
      1: { d4: 3, 'f#4': 3, a4: 3 },
      3: { d4: 1, 'f#4': 1, a4: 1 },
      4: { e4: 3, g4: 3, b4: 3 },
      8: { c4: 3, e4: 3, g4: 3 },
      9: { c4: 1, e4: 1, g4: 1 },
      12: { d4: 3, 'f#4': 3, a4: 3 }, 13: { d4: 2, 'f#4': 2, a4: 2 },
    },
  },
  // --- World / Latin ---
  {
    name: 'Latin Montuno',
    synth: 'casio',
    grid: {
      0: { c4: 3 }, 1: { e4: 2 }, 2: { g4: 3 }, 3: { e4: 1 },
      4: { f4: 3 }, 5: { a4: 2 }, 6: { f4: 1 },
      8: { e4: 3 }, 9: { g4: 2 }, 10: { c4: 3 },
      12: { d4: 3 }, 13: { f4: 2 }, 14: { d4: 1 }, 15: { b3: 2 },
    },
  },
  {
    name: 'Eastern Melody',
    synth: 'sitar',
    grid: {
      0: { d3: 3 }, 2: { f3: 2 }, 3: { e3: 3 }, 4: { f3: 2 },
      6: { a3: 3 }, 7: { 'a#3': 2 },
      8: { a3: 3 }, 10: { f3: 2 }, 11: { e3: 1 },
      12: { d3: 3 }, 14: { c3: 2 }, 15: { d3: 1 },
    },
  },
  {
    name: 'Kalimba',
    synth: 'arpy',
    grid: {
      0: { c4: 3 }, 2: { e4: 2 }, 3: { g4: 1 },
      5: { e4: 2 }, 6: { c4: 3 },
      8: { d4: 3 }, 10: { f4: 2 }, 11: { a4: 1 },
      13: { f4: 2 }, 14: { d4: 3 }, 15: { c4: 1 },
    },
  },
  {
    name: 'Bossa Nova',
    synth: 'pluck',
    grid: {
      0: { a3: 3 }, 1: { e3: 1 }, 3: { c4: 2 },
      4: { b3: 3 }, 5: { g3: 1 },
      7: { d4: 2 }, 8: { c4: 3 }, 9: { a3: 1 },
      11: { e4: 2 }, 12: { d4: 3 }, 14: { b3: 2 }, 15: { a3: 1 },
    },
  },
  // --- Arcade / Videogames ---
  {
    name: 'Super Mario',
    synth: 'sid',
    grid: {
      0: { e4: 3 }, 1: { e4: 2 }, 3: { e4: 3 },
      5: { c4: 3 }, 6: { e4: 2 },
      8: { g4: 3 },
      12: { g3: 3 },
    },
  },
  {
    name: 'Mario Underground',
    synth: 'fm',
    grid: {
      0: { c3: 3 }, 1: { c4: 2 }, 2: { a3: 3 }, 3: { a2: 2 },
      4: { 'a#2': 3 }, 5: { 'a#3': 2 }, 6: { 'f#3': 3 }, 7: { 'f#2': 1 },
      8: { g2: 3 }, 9: { g3: 2 }, 10: { e3: 3 }, 11: { e2: 2 },
      12: { c3: 3 }, 14: { g2: 2 }, 15: { c3: 1 },
    },
  },
  {
    name: 'Zelda Theme',
    synth: 'arpy',
    grid: {
      0: { 'a#3': 3 }, 2: { f3: 2 }, 3: { f3: 1 },
      4: { f3: 3 }, 5: { f3: 2 }, 6: { g3: 3 }, 7: { a3: 3 },
      8: { 'a#3': 3 }, 10: { f3: 2 }, 11: { f3: 1 },
      12: { f3: 3 }, 13: { 'a#3': 2 }, 14: { a3: 3 }, 15: { g3: 2 },
    },
  },
  {
    name: 'Zelda Puzzle',
    synth: 'pluck',
    grid: {
      0: { g4: 3 }, 2: { 'f#4': 2 }, 4: { 'd#4': 3 },
      6: { a3: 2 }, 8: { 'g#3': 3 },
      10: { e4: 2 }, 12: { 'g#4': 3 }, 14: { c5: 3 },
    },
  },
  {
    name: 'Tetris A',
    synth: 'casio',
    grid: {
      0: { e4: 3 }, 1: { b3: 2 }, 2: { c4: 3 }, 3: { d4: 2 },
      4: { c4: 3 }, 5: { b3: 2 }, 6: { a3: 3 },
      8: { a3: 3 }, 9: { c4: 2 }, 10: { e4: 3 },
      12: { d4: 3 }, 13: { c4: 2 }, 14: { b3: 3 }, 15: { c4: 1 },
    },
  },
  {
    name: 'Tetris B',
    synth: 'casio',
    grid: {
      0: { d4: 3 }, 2: { f4: 2 }, 4: { a4: 3 }, 5: { g4: 2 },
      6: { f4: 3 }, 8: { e4: 3 }, 10: { c4: 2 },
      12: { e4: 3 }, 13: { d4: 2 }, 14: { c4: 3 }, 15: { b3: 1 },
    },
  },
  {
    name: 'Pac-Man',
    synth: 'blip',
    grid: {
      0: { b3: 3 }, 1: { b4: 2 }, 2: { 'f#4': 3 }, 3: { 'd#4': 2 },
      4: { b4: 3 }, 5: { 'f#4': 1 }, 6: { 'd#4': 3 },
      8: { c4: 3 }, 9: { c5: 2 }, 10: { g4: 3 }, 11: { e4: 2 },
      12: { c5: 3 }, 13: { g4: 1 }, 14: { e4: 3 },
    },
  },
  {
    name: 'Space Invaders',
    synth: 'sid',
    grid: {
      0: { e2: 3 }, 2: { d2: 3 }, 4: { c2: 3 }, 6: { b1: 3 },
      8: { e2: 3 }, 10: { d2: 3 }, 12: { c2: 3 }, 14: { b1: 3 },
    },
  },
  {
    name: 'Mega Man',
    synth: 'sid',
    grid: {
      0: { a4: 3 }, 1: { g4: 2 }, 2: { a4: 3 }, 3: { b4: 2 },
      4: { a4: 3 }, 5: { g4: 2 }, 6: { f4: 3 },
      8: { e4: 3 }, 9: { f4: 2 }, 10: { e4: 3 }, 11: { d4: 2 },
      12: { c4: 3 }, 14: { d4: 2 }, 15: { e4: 1 },
    },
  },
  {
    name: 'Sonic Green Hill',
    synth: 'arpy',
    grid: {
      0: { e4: 3 }, 1: { e4: 1 }, 2: { e4: 3 }, 3: { d4: 2 },
      4: { e4: 3 }, 5: { 'f#4': 2 }, 6: { g4: 3 },
      8: { 'f#4': 3 }, 9: { e4: 2 }, 10: { d4: 3 }, 11: { e4: 2 },
      12: { 'f#4': 3 }, 13: { g4: 2 }, 14: { a4: 3 }, 15: { g4: 1 },
    },
  },
  {
    name: 'Castlevania',
    synth: 'fm',
    grid: {
      0: { d4: 3 }, 1: { f4: 2 }, 2: { d4: 3 }, 3: { 'c#4': 2 },
      4: { d4: 3 }, 5: { a3: 2 }, 6: { d4: 3 }, 7: { f4: 2 },
      8: { e4: 3 }, 9: { 'c#4': 2 }, 10: { a3: 3 }, 11: { e4: 2 },
      12: { d4: 3 }, 14: { a3: 2 }, 15: { d4: 1 },
    },
  },
  {
    name: 'Contra',
    synth: 'sid',
    grid: {
      0: { e3: 3 }, 1: { e4: 2 }, 2: { d4: 3 }, 3: { e4: 2 },
      4: { c4: 3 }, 5: { b3: 2 }, 6: { a3: 3 }, 7: { b3: 1 },
      8: { c4: 3 }, 9: { d4: 2 }, 10: { e4: 3 }, 11: { d4: 2 },
      12: { c4: 3 }, 13: { b3: 2 }, 14: { a3: 3 }, 15: { g3: 1 },
    },
  },
  {
    name: 'Street Fighter',
    synth: 'juno',
    grid: {
      0: { c4: 3 }, 1: { c4: 1 }, 2: { c4: 3 }, 4: { d4: 3 },
      5: { 'd#4': 3 }, 6: { d4: 2 }, 7: { 'd#4': 3 },
      8: { f4: 3 }, 10: { 'd#4': 2 }, 12: { d4: 3 },
      14: { c4: 2 }, 15: { d4: 1 },
    },
  },
  {
    name: 'Donkey Kong',
    synth: 'pluck',
    grid: {
      0: { c4: 3 }, 2: { e4: 2 }, 4: { g4: 3 },
      6: { e4: 2 }, 7: { c4: 1 },
      8: { d4: 3 }, 10: { f4: 2 }, 12: { a4: 3 },
      14: { f4: 2 }, 15: { d4: 1 },
    },
  },
  {
    name: 'Final Fantasy',
    synth: 'arpy',
    grid: {
      0: { c4: 3 }, 1: { d4: 2 }, 2: { e4: 3 }, 3: { g4: 2 },
      4: { a4: 3 }, 5: { g4: 2 }, 6: { e4: 3 }, 7: { d4: 1 },
      8: { c4: 3 }, 9: { e4: 2 }, 10: { d4: 3 }, 11: { c4: 2 },
      12: { b3: 3 }, 13: { c4: 2 }, 14: { d4: 3 }, 15: { e4: 1 },
    },
  },
  {
    name: 'Kirby Dream',
    synth: 'casio',
    grid: {
      0: { g4: 3 }, 1: { a4: 2 }, 2: { b4: 3 }, 3: { a4: 1 },
      4: { g4: 3 }, 5: { e4: 2 }, 6: { g4: 3 },
      8: { a4: 3 }, 9: { b4: 2 }, 10: { c5: 3 }, 11: { b4: 1 },
      12: { a4: 3 }, 14: { g4: 2 }, 15: { e4: 1 },
    },
  },
  {
    name: 'Metroid',
    synth: 'fm',
    grid: {
      0: { e3: 3 }, 2: { 'f#3': 1 }, 4: { g3: 3 },
      6: { 'f#3': 2 }, 7: { e3: 1 },
      8: { 'd#3': 3 }, 10: { e3: 1 }, 12: { c3: 3 },
      14: { b2: 2 }, 15: { c3: 1 },
    },
  },
  // --- Guitar ---
  {
    name: 'Blues Riff',
    synth: 'gtr',
    grid: {
      0: { e3: 3 }, 1: { g3: 2 }, 2: { 'a#3': 3 }, 3: { b3: 2 },
      4: { 'a#3': 3 }, 6: { g3: 2 },
      8: { a3: 3 }, 9: { g3: 2 }, 10: { e3: 3 }, 11: { g3: 1 },
      12: { e3: 3 }, 14: { d3: 2 }, 15: { e3: 1 },
    },
  },
  {
    name: 'Clean Pluck',
    synth: 'pluck',
    grid: {
      0: { e3: 3 }, 2: { b3: 2 }, 3: { e4: 3 },
      4: { g3: 2 }, 6: { d4: 3 },
      8: { a3: 3 }, 10: { c4: 2 }, 11: { e4: 3 },
      12: { d4: 2 }, 13: { b3: 1 }, 14: { g3: 2 }, 15: { 'f#3': 1 },
    },
  },
];

const STEP_OPTIONS = [8, 16, 32];

// Track colors
const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

// Convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MelodicSequencer({ isOpen, onClose }) {
  const { arrangement, setEditingClip, bpm, setPlaying, addBuiltTrack } = useStore();
  const { initializeAudio, audioReady } = useStrudel();

  // Core state
  const [steps, setSteps] = useState(16);
  const [grid, setGrid] = useState({}); // { stepIndex: { noteKey: velocity } }
  const [synth, setSynth] = useState('arpy');
  const [synthVariation, setSynthVariation] = useState(0);
  const [rootNote, setRootNote] = useState('c');
  const [scale, setScale] = useState('chromatic');
  const [baseOctave, setBaseOctave] = useState(3);
  const octaveRange = 2;
  const [currentStep, setCurrentStep] = useState(0);
  const [previewCode, setPreviewCode] = useState('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [randomDensity, setRandomDensity] = useState(50);
  const stepIntervalRef = useRef(null);
  const gridRef = useRef(null);

  const stopPreviewPlayback = useCallback((resetPreviewState = true) => {
    const wasPreviewing = isInPreviewMode();
    stopPreview();
    if (resetPreviewState) {
      setIsPreviewPlaying(false);
    }
    // Only sync the transport off when a preview actually owned the scheduler,
    // so closing the panel doesn't stop unrelated arrangement playback.
    if (wasPreviewing) {
      setPlaying(false);
    }
  }, [setPlaying]);


  // Compute visible notes for the piano roll
  const getVisibleNotes = useCallback(() => {
    const scaleIntervals = SCALES[scale];
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    const notes = [];
    for (let oct = baseOctave; oct < baseOctave + octaveRange; oct++) {
      for (const interval of scaleIntervals) {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = oct + Math.floor((rootIndex + interval) / 12);
        const noteName = CHROMATIC_NOTES[noteIndex];
        const noteKey = `${noteName}${noteOctave}`;
        notes.push({ name: noteName, octave: noteOctave, key: noteKey, color: NOTE_COLORS[noteName] });
      }
    }
    return notes;
  }, [scale, rootNote, baseOctave, octaveRange]);

  const visibleNotes = getVisibleNotes();
  // Reversed for rendering: high notes at top
  const displayNotes = [...visibleNotes].reverse();

  // Scroll view so notes stay visible (only moves baseOctave, never changes octaveRange)
  const scrollToNotes = useCallback((gridData) => {
    const octaves = new Set();
    Object.values(gridData).forEach(stepNotes => {
      if (!stepNotes) return;
      Object.keys(stepNotes).forEach(noteKey => {
        const m = noteKey.match(/(\d+)$/);
        if (m) octaves.add(parseInt(m[1]));
      });
    });
    if (octaves.size === 0) return;
    const minOct = Math.min(...octaves);
    const maxOct = Math.max(...octaves);
    // Center the view around the notes
    const center = Math.floor((minOct + maxOct) / 2);
    setBaseOctave(prev => {
      const newBase = Math.max(1, Math.min(6, center - Math.floor(octaveRange / 2)));
      // Only move if notes are actually outside current view
      if (minOct < prev || maxOct >= prev + octaveRange) {
        return newBase;
      }
      return prev;
    });
  }, [octaveRange]);

  // Generate note pattern string (for preview)
  const generateNotePattern = useCallback(() => {
    const hasNotes = Object.keys(grid).some(step => grid[step] && Object.keys(grid[step]).length > 0);
    if (!hasNotes) return null;

    const noteSteps = [];
    for (let i = 0; i < steps; i++) {
      const stepNotes = grid[i];
      if (!stepNotes || Object.keys(stepNotes).length === 0) {
        noteSteps.push('~');
      } else {
        const entries = Object.entries(stepNotes);
        if (entries.length === 1) {
          noteSteps.push(entries[0][0]);
        } else {
          const notes = entries.map(([k]) => k).join(',');
          noteSteps.push(`<${notes}>`);
        }
      }
    }
    return noteSteps.join(' ');
  }, [grid, steps]);

  // Generate full Strudel code with velocity
  const generateCode = useCallback(() => {
    const hasNotes = Object.keys(grid).some(step => grid[step] && Object.keys(grid[step]).length > 0);
    if (!hasNotes) return '~';

    const noteSteps = [];
    const gainSteps = [];
    let hasVelocityVariation = false;
    let firstVel = null;

    for (let i = 0; i < steps; i++) {
      const stepNotes = grid[i];
      if (!stepNotes || Object.keys(stepNotes).length === 0) {
        noteSteps.push('~');
        gainSteps.push('~');
      } else {
        const entries = Object.entries(stepNotes);
        if (entries.length === 1) {
          const [noteKey, vel] = entries[0];
          noteSteps.push(noteKey);
          const g = VELOCITY_GAIN[vel];
          gainSteps.push(g.toFixed(2));
          if (firstVel === null) firstVel = g;
          else if (Math.abs(g - firstVel) > 0.01) hasVelocityVariation = true;
        } else {
          const notes = entries.map(([k]) => k).join(',');
          noteSteps.push(`<${notes}>`);
          const maxVel = Math.max(...entries.map(([, v]) => v));
          const g = VELOCITY_GAIN[maxVel];
          gainSteps.push(g.toFixed(2));
          if (firstVel === null) firstVel = g;
          else if (Math.abs(g - firstVel) > 0.01) hasVelocityVariation = true;
        }
      }
    }

    const notePattern = noteSteps.join(' ');
    const canUseVariation = supportsVariantSuffix(synth);
    const synthToken = synthVariation > 0 && canUseVariation ? `${synth}:${synthVariation}` : synth;
    const baseCode = `note("${notePattern}").sound("${synthToken}")`;

    if (!hasVelocityVariation && firstVel !== null) {
      return Math.abs(firstVel - 1) > 0.01 ? `${baseCode}.gain(${firstVel.toFixed(2)})` : baseCode;
    }

    const gainPattern = gainSteps.join(' ');
    return `${baseCode}.gain([${gainPattern}])`;
  }, [grid, steps, synth, synthVariation]);

  // Compute gain info for preview
  const getGainInfo = useCallback(() => {
    const hasNotes = Object.keys(grid).some(step => grid[step] && Object.keys(grid[step]).length > 0);
    if (!hasNotes) return null;

    const gainSteps = [];
    let hasVelocityVariation = false;
    let firstVel = null;

    for (let i = 0; i < steps; i++) {
      const stepNotes = grid[i];
      if (!stepNotes || Object.keys(stepNotes).length === 0) {
        gainSteps.push('~');
      } else {
        const entries = Object.entries(stepNotes);
        const maxVel = entries.length === 1 ? entries[0][1] : Math.max(...entries.map(([, v]) => v));
        const g = VELOCITY_GAIN[maxVel];
        gainSteps.push(g.toFixed(2));
        if (firstVel === null) firstVel = g;
        else if (Math.abs(g - firstVel) > 0.01) hasVelocityVariation = true;
      }
    }

    if (!hasVelocityVariation && firstVel !== null) {
      return Math.abs(firstVel - 1) > 0.01 ? { type: 'single', value: firstVel } : null;
    }

    return { type: 'array', pattern: gainSteps.join(' ') };
  }, [grid, steps]);

  // Update preview code
  useEffect(() => {
    setPreviewCode(generateCode());
  }, [generateCode]);

  // Step animation during preview
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

  // --- Cell toggle ---
  // Click cycles: off -> soft(1) -> medium(2) -> hard(3) -> off
  const toggleCell = (stepIndex, noteKey) => {
    setGrid(prev => {
      const newGrid = { ...prev };
      const stepNotes = newGrid[stepIndex] ? { ...newGrid[stepIndex] } : {};
      const currentVel = stepNotes[noteKey] || 0;
      const nextVel = (currentVel + 1) % 4;

      if (nextVel === 0) {
        delete stepNotes[noteKey];
      } else {
        stepNotes[noteKey] = nextVel;
      }

      if (Object.keys(stepNotes).length === 0) {
        delete newGrid[stepIndex];
      } else {
        newGrid[stepIndex] = stepNotes;
      }
      return newGrid;
    });
  };

  // --- Pattern operations ---
  const shiftLeft = () => {
    setGrid(prev => {
      const newGrid = {};
      Object.entries(prev).forEach(([step, notes]) => {
        const newStep = (parseInt(step) - 1 + steps) % steps;
        newGrid[newStep] = notes;
      });
      return newGrid;
    });
  };

  const shiftRight = () => {
    setGrid(prev => {
      const newGrid = {};
      Object.entries(prev).forEach(([step, notes]) => {
        const newStep = (parseInt(step) + 1) % steps;
        newGrid[newStep] = notes;
      });
      return newGrid;
    });
  };

  const reversePattern = () => {
    setGrid(prev => {
      const newGrid = {};
      Object.entries(prev).forEach(([step, notes]) => {
        newGrid[steps - 1 - parseInt(step)] = notes;
      });
      return newGrid;
    });
  };

  // Helper: shift all notes in grid by semitones and auto-fit view
  const shiftAllNotes = (semitones) => {
    const newGrid = {};
    Object.entries(grid).forEach(([step, notes]) => {
      const newNotes = {};
      Object.entries(notes).forEach(([noteKey, vel]) => {
        const shifted = shiftNoteKey(noteKey, semitones);
        if (shifted) newNotes[shifted] = vel;
      });
      if (Object.keys(newNotes).length > 0) newGrid[step] = newNotes;
    });
    setGrid(newGrid);
    scrollToNotes(newGrid);
  };

  const transposeUp = () => shiftAllNotes(1);
  const transposeDown = () => shiftAllNotes(-1);
  const octaveUp = () => shiftAllNotes(12);
  const octaveDown = () => shiftAllNotes(-12);

  const randomFill = () => {
    const density = randomDensity / 100;
    const notes = getVisibleNotes();
    if (notes.length === 0) return;

    const newGrid = {};
    // Start from a random note in the middle range
    let currentIndex = Math.floor(notes.length * 0.3 + Math.random() * notes.length * 0.4);

    for (let i = 0; i < steps; i++) {
      if (Math.random() < density) {
        // Melodic movement: mostly small steps (1-2), occasional leaps
        const leap = Math.random();
        let move;
        if (leap < 0.45) move = Math.random() < 0.5 ? -1 : 1;       // step
        else if (leap < 0.75) move = Math.random() < 0.5 ? -2 : 2;   // third
        else if (leap < 0.90) move = Math.random() < 0.5 ? -3 : 3;   // fourth
        else move = Math.floor(Math.random() * 7) - 3;                // larger leap

        currentIndex = Math.max(0, Math.min(notes.length - 1, currentIndex + move));
        const note = notes[currentIndex];

        // Velocity: beats 1 and 3 tend to be harder
        let vel;
        if (i % 4 === 0) vel = 3;
        else if (i % 4 === 2) vel = Math.random() < 0.6 ? 3 : 2;
        else vel = Math.random() < 0.3 ? 3 : 2;

        newGrid[i] = { [note.key]: vel };
      }
    }
    setGrid(newGrid);
  };

  const doublePattern = () => {
    setGrid(prev => {
      const newGrid = {};
      const halfLength = Math.floor(steps / 2);
      Object.entries(prev).forEach(([step, notes]) => {
        const s = parseInt(step);
        if (s < halfLength) {
          newGrid[s] = notes;
          newGrid[s + halfLength] = { ...notes };
        }
      });
      return newGrid;
    });
  };

  const clearAll = () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    setGrid({});
  };

  // Generate a melodic variation while preserving key/scale feel
  const generateVariation = () => {
    const visible = getVisibleNotes();
    const noteIndex = new Map(visible.map((n, i) => [n.key, i]));
    setGrid(prev => {
      const next = {};
      for (let step = 0; step < steps; step++) {
        const cell = prev[step];
        if (!cell || Math.random() < 0.12) continue;
        const entries = Object.entries(cell);
        const out = {};
        for (const [noteKey, vel] of entries) {
          const idx = noteIndex.get(noteKey);
          if (idx === undefined) {
            out[noteKey] = vel;
            continue;
          }
          const jump = Math.random() < 0.65 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2);
          const nextIdx = Math.max(0, Math.min(visible.length - 1, idx + jump));
          const targetNote = visible[nextIdx].key;
          const velJitter = Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) : 0;
          out[targetNote] = Math.min(3, Math.max(1, vel + velJitter));
        }
        if (Object.keys(out).length > 0) {
          next[step] = out;
        }
      }
      return next;
    });
  };

  // Helper: shift a note key by semitones
  function shiftNoteKey(noteKey, semitones) {
    const match = noteKey.match(/^([a-g]#?)(\d+)$/);
    if (!match) return null;
    const noteName = match[1];
    const octave = parseInt(match[2]);
    const noteIndex = CHROMATIC_NOTES.indexOf(noteName);
    if (noteIndex === -1) return null;

    const totalSemitones = noteIndex + octave * 12 + semitones;
    if (totalSemitones < 0 || totalSemitones > 127) return null;

    const newNoteIndex = ((totalSemitones % 12) + 12) % 12;
    const newOctave = Math.floor(totalSemitones / 12);
    if (newOctave < 0 || newOctave > 8) return null;

    return `${CHROMATIC_NOTES[newNoteIndex]}${newOctave}`;
  }

  // Load preset
  const loadPreset = (preset) => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    setSynth(preset.synth);
    setSynthVariation(0);
    const newGrid = JSON.parse(JSON.stringify(preset.grid));
    setGrid(newGrid);
    scrollToNotes(newGrid);
  };

  // Create track
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
      name: 'Melody',
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
        name: 'Melodic Pattern',
        startBar: 0,
        durationBars: 4,
        color,
        layers: [{
          id: generateId(),
          name: 'Melody',
          code,
          muted: false,
          solo: false,
          params: {},
        }],
      }],
    };

    addBuiltTrack(newTrack);

    setEditingClip(trackId, clipId);
    onClose();
  };

  // Copy code
  const copyCode = () => {
    navigator.clipboard.writeText(previewCode);
  };

  // Toggle preview
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

      const notePattern = generateNotePattern();
      if (notePattern) {
        const gainInfo = getGainInfo();
        const canUseVariation = supportsVariantSuffix(synth);
        const synthToken = synthVariation > 0 && canUseVariation ? `${synth}:${synthVariation}` : synth;
        const result = await startMelodicPreview(notePattern, synthToken, bpm, gainInfo);
        if (result.success) {
          setIsPreviewPlaying(true);
          setCurrentStep(0);
        }
      }
    }
  };

  // Update preview when grid/synth/tempo/steps change during playback
  useEffect(() => {
    if (!isPreviewPlaying) return;
    const notePattern = generateNotePattern();
    if (!notePattern) {
      // Grid became empty while previewing: stop instead of looping stale audio.
      stopPreviewPlayback();
      return;
    }
    const updatePreviewPattern = async () => {
      stopPreviewPlayback(false);
      const gainInfo = getGainInfo();
      const canUseVariation = supportsVariantSuffix(synth);
      const synthToken = synthVariation > 0 && canUseVariation ? `${synth}:${synthVariation}` : synth;
      const result = await startMelodicPreview(notePattern, synthToken, bpm, gainInfo);
      if (!result.success) {
        setIsPreviewPlaying(false);
      }
    };
    updatePreviewPattern();
  }, [grid, synth, synthVariation, bpm, steps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      stopPreviewPlayback(false);
    };
  }, [stopPreviewPlayback]);

  // Handle close
  const handleClose = () => {
    if (isPreviewPlaying) {
      stopPreviewPlayback();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-studio-800 to-studio-900 rounded-2xl shadow-panel border border-white/[0.06] animate-scale-in w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 pro-header bg-gradient-modal">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Melodic Sequencer</h2>
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
          {/* Steps */}
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

          {/* Synth */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <span className="text-xs text-gray-400">Synth:</span>
            <select
              value={synth}
              onChange={(e) => {
                setSynth(e.target.value);
                setSynthVariation(0);
              }}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
            >
              {SYNTH_CATEGORIES.map(cat => (
                <optgroup key={cat} label={cat}>
                  {SYNTHS.filter(s => s.cat === cat).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              value={synthVariation}
              onChange={(e) => setSynthVariation(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
              title={supportsVariantSuffix(synth) ? 'Sample variation' : 'This sample name does not safely support :variant syntax'}
              disabled={!supportsVariantSuffix(synth)}
            >
              {Array.from({
                length: supportsVariantSuffix(synth)
                  ? Math.max(1, SAMPLE_VARIANT_COUNTS[synth] || 1)
                  : 1,
              }, (_, i) => (
                <option key={i} value={i}>:{i}</option>
              ))}
            </select>
          </div>

          {/* Key */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <span className="text-xs text-gray-400">Key:</span>
            <select
              value={rootNote}
              onChange={(e) => setRootNote(e.target.value)}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
            >
              {CHROMATIC_NOTES.map((n, i) => (
                <option key={n} value={n}>{CHROMATIC_LABELS[i]}</option>
              ))}
            </select>
          </div>

          {/* Scale */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Scale:</span>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
            >
              {Object.entries(SCALE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Octave */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <span className="text-xs text-gray-400">Octave:</span>
            <button
              onClick={() => setBaseOctave(o => Math.max(1, o - 1))}
              className="w-5 h-5 bg-studio-600 rounded hover:bg-studio-500 flex items-center justify-center text-gray-300"
            >
              <ChevronDown size={12} />
            </button>
            <span className="text-xs text-white font-bold w-6 text-center">{baseOctave}-{baseOctave + octaveRange - 1}</span>
            <button
              onClick={() => setBaseOctave(o => Math.min(6, o + 1))}
              className="w-5 h-5 bg-studio-600 rounded hover:bg-studio-500 flex items-center justify-center text-gray-300"
            >
              <ChevronUp size={12} />
            </button>
          </div>

          {/* Preset */}
          <div className="flex items-center gap-2 border-l border-studio-600 pl-4">
            <RotateCcw size={14} className="text-gray-400" />
            <select
              onChange={(e) => {
                const preset = PRESETS.find(p => p.name === e.target.value);
                if (preset) loadPreset(preset);
              }}
              className="px-2 py-1 text-xs bg-studio-600 border border-studio-500 rounded text-white"
              defaultValue=""
            >
              <option value="" disabled>Preset...</option>
              {PRESETS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pattern operations toolbar */}
        <div className="flex items-center gap-1 px-4 py-1.5 bg-studio-750 border-b border-white/[0.04] flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Pattern:</span>
          <button onClick={shiftLeft} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Shift Left">
            <ChevronLeft size={11} /> Shift L
          </button>
          <button onClick={shiftRight} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Shift Right">
            Shift R <ChevronRight size={11} />
          </button>
          <button onClick={reversePattern} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500" title="Reverse">
            &#8596; Reverse
          </button>

          <div className="w-px h-4 bg-studio-600 mx-1" />

          <button onClick={transposeUp} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Transpose Up (semitone)">
            <ArrowUp size={11} /> Semi
          </button>
          <button onClick={transposeDown} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Transpose Down (semitone)">
            <ArrowDown size={11} /> Semi
          </button>
          <button onClick={octaveUp} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Octave Up">
            <ArrowUp size={11} /> Oct
          </button>
          <button onClick={octaveDown} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500 flex items-center gap-1" title="Octave Down">
            <ArrowDown size={11} /> Oct
          </button>

          <div className="w-px h-4 bg-studio-600 mx-1" />

          <button onClick={doublePattern} className="px-2 py-0.5 text-xs bg-studio-600 text-gray-300 rounded hover:bg-studio-500" title="Copy first half to second half">
            Double
          </button>
          <button onClick={generateVariation} className="px-2 py-0.5 text-xs bg-indigo-600/50 text-indigo-100 rounded hover:bg-indigo-600" title="Generate melodic variation">
            Variation
          </button>

          <div className="w-px h-4 bg-studio-600 mx-1" />

          <span className="text-xs text-gray-500">Density:</span>
          <input
            type="range"
            min={20}
            max={90}
            value={randomDensity}
            onChange={(e) => setRandomDensity(Number(e.target.value))}
            className="w-14 h-1 accent-purple-400"
          />
          <span className="text-xs text-purple-400 w-6">{randomDensity}%</span>
          <button onClick={randomFill} className="px-2 py-0.5 text-xs bg-purple-600/50 text-purple-200 rounded hover:bg-purple-600 flex items-center gap-1" title="Random Fill (in-scale)">
            <Shuffle size={11} /> Random
          </button>
        </div>

        {/* Piano Roll Grid */}
        <div className="flex-1 overflow-auto" ref={gridRef}>
          <div className="min-w-max p-4">
            {/* Step numbers header */}
            <div className="flex mb-1">
              <div className="w-16 flex-shrink-0" />
              <div className="flex">
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

            {/* Note rows (high to low) */}
            {displayNotes.map((note) => {
              const isBlack = BLACK_KEYS.has(note.name);
              const label = `${note.name.toUpperCase()}${note.octave}`;

              return (
                <div key={note.key} className="flex items-center">
                  {/* Piano key label */}
                  <div
                    className={`w-16 flex-shrink-0 flex items-center justify-end pr-2 h-7 ${
                      isBlack
                        ? 'bg-gradient-to-b from-studio-950 to-studio-900 text-gray-400'
                        : 'bg-gradient-to-b from-studio-800 to-studio-750 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-4 rounded-sm"
                        style={{ backgroundColor: note.color }}
                      />
                      <span className="text-xs font-mono">{label}</span>
                    </div>
                  </div>

                  {/* Step cells for this note */}
                  <div className="flex">
                    {Array.from({ length: steps }, (_, stepIndex) => {
                      const stepNotes = grid[stepIndex];
                      const vel = stepNotes?.[note.key] || 0;
                      const isBeat = stepIndex % 4 === 0;
                      const isCurrentCol = currentStep === stepIndex && isPreviewPlaying;
                      const hasBeatGap = stepIndex > 0 && stepIndex % 4 === 0;

                      return (
                        <button
                          key={stepIndex}
                          onClick={() => toggleCell(stepIndex, note.key)}
                          className={`w-7 h-7 transition-all relative flex items-center justify-center border-b border-r ${
                            isBlack ? 'border-studio-900/50' : 'border-studio-700/50'
                          } ${
                            vel > 0
                              ? 'shadow-inner'
                              : isCurrentCol
                              ? isBlack ? 'bg-white/10' : 'bg-white/5'
                              : isBeat
                              ? isBlack ? 'bg-studio-700 hover:bg-studio-600' : 'bg-studio-650 hover:bg-studio-600'
                              : isBlack ? 'bg-studio-800 hover:bg-studio-700' : 'bg-studio-750 hover:bg-studio-700'
                          } ${isCurrentCol && vel === 0 ? 'ring-1 ring-inset ring-accent-primary/30' : ''} ${
                            hasBeatGap ? 'ml-1.5' : ''
                          }`}
                          style={vel > 0 ? {
                            backgroundColor: hexToRgba(note.color, [0, 0.45, 0.70, 1.0][vel]),
                            boxShadow: vel === 3 ? `0 0 10px ${note.color}50` : undefined,
                          } : undefined}
                        >
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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
