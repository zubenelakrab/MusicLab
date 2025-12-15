import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronRight, X, Volume2 } from 'lucide-react';
import { useStore } from '../../store';
import { SAMPLES_BY_CATEGORY, SAMPLE_NAMES, SAMPLE_VARIANT_COUNTS } from '../../data/samples';
import { previewSample } from '../../strudel/engine';

// Operators with detailed explanations
const OPERATORS = [
  {
    symbol: '*',
    label: 'x N',
    title: 'Multiply / Repeat',
    desc: 'Repeats the sound N times in the same time. Faster.',
    example: 'bd*4',
    result: 'Sounds: bd bd bd bd (4 kicks in 1 cycle)',
  },
  {
    symbol: '/',
    label: '/ N',
    title: 'Divide / Slow Down',
    desc: 'The sound spans N cycles. Slower.',
    example: 'bd/2',
    result: 'The kick sounds every 2 cycles (half speed)',
  },
  {
    symbol: ' ',
    label: 'space',
    title: 'Sequence',
    desc: 'Sounds play one after another.',
    example: 'bd sd hh',
    result: 'First kick, then snare, then hi-hat',
  },
  {
    symbol: ',',
    label: ',',
    title: 'Parallel / Together',
    desc: 'Sounds play AT THE SAME TIME (layers).',
    example: 'bd, hh*4',
    result: 'Kick AND hi-hats play together simultaneously',
  },
  {
    symbol: '~',
    label: '~',
    title: 'Rest / Pause',
    desc: 'An empty space where nothing plays.',
    example: 'bd ~ sd ~',
    result: 'kick, rest, snare, rest',
  },
  {
    symbol: '[]',
    label: '[ ]',
    title: 'Group',
    desc: 'Groups sounds to occupy ONE single beat.',
    example: '[bd sd] hh',
    result: 'bd+sd fast in beat 1, hh in beat 2',
  },
  {
    symbol: '<>',
    label: '< >',
    title: 'Alternate per Cycle',
    desc: 'Each cycle uses a different element. Rotates.',
    example: '<bd sd>',
    result: 'Cycle 1: bd, Cycle 2: sd, Cycle 3: bd...',
  },
  {
    symbol: '?',
    label: '?',
    title: 'Random 50%',
    desc: 'The sound has 50% probability of playing.',
    example: 'hh?',
    result: 'Sometimes the hi-hat plays, sometimes not',
  },
  {
    symbol: '|',
    label: '|',
    title: 'Choose One',
    desc: 'Randomly chooses ONE of the sounds.',
    example: 'bd|sd|hh',
    result: 'Each time plays kick OR snare OR hi-hat',
  },
  {
    symbol: '@',
    label: '@N',
    title: 'Extend Duration',
    desc: 'The sound occupies N spaces (without repeating).',
    example: 'bd@2 sd',
    result: 'Long kick (2 beats), snare (1 beat)',
  },
  {
    symbol: '!',
    label: '!N',
    title: 'Replicate',
    desc: 'Repeats N times WITHOUT speeding up (takes more space).',
    example: 'bd!3',
    result: 'bd bd bd (3 kicks, each takes its own time)',
  },
  {
    symbol: '()',
    label: '(n,k)',
    title: 'Euclidean Rhythm',
    desc: 'Distributes N hits across K steps mathematically.',
    example: 'bd(3,8)',
    result: '3 kicks distributed in 8 steps: X..X..X.',
  },
];

// Tooltip component using portal
function OperatorTooltip({ op, children }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [show]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && createPortal(
        <div
          className="fixed z-[9999] w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl transform -translate-x-1/2 -translate-y-full"
          style={{ top: position.top, left: position.left }}
        >
          <div className="text-sm font-bold text-emerald-400 mb-1">
            {op.title}
          </div>
          <div className="text-xs text-gray-300 mb-2">
            {op.desc}
          </div>
          <div className="bg-gray-800 rounded p-2 mb-2">
            <code className="text-sm text-yellow-300">{op.example}</code>
          </div>
          <div className="text-xs text-gray-400">
            → {op.result}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Variant popup component
function VariantPopup({ sample, position, onClose, onInsert }) {
  const variantCount = SAMPLE_VARIANT_COUNTS[sample] || 1;
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isPlaying, setIsPlaying] = useState(null);
  const popupRef = useRef(null);

  const handlePreview = async (variant, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedVariant(variant);
    setIsPlaying(variant);
    await previewSample(sample, variant);
    setTimeout(() => setIsPlaying(null), 400);
  };

  const handleInsert = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const code = selectedVariant > 0 ? `${sample}:${selectedVariant}` : sample;
    onInsert(code);
    onClose();
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Generate variant array
  const variants = Array.from({ length: variantCount }, (_, i) => i);

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9998] bg-studio-800 border border-studio-500 rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: Math.min(position.top, window.innerHeight - 250),
        left: Math.min(position.left, window.innerWidth - 280),
        minWidth: '240px',
        maxWidth: '300px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-studio-700 border-b border-studio-600">
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-accent-primary" />
          <span className="text-sm font-medium text-white">{sample}</span>
          <span className="text-xs text-gray-400">({variantCount})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Variant grid */}
      <div className="p-2 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-6 gap-1">
          {variants.map((variant) => (
            <button
              key={variant}
              onClick={(e) => handlePreview(variant, e)}
              className={`
                px-1.5 py-1.5 text-xs rounded transition-all
                ${isPlaying === variant
                  ? 'bg-accent-primary text-black scale-110'
                  : selectedVariant === variant
                    ? 'bg-blue-600 text-white'
                    : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
                }
              `}
            >
              :{variant}
            </button>
          ))}
        </div>
      </div>

      {/* Insert button */}
      <div className="px-3 py-2 bg-studio-700 border-t border-studio-600">
        <button
          onClick={handleInsert}
          className="w-full px-3 py-1.5 text-sm bg-accent-primary text-black rounded hover:bg-emerald-400 flex items-center justify-center gap-1.5 font-medium"
        >
          <ChevronRight size={14} />
          Insertar {sample}:{selectedVariant}
        </button>
      </div>
    </div>,
    document.body
  );
}

