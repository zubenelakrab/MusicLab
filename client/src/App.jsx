import { useState } from 'react';
import { Sparkles, Grid3X3, Music, Layers, Sliders } from 'lucide-react';
import Controls from './components/Transport/Controls';
import FileManager from './components/FileManager/FileManager';
import CodeEditor from './components/Editor/CodeEditor';
import SamplePad from './components/Editor/SamplePad';
import CheatSheet from './components/Editor/CheatSheet';
import PatternList from './components/PatternManager/PatternList';
import { ArrangementView } from './components/ArrangementView';
import Visualizer from './components/Visualizer/Visualizer';
import StepSequencer from './components/StepSequencer/StepSequencer';
import MelodicSequencer from './components/MelodicSequencer/MelodicSequencer';
import SampleBrowser from './components/SampleBrowser/SampleBrowser';
import EffectsRack from './components/EffectsRack/EffectsRack';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePersistence } from './hooks/usePersistence';

export default function App() {
  const { currentPattern } = useStore();
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showSequencer, setShowSequencer] = useState(false);
  const [showMelodic, setShowMelodic] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

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
              className="btn-pro px-3 py-1.5 text-xs bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-400 hover:to-blue-500 flex items-center gap-1.5"
              title="Step Sequencer (Drums)"
            >
              <Grid3X3 size={14} />
              <span>Drums</span>
            </button>
            <button
              onClick={() => setShowMelodic(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 flex items-center gap-1.5"
              title="Melodic Sequencer"
            >
              <Music size={14} />
              <span>Melodic</span>
            </button>
            <button
              onClick={() => setShowSamples(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-gradient-to-b from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-400 hover:to-teal-500 flex items-center gap-1.5"
              title="Sample Browser"
            >
              <Layers size={14} />
              <span>Samples</span>
            </button>
            <button
              onClick={() => setShowEffects(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-gradient-to-b from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-400 hover:to-cyan-500 flex items-center gap-1.5"
              title="Effects Rack"
            >
              <Sliders size={14} />
              <span>Effects</span>
            </button>
            <button
              onClick={() => setShowVisualizer(true)}
              className="btn-pro px-3 py-1.5 text-xs bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-400 hover:to-purple-500 flex items-center gap-1.5"
              title="Open Visualizer"
            >
              <Sparkles size={14} />
              <span>Visualizer</span>
            </button>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {currentPattern.name || 'Untitled'} - {currentPattern.layers?.length || 1} layers
        </span>
      </header>

      {/* Modals */}
      <ErrorBoundary name="Visualizer">
        <Visualizer isOpen={showVisualizer} onClose={() => setShowVisualizer(false)} />
      </ErrorBoundary>
      <ErrorBoundary name="Step Sequencer">
        <StepSequencer isOpen={showSequencer} onClose={() => setShowSequencer(false)} />
      </ErrorBoundary>
      <ErrorBoundary name="Melodic Sequencer">
        <MelodicSequencer isOpen={showMelodic} onClose={() => setShowMelodic(false)} />
      </ErrorBoundary>
      <ErrorBoundary name="Sample Browser">
        <SampleBrowser isOpen={showSamples} onClose={() => setShowSamples(false)} />
      </ErrorBoundary>
      <ErrorBoundary name="Effects Rack">
        <EffectsRack isOpen={showEffects} onClose={() => setShowEffects(false)} />
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
