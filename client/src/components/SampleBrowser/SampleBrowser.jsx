import { useState, useEffect, useMemo } from 'react';
import { X, Search, Play, ChevronRight, Volume2, Grid, List, Layers } from 'lucide-react';
import { useStore } from '../../store';
import { SAMPLES_BY_CATEGORY, SAMPLE_VARIANT_COUNTS, ALL_SAMPLE_NAMES, CATEGORY_ICONS } from '../../data/samples';
import { previewSample } from '../../strudel/engine';

export default function SampleBrowser({ isOpen, onClose }) {
  const editingClip = useStore((s) => s.editingClip);
  const arrangement = useStore((s) => s.arrangement);
  const updateEditingClipCode = useStore((s) => s.updateEditingClipCode);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isPlaying, setIsPlaying] = useState(null);
  const [recentSamples, setRecentSamples] = useState([]);

  // Resolve the clip currently open in the editor (this is what actually plays)
  const editingInfo = useMemo(() => {
    if (!editingClip) return null;
    const track = arrangement.tracks.find((t) => t.id === editingClip.trackId);
    if (!track) return null;
    const clip = track.clips.find((c) => c.id === editingClip.clipId);
    if (!clip) return null;
    return { track, clip, code: clip.layers?.[0]?.code || '' };
  }, [editingClip, arrangement]);

  const currentCode = editingInfo?.code || '';
  const hasClip = !!editingInfo;

  // Filter samples
  const filteredSamples = useMemo(() => {
    let samples = ALL_SAMPLE_NAMES;

    // Filter by search
    if (searchTerm.trim()) {
      samples = samples.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      const categorySamples = SAMPLES_BY_CATEGORY[selectedCategory]?.map(s => s.name) || [];
      samples = samples.filter(name => categorySamples.includes(name));
    }

    return samples;
  }, [searchTerm, selectedCategory]);

  // Categories with counts
  const categories = Object.entries(SAMPLES_BY_CATEGORY);

  // Get variant count for sample
  const getVariantCount = (sample) => SAMPLE_VARIANT_COUNTS[sample] || 1;

  // Preview sample
  const handlePreview = async (sample, variant = 0) => {
    setIsPlaying(`${sample}:${variant}`);
    await previewSample(sample, variant);
    setTimeout(() => setIsPlaying(null), 400);
  };

  // Insert sample
  const handleInsert = (sample, variant = 0) => {
    if (!hasClip) return;
    const code = variant > 0 ? `${sample}:${variant}` : sample;
    const newCode = currentCode ? `${currentCode} ${code}` : code;
    updateEditingClipCode(newCode);

    // Add to recents
    setRecentSamples(prev => {
      const filtered = prev.filter(s => s !== sample);
      return [sample, ...filtered].slice(0, 10);
    });
  };

  // Select sample for variant browsing
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setSelectedVariant(0);
  };

  // Generate variants array
  const variants = selectedSample
    ? Array.from({ length: getVariantCount(selectedSample) }, (_, i) => i)
    : [];

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedSample) {
          setSelectedSample(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedSample, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-studio-800 to-studio-900 rounded-2xl shadow-panel border border-white/[0.06] animate-scale-in w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pro-header bg-gradient-modal">
          <div className="flex items-center gap-3">
            <Layers size={20} className="text-accent-primary" />
            <h2 className="text-lg font-bold text-white">Sample Browser</h2>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-studio-600 rounded">
              {ALL_SAMPLE_NAMES.length} samples
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex bg-studio-600 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 ${viewMode === 'grid' ? 'bg-accent-primary text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 ${viewMode === 'list' ? 'bg-accent-primary text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <List size={16} />
              </button>
            </div>
            {/* Target clip indicator */}
            <span className="text-sm text-gray-400">
              {hasClip
                ? <>Clip: <span className="text-white">{editingInfo.clip.name}</span></>
                : <span className="text-yellow-500">No clip selected</span>}
            </span>
            <button onClick={onClose} className="btn-pro p-1.5 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Categories */}
          <div className="w-48 flex-shrink-0 border-r border-studio-600 bg-studio-750 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full px-3 py-2 text-left text-sm rounded mb-1 ${
                  !selectedCategory
                    ? 'bg-gradient-to-r from-accent-primary to-accent-tertiary text-black shadow-glow-sm'
                    : 'text-gray-300 hover:bg-studio-600'
                }`}
              >
                All ({ALL_SAMPLE_NAMES.length})
              </button>
              {categories.map(([category, samples]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full px-3 py-2 text-left text-sm rounded mb-1 flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-accent-primary to-accent-tertiary text-black shadow-glow-sm'
                      : 'text-gray-300 hover:bg-studio-600'
                  }`}
                >
                  <span>{CATEGORY_ICONS[category] || '📁'}</span>
                  <span className="flex-1 truncate">{category}</span>
                  <span className="text-xs opacity-60">{samples.length}</span>
                </button>
              ))}
            </div>

            {/* Recent samples */}
            {recentSamples.length > 0 && (
              <div className="border-t border-studio-600 p-2">
                <h4 className="text-xs text-gray-500 uppercase mb-2 px-3">Recent</h4>
                {recentSamples.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => handleSelectSample(sample)}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:text-white hover:bg-studio-600 rounded truncate"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-studio-600">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search samples..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-pro w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Sample grid/list */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredSamples.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No samples found
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-6 gap-2">
                  {filteredSamples.map((sample) => {
                    const variantCount = getVariantCount(sample);
                    const hasVariants = variantCount > 1;
                    const playing = isPlaying === `${sample}:0`;

                    return (
                      <button
                        key={sample}
                        onClick={() => hasVariants ? handleSelectSample(sample) : handleInsert(sample)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handlePreview(sample, 0);
                        }}
                        className={`
                          relative p-3 rounded-lg text-left transition-all
                          ${playing
                            ? 'bg-accent-primary text-black scale-105'
                            : selectedSample === sample
                              ? 'bg-studio-600 ring-2 ring-accent-primary'
                              : 'glass-panel hover:bg-studio-600'
                          }
                        `}
                      >
                        <div className="text-sm font-medium truncate">{sample}</div>
                        {hasVariants && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded">
                              {variantCount} var
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSamples.map((sample) => {
                    const variantCount = getVariantCount(sample);
                    const hasVariants = variantCount > 1;
                    const playing = isPlaying === `${sample}:0`;

                    return (
                      <div
                        key={sample}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                          ${playing
                            ? 'bg-accent-primary text-black'
                            : selectedSample === sample
                              ? 'bg-studio-600 ring-1 ring-accent-primary'
                              : 'bg-studio-700 hover:bg-studio-600'
                          }
                        `}
                      >
                        <button
                          onClick={() => handlePreview(sample, 0)}
                          className="p-1.5 rounded bg-studio-500 hover:bg-accent-primary hover:text-black"
                        >
                          <Play size={12} />
                        </button>
                        <span className="flex-1 text-sm font-medium">{sample}</span>
                        {hasVariants && (
                          <button
                            onClick={() => handleSelectSample(sample)}
                            className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded hover:bg-blue-500/50"
                          >
                            {variantCount} variants
                          </button>
                        )}
                        <button
                          onClick={() => handleInsert(sample)}
                          className="px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400"
                        >
                          Insert
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar - Variant browser */}
          {selectedSample && (
            <div className="w-72 flex-shrink-0 border-l border-studio-600 bg-studio-750 flex flex-col">
              {/* Sample header */}
              <div className="px-4 py-3 bg-studio-700 border-b border-studio-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-accent-primary" />
                    <span className="text-sm font-bold text-white">{selectedSample}</span>
                  </div>
                  <button
                    onClick={() => setSelectedSample(null)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getVariantCount(selectedSample)} variants available
                </div>
              </div>

              {/* Variant slider */}
              <div className="px-4 py-3 border-b border-studio-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">Variant:</span>
                  <span className="text-sm text-accent-primary font-mono">
                    {selectedSample}:{selectedVariant}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={getVariantCount(selectedSample) - 1}
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(Number(e.target.value))}
                  className="w-full accent-accent-primary"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handlePreview(selectedSample, selectedVariant)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center justify-center gap-1"
                  >
                    <Play size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleInsert(selectedSample, selectedVariant)}
                    className="flex-1 px-3 py-2 text-sm bg-accent-primary text-black rounded hover:bg-emerald-400 flex items-center justify-center gap-1"
                  >
                    <ChevronRight size={14} />
                    Insert
                  </button>
                </div>
              </div>

              {/* Variant grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-5 gap-1">
                  {variants.map((variant) => {
                    const playing = isPlaying === `${selectedSample}:${variant}`;
                    return (
                      <button
                        key={variant}
                        onClick={() => {
                          setSelectedVariant(variant);
                          handlePreview(selectedSample, variant);
                        }}
                        onDoubleClick={() => {
                          handleInsert(selectedSample, variant);
                        }}
                        className={`
                          btn-pro px-2 py-2 text-xs rounded transition-all
                          ${playing
                            ? 'bg-accent-primary text-black scale-110'
                            : selectedVariant === variant
                              ? 'bg-studio-500 text-white ring-1 ring-accent-primary'
                              : 'bg-studio-600 text-gray-300 hover:bg-studio-500'
                          }
                        `}
                        title="Click: preview | Double-click: insert"
                      >
                        :{variant}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-4 py-3 bg-studio-700 border-t border-studio-600">
                <button
                  onClick={() => {
                    if (!hasClip) return;
                    // Insert all variants as alternating pattern
                    const code = `<${variants.map(v => `${selectedSample}:${v}`).join(' ')}>`;
                    const newCode = currentCode ? `${currentCode} ${code}` : code;
                    updateEditingClipCode(newCode);
                  }}
                  className="w-full px-3 py-2 text-xs bg-purple-600/30 text-purple-300 rounded hover:bg-purple-600/50"
                >
                  Insert all as alternating
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-2">
                  Click = preview | Double-click = insert
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 pro-header border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filteredSamples.length} samples shown
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
          <button
            onClick={onClose}
            className="btn-pro px-4 py-1.5 bg-accent-primary text-black rounded-lg font-medium hover:bg-emerald-400 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