// Sample button with variant support
function SampleButton({ sample, desc, onInsert, onOpenVariants }) {
  const variantCount = SAMPLE_VARIANT_COUNTS[sample] || 1;
  const hasVariants = variantCount > 1;
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = (e) => {
    if (hasVariants) {
      // Open variant popup
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenVariants(sample, { top: rect.bottom + 4, left: rect.left });
    } else {
      // Insert directly
      onInsert(sample);
    }
  };

  const handleRightClick = async (e) => {
    e.preventDefault();
    setIsPlaying(true);
    await previewSample(sample, 0);
    setTimeout(() => setIsPlaying(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={desc || (hasVariants ? `${sample} (${variantCount} variantes)` : sample)}
      className={`
        relative px-2 py-2 text-xs rounded transition-all truncate text-left
        ${isPlaying
          ? 'bg-accent-primary text-black scale-105'
          : 'bg-studio-600 hover:bg-accent-tertiary hover:text-black'
        }
      `}
    >
      {sample}
      {hasVariants && (
        <span className="absolute -top-1 right-0.5 text-[9px] text-blue-400 font-medium">
          +{variantCount}
        </span>
      )}
    </button>
  );
}

export default function SamplePad() {
  const { editingClip, arrangement, updateEditingClipCode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [variantPopup, setVariantPopup] = useState(null); // { sample, position }

  // Get current clip code
  const getCurrentCode = () => {
    if (!editingClip) return '';
    const track = arrangement.tracks.find(t => t.id === editingClip.trackId);
    if (!track) return '';
    const clip = track.clips.find(c => c.id === editingClip.clipId);
    if (!clip || !clip.layers || !clip.layers[0]) return '';
    return clip.layers[0].code || '';
  };

  const currentCode = getCurrentCode();
  const hasEditingClip = !!editingClip;

  const insertSample = (sample) => {
    if (!hasEditingClip) return;
    const newCode = currentCode ? `${currentCode} ${sample}` : sample;
    updateEditingClipCode(newCode);
  };

  const openVariants = (sample, position) => {
    setVariantPopup({ sample, position });
  };

  const closeVariants = () => {
    setVariantPopup(null);
  };

  const insertOperator = (op) => {
    if (!hasEditingClip) return;
    let newCode;
    if (op === '[]') {
      newCode = `[${currentCode}]`;
    } else if (op === '<>') {
      newCode = `<${currentCode}>`;
    } else if (op === '()') {
      newCode = `${currentCode}(3,8)`;
    } else if (op === '*' || op === '/' || op === '@' || op === '!') {
      newCode = `${currentCode}${op}2`;
    } else {
      newCode = `${currentCode}${op}`;
    }
    updateEditingClipCode(newCode);
  };

  
  // Filter samples based on search
  const filteredSamples = searchTerm.trim()
    ? SAMPLE_NAMES.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const categories = Object.entries(SAMPLES_BY_CATEGORY);
  const totalSamples = SAMPLE_NAMES.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 bg-studio-700 border-b border-studio-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Samples</span>
            <span className="text-xs text-gray-500">
              {hasEditingClip ? 'Click to add to clip' : 'Select a clip first'}
            </span>
          </div>
        </div>
        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search sample..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-sm bg-studio-800 border border-studio-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Search results */}
        {filteredSamples ? (
          <div>
            <h4 className="text-xs text-gray-500 uppercase mb-2">
              Results ({filteredSamples.length})
            </h4>
            {filteredSamples.length === 0 ? (
              <p className="text-xs text-gray-600">Not found</p>
            ) : (
              <div className="grid grid-cols-3 gap-1 max-h-96 overflow-y-auto">
                {filteredSamples.map((sample) => (
                  <SampleButton
                    key={sample}
                    sample={sample}
                    onInsert={insertSample}
                    onOpenVariants={openVariants}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Operators with tooltips */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">
                Operadores <span className="text-gray-600">(hover = info)</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {OPERATORS.map((op) => (
                  <OperatorTooltip key={op.symbol} op={op}>
                    <button
                      onClick={() => insertOperator(op.symbol)}
                      className="px-2 py-1 text-xs bg-studio-600 hover:bg-accent-primary hover:text-black rounded transition-colors"
                    >
                      {op.label}
                    </button>
                  </OperatorTooltip>
                ))}
              </div>
            </div>

            {/* All samples by category */}
            {categories.map(([category, samples]) => (
              <div key={category}>
                <h4 className="text-xs text-gray-500 uppercase mb-2">
                  {category} <span className="text-gray-600">({samples.length})</span>
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {samples.map((sampleObj) => (
                    <SampleButton
                      key={sampleObj.name}
                      sample={sampleObj.name}
                      desc={sampleObj.desc}
                      onInsert={insertSample}
                      onOpenVariants={openVariants}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Direct sample list - ALL samples alphabetically */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">
                Todos A-Z ({SAMPLE_NAMES.length})
              </h4>
              <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
                {SAMPLE_NAMES.sort().map((sample) => (
                  <SampleButton
                    key={sample}
                    sample={sample}
                    onInsert={insertSample}
                    onOpenVariants={openVariants}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Variant popup */}
      {variantPopup && (
        <VariantPopup
          sample={variantPopup.sample}
          position={variantPopup.position}
          onClose={closeVariants}
          onInsert={insertSample}
        />
      )}
    </div>
  );
}
