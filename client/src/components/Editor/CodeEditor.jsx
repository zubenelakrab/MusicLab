import { useEffect, useRef, useMemo } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { useStore } from '../../store';
import { useStrudel } from '../../hooks/useStrudel';
import { ALL_SAMPLES } from '../../data/samples';

// Build completions from samples data
const SAMPLE_COMPLETIONS = ALL_SAMPLES.map(s => ({
  label: s.name,
  type: 'keyword',
  detail: s.desc,
}));

// Pattern templates
const PATTERN_COMPLETIONS = [
  { label: 'bd sd bd sd', type: 'text', detail: 'Beat basico 4/4', apply: 'bd sd bd sd' },
  { label: 'bd*4', type: 'text', detail: '4 kicks por ciclo', apply: 'bd*4' },
  { label: 'hh*8', type: 'text', detail: 'Hi-hats rapidos', apply: 'hh*8' },
  { label: '[bd, hh*4, ~ sd ~ sd]', type: 'text', detail: 'House clasico', apply: '[bd, hh*4, ~ sd ~ sd]' },
  { label: 'bd(3,8)', type: 'text', detail: 'Euclidiano 3 en 8', apply: 'bd(3,8)' },
];

const COMPLETIONS = [...SAMPLE_COMPLETIONS, ...PATTERN_COMPLETIONS];

function strudelCompletions(context) {
  const word = context.matchBefore(/[\w]*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }
  return {
    from: word.from,
    options: COMPLETIONS.filter(c =>
      c.label.toLowerCase().startsWith(word.text.toLowerCase())
    ),
  };
}

export default function CodeEditor() {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const callbackRef = useRef(null);

  const {
    editingClip,
    arrangement,
    updateEditingClipCode,
  } = useStore();

  const { isPlaying } = useStrudel();

  // Get the current clip being edited
  const currentClipData = useMemo(() => {
    if (!editingClip) return null;
    const { trackId, clipId } = editingClip;
    const track = arrangement.tracks.find(t => t.id === trackId);
    if (!track) return null;
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return null;
    return { track, clip, code: clip.layers?.[0]?.code || '' };
  }, [editingClip, arrangement]);

  const currentCode = currentClipData?.code || '';
  const hasClip = !!currentClipData;

  // Keep callback ref updated
  callbackRef.current = (value) => {
    if (editingClip) {
      updateEditingClipCode(value);
    }
  };

  // Create editor once
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && callbackRef.current) {
        callbackRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        oneDark,
        updateListener,
        autocompletion({
          override: [strudelCompletions],
          activateOnTyping: true,
        }),
        keymap.of([
          { key: 'Tab', run: acceptCompletion },
        ]),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': {
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontSize: '16px',
            padding: '8px 0',
          },
          '.cm-line': { padding: '0 8px' },
          '.cm-tooltip.cm-tooltip-autocomplete': {
            backgroundColor: '#1a1a1a',
            border: '1px solid #3a3a3a',
          },
          '.cm-tooltip-autocomplete ul li': {
            padding: '4px 8px',
          },
          '.cm-tooltip-autocomplete ul li[aria-selected]': {
            backgroundColor: '#00d4aa',
            color: 'black',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync code when editing clip changes
  useEffect(() => {
    if (viewRef.current && hasClip) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== currentCode) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentDoc.length,
            insert: currentCode,
          },
        });
      }
    }
  }, [currentCode, editingClip?.clipId, hasClip]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-studio-700 border-b border-studio-600">
        {hasClip ? (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: currentClipData.track.color }}
            />
            <span className="text-sm text-gray-400">
              <span className="text-white">{currentClipData.track.name}</span>
              <span className="mx-1">/</span>
              <span className="text-accent-primary">{currentClipData.clip.name}</span>
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Editor</span>
        )}
        <span className="text-xs text-gray-500">
          {isPlaying ? 'En vivo' : 'Tab para autocompletar'}
        </span>
      </div>

      {/* Editor container - always mounted */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={editorRef}
          className="absolute inset-0"
          style={{ display: hasClip ? 'block' : 'none' }}
        />

        {/* Placeholder when no clip selected */}
        {!hasClip && (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-900">
            <div className="text-center text-gray-500">
              <p className="text-sm">Selecciona un clip para editar</p>
              <p className="text-xs mt-1">Click en un clip del timeline</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
