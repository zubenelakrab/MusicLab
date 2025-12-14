import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Básico',
    items: [
      { pattern: 'bd', desc: 'Un solo sonido (kick)' },
      { pattern: 'bd sd', desc: 'Secuencia: kick, snare' },
      { pattern: 'bd sd hh cp', desc: 'Secuencia de 4 sonidos' },
    ]
  },
  {
    title: 'Repetición (*)',
    items: [
      { pattern: 'bd*4', desc: 'Kick 4 veces por ciclo' },
      { pattern: 'hh*8', desc: 'Hi-hat 8 veces (rápido)' },
      { pattern: '[bd sd]*2', desc: 'Grupo repetido 2 veces' },
      { pattern: 'bd*2 sd*2', desc: '2 kicks, luego 2 snares' },
    ]
  },
  {
    title: 'División (/)',
    items: [
      { pattern: 'bd/2', desc: 'Kick cada 2 ciclos' },
      { pattern: '[bd sd hh]/2', desc: 'Secuencia lenta (2 ciclos)' },
      { pattern: 'bd sd/2', desc: 'Kick normal, snare lento' },
    ]
  },
  {
    title: 'Agrupación [ ]',
    items: [
      { pattern: '[bd sd] hh', desc: 'Grupo rápido + hi-hat' },
      { pattern: '[bd sd hh] cp', desc: '3 rápidos + clap' },
      { pattern: '[[bd bd] sd] hh', desc: 'Grupos anidados' },
      { pattern: 'bd [sd sd] bd sd', desc: 'Subdivisión interna' },
    ]
  },
  {
    title: 'Paralelo (,) - Poliritmo',
    items: [
      { pattern: 'bd, hh*2', desc: 'Kick Y hi-hat juntos' },
      { pattern: '[bd sd, hh*4]', desc: 'Beat + hi-hats' },
      { pattern: 'bd*3, hh*4', desc: 'Poliritmo 3 contra 4' },
      { pattern: 'bd, sd, hh', desc: '3 capas simultáneas' },
    ]
  },
  {
    title: 'Alternancia < >',
    items: [
      { pattern: '<bd sd>', desc: 'Alterna cada ciclo' },
      { pattern: '<bd sd hh>', desc: 'Rota entre 3 (ciclo 1→2→3)' },
      { pattern: 'bd <sd cp>', desc: 'Kick fijo, snare/clap alterna' },
      { pattern: '<bd*2 bd*4>', desc: 'Alterna patrones diferentes' },
    ]
  },
  {
    title: 'Silencios (~)',
    items: [
      { pattern: 'bd ~ sd ~', desc: 'Silencios entre golpes' },
      { pattern: '~ sd', desc: 'Silencio, luego snare' },
      { pattern: 'bd ~ ~ sd', desc: 'Kick...pausa larga...snare' },
      { pattern: '[bd ~] [~ sd]', desc: 'Offbeat pattern' },
    ]
  },
  {
    title: 'Aleatorio (? |)',
    items: [
      { pattern: 'hh?', desc: 'Hi-hat 50% probabilidad' },
      { pattern: 'bd sd? hh cp?', desc: 'Algunos aleatorios' },
      { pattern: 'bd | sd | hh', desc: 'Elige uno al azar' },
      { pattern: '[bd | cp] sd', desc: 'Kick o clap aleatorio' },
    ]
  },
  {
    title: 'Elongación (@)',
    items: [
      { pattern: 'bd@2 sd', desc: 'Kick dura 2 tiempos' },
      { pattern: 'bd@3 sd', desc: 'Kick dura 3/4 del ciclo' },
      { pattern: 'bd sd@2 hh', desc: 'Snare extendido' },
      { pattern: 'arpy@4', desc: 'Sample largo (4 tiempos)' },
    ]
  },
  {
    title: 'Replicación (!)',
    items: [
      { pattern: 'bd!3 sd', desc: 'bd bd bd sd (sin acelerar)' },
      { pattern: 'hh!4', desc: '4 hi-hats mismo tiempo' },
      { pattern: 'bd sd!2 hh', desc: 'sd duplicado sin acelerar' },
    ]
  },
  {
    title: 'Ritmos Euclidianos',
    items: [
      { pattern: 'bd(3,8)', desc: '3 golpes en 8 pasos' },
      { pattern: 'bd(5,8)', desc: '5 golpes en 8 (cinquillo)' },
      { pattern: 'hh(7,16)', desc: '7 en 16 (complejo)' },
      { pattern: 'bd(3,8) sd(2,8)', desc: 'Dos ritmos euclidianos' },
      { pattern: '[bd(3,8), hh(5,8)]', desc: 'Poliritmo euclidiano' },
    ]
  },
  {
    title: 'House / Techno',
    items: [
      { pattern: '[bd, hh*4, ~ sd ~ sd]', desc: 'House clásico 4/4' },
      { pattern: '[bd, hh*8, ~ ~ sd ~]', desc: 'Techno básico' },
      { pattern: '[bd*2, hh*4, [~ sd]*2]', desc: 'House con kick doble' },
      { pattern: '[bd, oh*2, ~ sd]', desc: 'House con open hat' },
      { pattern: 'bd [~ bd] sd [bd ~]', desc: 'Offbeat house' },
    ]
  },
  {
    title: 'Breakbeat / Jungle',
    items: [
      { pattern: 'bd [~ bd] [sd ~] bd', desc: 'Breakbeat básico' },
      { pattern: '[bd ~ sd bd] [~ sd ~ bd]', desc: 'Amen break simplificado' },
      { pattern: 'bd [~ [bd bd]] sd [bd ~]', desc: 'Jungle pattern' },
      { pattern: '[bd, hh*8] [sd, hh*8]', desc: 'Break con hats rápidos' },
    ]
  },
  {
    title: 'Funk / Hip-Hop',
    items: [
      { pattern: 'bd ~ [~ bd] sd', desc: 'Boom bap básico' },
      { pattern: 'bd ~ sd [~ bd]', desc: 'Hip-hop groove' },
      { pattern: '[bd ~ ~ bd] [~ sd ~ ~]', desc: 'Funk sincopado' },
      { pattern: 'bd*2 [~ sd] bd [sd ~]', desc: 'Funk groove' },
    ]
  },
  {
    title: 'Experimentales',
    items: [
      { pattern: 'bd*<3 4 5>', desc: 'Multiplicador cambiante' },
      { pattern: '[bd sd]/<2 3>', desc: 'División alternante' },
      { pattern: '<[bd sd] [bd bd sd]>', desc: 'Patrones alternantes' },
      { pattern: 'bd(3,8), sd(5,8,2)', desc: 'Euclidianos desfasados' },
      { pattern: '[bd?, sd?, hh?]*4', desc: 'Secuencia probabilística' },
    ]
  },
  {
    title: 'Samples (usa :n)',
    items: [
      { pattern: 'bd:0 bd:1 bd:3', desc: 'Kicks específicos' },
      { pattern: 'sd:0 sd:1 sd:2', desc: 'Snares específicos' },
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
        <span className="text-sm text-gray-400">Cheat Sheet</span>
        <span className="text-gray-500">{isOpen ? '▼' : '▶'}</span>
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
                      <span className="text-xs text-gray-500 group-hover:text-gray-400">
                        {copiedIndex === globalIdx ? '✓ Copiado' : item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-studio-600">
            <p className="text-xs text-gray-500">
              Haz clic en cualquier patrón para copiarlo al portapapeles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
