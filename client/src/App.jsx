import { Suspense, lazy, useState } from 'react';
import { Sparkles, Grid3X3, Music, Layers, Sliders, Info } from 'lucide-react';
import Controls from './components/Transport/Controls';
import FileManager from './components/FileManager/FileManager';
import CodeEditor from './components/Editor/CodeEditor';
import SamplePad from './components/Editor/SamplePad';
import CheatSheet from './components/Editor/CheatSheet';
import PatternList from './components/PatternManager/PatternList';
import { ArrangementView } from './components/ArrangementView';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePersistence } from './hooks/usePersistence';

const Visualizer = lazy(() => import('./components/Visualizer/Visualizer'));
const StepSequencer = lazy(() => import('./components/StepSequencer/StepSequencer'));
const MelodicSequencer = lazy(() => import('./components/MelodicSequencer/MelodicSequencer'));
const SampleBrowser = lazy(() => import('./components/SampleBrowser/SampleBrowser'));
const EffectsRack = lazy(() => import('./components/EffectsRack/EffectsRack'));
const AboutCrackerModal = lazy(() => import('./components/About/AboutCrackerModal'));

function ModalFallback() {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-studio-950/70 backdrop-blur-sm">
      <div className="rounded-xl border border-studio-600 bg-studio-900 px-4 py-3 text-sm text-gray-300 shadow-panel">
        Loading module...
      </div>
    </div>
  );
}

export default function App() {
  const { currentPattern } = useStore();
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showSequencer, setShowSequencer] = useState(false);
  const [showMelodic, setShowMelodic] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useKeyboardShortcuts();
  usePersistence();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-studio-900 to-studio-950">
      {/* Header with controls */}
      <header className="flex items-center justify-between px-4 py-2 pro-header border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-accent-primary to-accent-tertiary bg-clip-text text-transparent tracking-wider">MusicLab</h1>
          <Controls />
          <div className="border-l border-studio-600 pl-4">
            <FileManager />
          </div>
          <div className="border-l border-studio-600 pl-4 flex items-center gap-2">
            <button
              onClick={() => setShowSequencer(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5"
              title="Step Sequencer (Drums)"
            >
              <Grid3X3 size={14} className="text-blue-400" />
              <span>Drums</span>
            </button>
            <button
              onClick={() => setShowMelodic(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5"
              title="Melodic Sequencer"
            >
              <Music size={14} className="text-orange-400" />
              <span>Melodic</span>
            </button>
            <button
              onClick={() => setShowSamples(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5"
              title="Sample Browser"
            >
              <Layers size={14} className="text-teal-400" />
              <span>Samples</span>
            </button>
            <button
              onClick={() => setShowEffects(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5"
              title="Effects Rack"
            >
              <Sliders size={14} className="text-cyan-400" />
              <span>Effects</span>
            </button>
            <button
              onClick={() => setShowVisualizer(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5"
              title="Open Visualizer"
            >
              <Sparkles size={14} className="text-purple-400" />
              <span>Visualizer</span>
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-studio-800 text-gray-300 rounded-lg hover:bg-studio-700 hover:text-white flex items-center gap-1.5 ml-2 border border-studio-600"
              title="About MusicLab"
            >
              <Info size={14} className="text-[#00ffcc]" />
              <span className="font-mono text-[10px] tracking-widest text-[#00ffcc]">NFO</span>
            </button>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {currentPattern.name || 'Untitled'} - {currentPattern.layers?.length || 1} layers
        </span>
      </header>

      {/* Modals */}
      <ErrorBoundary name="About">
        {showAbout ? (
          <Suspense fallback={<ModalFallback />}>
            <AboutCrackerModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>
      <ErrorBoundary name="Visualizer">
        {showVisualizer ? (
          <Suspense fallback={<ModalFallback />}>
            <Visualizer isOpen={showVisualizer} onClose={() => setShowVisualizer(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>
      <ErrorBoundary name="Step Sequencer">
        {showSequencer ? (
          <Suspense fallback={<ModalFallback />}>
            <StepSequencer isOpen={showSequencer} onClose={() => setShowSequencer(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>
      <ErrorBoundary name="Melodic Sequencer">
        {showMelodic ? (
          <Suspense fallback={<ModalFallback />}>
            <MelodicSequencer isOpen={showMelodic} onClose={() => setShowMelodic(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>
      <ErrorBoundary name="Sample Browser">
        {showSamples ? (
          <Suspense fallback={<ModalFallback />}>
            <SampleBrowser isOpen={showSamples} onClose={() => setShowSamples(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>
      <ErrorBoundary name="Effects Rack">
        {showEffects ? (
          <Suspense fallback={<ModalFallback />}>
            <EffectsRack isOpen={showEffects} onClose={() => setShowEffects(false)} />
          </Suspense>
        ) : null}
      </ErrorBoundary>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Pattern Library */}
        <aside className="w-64 flex-shrink-0 border-r border-white/[0.04] bg-gradient-panel overflow-hidden flex flex-col">
          <PatternList />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top section: Editor + Samples */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <ErrorBoundary name="Code Editor">
              <div className="flex-1 flex flex-col overflow-hidden border-r border-studio-600">
                <div className="flex-1 overflow-hidden">
                  <CodeEditor />
                </div>
                <CheatSheet />
              </div>
            </ErrorBoundary>

            {/* Right sidebar - Sample Pad */}
            <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden bg-studio-800">
              <SamplePad />
            </div>
          </div>

          {/* Arrangement View at bottom - DAW-style timeline */}
          <ErrorBoundary name="Arrangement View">
            <div className="h-80 flex-shrink-0 border-t border-studio-600">
              <ArrangementView />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
