import { useState } from 'react';
import { Sparkles, Grid3X3 } from 'lucide-react';
import Controls from './components/Transport/Controls';
import FileManager from './components/FileManager/FileManager';
import CodeEditor from './components/Editor/CodeEditor';
import SamplePad from './components/Editor/SamplePad';
import CheatSheet from './components/Editor/CheatSheet';
import PatternList from './components/PatternManager/PatternList';
import Timeline from './components/Sequencer/Timeline';
import Visualizer from './components/Visualizer/Visualizer';
import StepSequencer from './components/StepSequencer/StepSequencer';
import { useStore } from './store';

export default function App() {
  const { currentPattern } = useStore();
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showSequencer, setShowSequencer] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-studio-900">
      {/* Header with controls */}
      <header className="flex items-center justify-between px-4 py-2 bg-studio-800 border-b border-studio-600">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-accent-primary">MusicLab</h1>
          <Controls />
          <div className="border-l border-studio-600 pl-4">
            <FileManager />
          </div>
          <div className="border-l border-studio-600 pl-4 flex items-center gap-2">
            <button
              onClick={() => setShowSequencer(true)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors flex items-center gap-1.5"
              title="Step Sequencer"
            >
              <Grid3X3 size={14} />
              <span>Sequencer</span>
            </button>
            <button
              onClick={() => setShowVisualizer(true)}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors flex items-center gap-1.5"
              title="Abrir Visualizer"
            >
              <Sparkles size={14} />
              <span>Visualizer</span>
            </button>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {currentPattern.name || 'Untitled'} - {currentPattern.layers?.length || 1} capas
        </span>
      </header>

      {/* Modals */}
      <Visualizer isOpen={showVisualizer} onClose={() => setShowVisualizer(false)} />
      <StepSequencer isOpen={showSequencer} onClose={() => setShowSequencer(false)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Pattern Library */}
        <aside className="w-64 flex-shrink-0 border-r border-studio-600 bg-studio-800 overflow-hidden flex flex-col">
          <PatternList />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top section: Editor + Samples */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-studio-600">
              <div className="flex-1 overflow-hidden">
                <CodeEditor />
              </div>
              <CheatSheet />
            </div>

            {/* Right sidebar - Sample Pad */}
            <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden bg-studio-800">
              <SamplePad />
            </div>
          </div>

          {/* Timeline at bottom - shows layers */}
          <div className="h-80 flex-shrink-0 border-t border-studio-600">
            <Timeline />
          </div>
        </main>
      </div>
    </div>
  );
}
