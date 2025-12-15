import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Check } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Basic',
    items: [
      { pattern: 'bd', desc: 'Single sound (kick)' },
      { pattern: 'bd sd', desc: 'Sequence: kick, snare' },
      { pattern: 'bd sd hh cp', desc: 'Sequence of 4 sounds' },
    ]
  },
  {
    title: 'Repetition (*)',
    items: [
      { pattern: 'bd*4', desc: 'Kick 4 times per cycle' },
      { pattern: 'hh*8', desc: 'Hi-hat 8 times (fast)' },
      { pattern: '[bd sd]*2', desc: 'Group repeated 2 times' },
      { pattern: 'bd*2 sd*2', desc: '2 kicks, then 2 snares' },
    ]
  },
  {
    title: 'Division (/)',
    items: [
      { pattern: 'bd/2', desc: 'Kick every 2 cycles' },
      { pattern: '[bd sd hh]/2', desc: 'Slow sequence (2 cycles)' },
      { pattern: 'bd sd/2', desc: 'Normal kick, slow snare' },
    ]
  },
  {
    title: 'Grouping [ ]',
    items: [
      { pattern: '[bd sd] hh', desc: 'Fast group + hi-hat' },
      { pattern: '[bd sd hh] cp', desc: '3 fast + clap' },
      { pattern: '[[bd bd] sd] hh', desc: 'Nested groups' },
      { pattern: 'bd [sd sd] bd sd', desc: 'Internal subdivision' },
    ]
  },
  {
    title: 'Parallel (,) - Polyrhythm',
    items: [
      { pattern: 'bd, hh*2', desc: 'Kick AND hi-hat together' },
      { pattern: '[bd sd, hh*4]', desc: 'Beat + hi-hats' },
      { pattern: 'bd*3, hh*4', desc: 'Polyrhythm 3 against 4' },
      { pattern: 'bd, sd, hh', desc: '3 simultaneous layers' },
    ]
  },
  {
    title: 'Alternation < >',
    items: [
      { pattern: '<bd sd>', desc: 'Alternates each cycle' },
      { pattern: '<bd sd hh>', desc: 'Rotates between 3 (cycle 1→2→3)' },
      { pattern: 'bd <sd cp>', desc: 'Fixed kick, snare/clap alternates' },
      { pattern: '<bd*2 bd*4>', desc: 'Alternates different patterns' },
    ]
  },
  {
    title: 'Rests (~)',
    items: [
      { pattern: 'bd ~ sd ~', desc: 'Rests between hits' },
      { pattern: '~ sd', desc: 'Rest, then snare' },
      { pattern: 'bd ~ ~ sd', desc: 'Kick...long pause...snare' },
      { pattern: '[bd ~] [~ sd]', desc: 'Offbeat pattern' },
    ]
  },
  {
    title: 'Random (? |)',
    items: [
      { pattern: 'hh?', desc: 'Hi-hat 50% probability' },
      { pattern: 'bd sd? hh cp?', desc: 'Some random' },
      { pattern: 'bd | sd | hh', desc: 'Choose one randomly' },
      { pattern: '[bd | cp] sd', desc: 'Random kick or clap' },
    ]
  },
  {
    title: 'Elongation (@)',
    items: [
      { pattern: 'bd@2 sd', desc: 'Kick lasts 2 beats' },
      { pattern: 'bd@3 sd', desc: 'Kick lasts 3/4 of cycle' },
      { pattern: 'bd sd@2 hh', desc: 'Extended snare' },
      { pattern: 'arpy@4', desc: 'Long sample (4 beats)' },
    ]
  },
  {
    title: 'Replication (!)',
    items: [
      { pattern: 'bd!3 sd', desc: 'bd bd bd sd (no speedup)' },
      { pattern: 'hh!4', desc: '4 hi-hats same timing' },
      { pattern: 'bd sd!2 hh', desc: 'Duplicated sd no speedup' },
    ]
  },
  {
    title: 'Euclidean Rhythms',
    items: [
      { pattern: 'bd(3,8)', desc: '3 hits in 8 steps' },
      { pattern: 'bd(5,8)', desc: '5 hits in 8 (cinquillo)' },
      { pattern: 'hh(7,16)', desc: '7 in 16 (complex)' },
      { pattern: 'bd(3,8) sd(2,8)', desc: 'Two euclidean rhythms' },
      { pattern: '[bd(3,8), hh(5,8)]', desc: 'Euclidean polyrhythm' },
    ]
  },
  {
    title: 'House / Techno',
    items: [
      { pattern: '[bd, hh*4, ~ sd ~ sd]', desc: 'Classic house 4/4' },
      { pattern: '[bd, hh*8, ~ ~ sd ~]', desc: 'Basic techno' },
      { pattern: '[bd*2, hh*4, [~ sd]*2]', desc: 'House with double kick' },
      { pattern: '[bd, ho*2, ~ sd]', desc: 'House with open hat' },
      { pattern: 'bd [~ bd] sd [bd ~]', desc: 'Offbeat house' },
    ]
  },
  {
    title: 'Breakbeat / Jungle',
    items: [
      { pattern: 'bd [~ bd] [sd ~] bd', desc: 'Basic breakbeat' },
      { pattern: '[bd ~ sd bd] [~ sd ~ bd]', desc: 'Simplified amen break' },
      { pattern: 'bd [~ [bd bd]] sd [bd ~]', desc: 'Jungle pattern' },
      { pattern: '[bd, hh*8] [sd, hh*8]', desc: 'Break with fast hats' },
    ]
  },
  {
    title: 'Funk / Hip-Hop',
    items: [
      { pattern: 'bd ~ [~ bd] sd', desc: 'Basic boom bap' },
      { pattern: 'bd ~ sd [~ bd]', desc: 'Hip-hop groove' },
      { pattern: '[bd ~ ~ bd] [~ sd ~ ~]', desc: 'Syncopated funk' },
      { pattern: 'bd*2 [~ sd] bd [sd ~]', desc: 'Funk groove' },
    ]
  },
  {
    title: 'Experimental',
    items: [
      { pattern: 'bd*<3 4 5>', desc: 'Changing multiplier' },
      { pattern: '[bd sd]/<2 3>', desc: 'Alternating division' },
      { pattern: '<[bd sd] [bd bd sd]>', desc: 'Alternating patterns' },
      { pattern: 'bd(3,8), sd(5,8,2)', desc: 'Offset euclideans' },
      { pattern: '[bd?, sd?, hh?]*4', desc: 'Probabilistic sequence' },
    ]
  },
  {
    title: 'Samples (use :n)',
    items: [
      { pattern: 'bd:0 bd:1 bd:3', desc: 'Specific kicks' },
      { pattern: 'sd:0 sd:1 sd:2', desc: 'Specific snares' },
      { pattern: 'arpy:0 arpy:1 arpy:2', desc: 'Arpeggio samples' },
      { pattern: 'bass:0 bass:1 bass:2', desc: 'Bass samples' },
      { pattern: 'tabla:0 tabla:1 tabla:2', desc: 'Tabla percussion' },
    ]
  },
];

