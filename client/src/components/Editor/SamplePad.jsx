import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { SAMPLES_BY_CATEGORY, SAMPLE_NAMES } from '../../data/samples';

// Operators with detailed explanations
const OPERATORS = [
  {
    symbol: '*',
    label: 'x N',
    title: 'Multiplicar / Repetir',
    desc: 'Repite el sonido N veces en el mismo tiempo. Mas rapido.',
    example: 'bd*4',
    result: 'Suena: bd bd bd bd (4 kicks en 1 ciclo)',
  },
  {
    symbol: '/',
    label: '/ N',
    title: 'Dividir / Ralentizar',
    desc: 'El sonido ocupa N ciclos. Mas lento.',
    example: 'bd/2',
    result: 'El kick suena cada 2 ciclos (la mitad de velocidad)',
  },
  {
    symbol: ' ',
    label: 'espacio',
    title: 'Secuencia',
    desc: 'Los sonidos van uno despues del otro.',
    example: 'bd sd hh',
    result: 'Primero kick, luego snare, luego hi-hat',
  },
  {
    symbol: ',',
    label: ',',
    title: 'Paralelo / Juntos',
    desc: 'Los sonidos suenan AL MISMO TIEMPO (capas).',
    example: 'bd, hh*4',
    result: 'Kick Y hi-hats suenan juntos simultaneamente',
  },
  {
    symbol: '~',
    label: '~',
    title: 'Silencio / Pausa',
    desc: 'Un espacio vacio donde no suena nada.',
    example: 'bd ~ sd ~',
    result: 'kick, silencio, snare, silencio',
  },
  {
    symbol: '[]',
    label: '[ ]',
    title: 'Agrupar',
    desc: 'Agrupa sonidos para que ocupen UN solo tiempo.',
    example: '[bd sd] hh',
    result: 'bd+sd rapidos en tiempo 1, hh en tiempo 2',
  },
  {
    symbol: '<>',
    label: '< >',
    title: 'Alternar por Ciclo',
    desc: 'Cada ciclo usa un elemento diferente. Rota.',
    example: '<bd sd>',
    result: 'Ciclo 1: bd, Ciclo 2: sd, Ciclo 3: bd...',
  },
  {
    symbol: '?',
    label: '?',
    title: 'Aleatorio 50%',
    desc: 'El sonido tiene 50% probabilidad de sonar.',
    example: 'hh?',
    result: 'A veces suena el hi-hat, a veces no',
  },
  {
    symbol: '|',
    label: '|',
    title: 'Elegir Uno',
    desc: 'Elige aleatoriamente UNO de los sonidos.',
    example: 'bd|sd|hh',
    result: 'Cada vez suena kick O snare O hi-hat',
  },
  {
    symbol: '@',
    label: '@N',
    title: 'Extender Duracion',
    desc: 'El sonido ocupa N espacios (sin repetir).',
    example: 'bd@2 sd',
    result: 'Kick largo (2 tiempos), snare (1 tiempo)',
  },
  {
    symbol: '!',
    label: '!N',
    title: 'Replicar',
    desc: 'Repite N veces SIN acelerar (ocupa mas espacio).',
    example: 'bd!3',
    result: 'bd bd bd (3 kicks, cada uno ocupa su tiempo)',
  },
  {
    symbol: '()',
    label: '(n,k)',
    title: 'Ritmo Euclidiano',
    desc: 'Distribuye N golpes en K pasos matematicamente.',
    example: 'bd(3,8)',
    result: '3 kicks distribuidos en 8 pasos: X..X..X.',
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

export default function SamplePad() {
  const { currentPattern, selectedLayerIndex, updateLayerCode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(true);

  const currentLayer = currentPattern.layers?.[selectedLayerIndex];
  const currentCode = currentLayer?.code || '';

  const insertSample = (sample) => {
    const newCode = currentCode ? `${currentCode} ${sample}` : sample;
    updateLayerCode(selectedLayerIndex, newCode);
  };

  const insertOperator = (op) => {
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
    updateLayerCode(selectedLayerIndex, newCode);
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
              {totalSamples} disponibles
            </span>
          </div>
        </div>
        {/* Search input */}
        <input
          type="text"
          placeholder="Buscar sample..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-studio-800 border border-studio-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Search results */}
        {filteredSamples ? (
          <div>
            <h4 className="text-xs text-gray-500 uppercase mb-2">
              Resultados ({filteredSamples.length})
            </h4>
            {filteredSamples.length === 0 ? (
              <p className="text-xs text-gray-600">No encontrado</p>
            ) : (
              <div className="grid grid-cols-3 gap-1 max-h-96 overflow-y-auto">
                {filteredSamples.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => insertSample(sample)}
                    className="px-2 py-1.5 text-xs bg-studio-600 hover:bg-accent-tertiary hover:text-black rounded transition-colors truncate text-left"
                  >
                    {sample}
                  </button>
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
                  {samples.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => insertSample(sample.name)}
                      title={sample.desc}
                      className="px-2 py-1.5 text-xs bg-studio-600 hover:bg-accent-tertiary hover:text-black rounded transition-colors truncate text-left"
                    >
                      {sample.name}
                    </button>
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
                  <button
                    key={sample}
                    onClick={() => insertSample(sample)}
                    className="px-1 py-1 text-[10px] bg-studio-600 hover:bg-accent-tertiary hover:text-black rounded transition-colors truncate text-left"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