export default function CheatSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyPattern = (pattern, index) => {
    navigator.clipboard.writeText(pattern);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1000);
  };

  return (
    <div className="border-t border-studio-600">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between bg-studio-700 hover:bg-studio-600 transition-colors"
      >
        <span className="text-sm text-gray-400 flex items-center gap-2">
          <BookOpen size={14} />
          Cheat Sheet
        </span>
        {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="max-h-96 overflow-y-auto bg-studio-800 p-3 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs text-accent-primary font-semibold uppercase mb-2">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item, idx) => {
                  const globalIdx = `${section.title}-${idx}`;
                  return (
                    <div
                      key={idx}
                      onClick={() => copyPattern(item.pattern, globalIdx)}
                      className="flex items-center justify-between p-2 bg-studio-700 rounded cursor-pointer hover:bg-studio-600 transition-colors group"
                    >
                      <code className="text-xs text-accent-tertiary font-mono">
                        {item.pattern}
                      </code>
                      <span className="text-xs text-gray-500 group-hover:text-gray-400 flex items-center gap-1">
                        {copiedIndex === globalIdx ? (
                          <>
                            <Check size={12} className="text-accent-primary" />
                            Copied
                          </>
                        ) : item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-studio-600">
            <p className="text-xs text-gray-500">
              Click any pattern to copy it to clipboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
