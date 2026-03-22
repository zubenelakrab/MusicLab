import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useStore } from '../../store';
import PatternCard from './PatternCard';
import PatternForm from './PatternForm';
import { PRESETS_BY_CATEGORY, PRESET_CATEGORIES, ALL_PRESETS } from '../../data/presets';
import logger from '../../utils/logger';

const API_URL = '/api/patterns';

export default function PatternList() {
  const {
    patterns,
    setPatterns,
    currentPattern,
    addPattern,
    arrangement,
    addPatternAsTrack,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'mine'

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPatterns(data);
    } catch (err) {
      logger.error('Failed to fetch patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      // Get code from the editing clip or first track's first clip
      const editingClip = useStore.getState().editingClip;
      let code = '';
      let params = { gain: 0.8, cutoff: 8000, resonance: 0, speed: 1, pan: 0 };

      if (editingClip) {
        const track = arrangement.tracks.find(t => t.id === editingClip.trackId);
        const clip = track?.clips.find(c => c.id === editingClip.clipId);
        if (clip?.layers?.[0]) {
          code = clip.layers[0].code || '';
          params = clip.layers[0].params || params;
        }
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code,
          params,
        }),
      });
      const newPattern = await res.json();
      addPattern(newPattern);
      setShowForm(false);
    } catch (err) {
      logger.error('Failed to save pattern:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setPatterns(patterns.filter(p => p.id !== id));
    } catch (err) {
      logger.error('Failed to delete pattern:', err);
    }
  };

  // Add pattern as a new track with a clip
  const handleAddAsTrack = (pattern) => {
    addPatternAsTrack(pattern);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Filter presets by search term
  const filteredPresetCategories = useMemo(() => {
    if (!searchTerm.trim()) return PRESETS_BY_CATEGORY;

    const term = searchTerm.toLowerCase();
    const result = {};
    for (const [category, presets] of Object.entries(PRESETS_BY_CATEGORY)) {
      const filtered = presets.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.tags?.some(t => t.toLowerCase().includes(term)) ||
        category.toLowerCase().includes(term)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }
    return result;
  }, [searchTerm]);

  // Filter user patterns by search
  const filteredUserPatterns = useMemo(() => {
    if (!searchTerm.trim()) return patterns;
    const term = searchTerm.toLowerCase();
    return patterns.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term) ||
      p.tags?.some(t => t.toLowerCase().includes(term))
    );
  }, [patterns, searchTerm]);

  const totalPresets = ALL_PRESETS.length;
  const filteredTotal = Object.values(filteredPresetCategories).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 pro-header">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-medium">Library</span>
          <button
            onClick={() => { setShowForm(!showForm); setActiveTab('mine'); }}
            className="btn-pro px-2 py-1 text-xs bg-accent-primary text-black rounded-lg hover:bg-emerald-400 shadow-glow-sm"
          >
            + Save
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search presets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-pro w-full pl-7 pr-2 py-1 text-sm rounded text-white placeholder-gray-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-studio-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'presets'
                ? 'bg-accent-primary text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Presets ({searchTerm ? filteredTotal : totalPresets})
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'mine'
                ? 'bg-accent-primary text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Patterns ({filteredUserPatterns.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === 'mine' && (
          <>
            {showForm && (
              <PatternForm
                onSave={handleSave}
                onCancel={() => setShowForm(false)}
              />
            )}

            {loading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
            ) : filteredUserPatterns.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No saved patterns</p>
                <p className="text-xs text-gray-600 mt-1">
                  Edit a clip and click "+ Save" to add your own
                </p>
              </div>
            ) : (
              filteredUserPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onAddAsTrack={handleAddAsTrack}

                  onDelete={handleDelete}
                  isActive={currentPattern.id === pattern.id}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'presets' && (
          <>
            {Object.keys(filteredPresetCategories).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No presets found</p>
            ) : (
              Object.entries(filteredPresetCategories).map(([category, presets]) => {
                const isExpanded = expandedCategories[category] ?? false;
                const icon = PRESET_CATEGORIES[category] || '📁';

                return (
                  <div key={category}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 px-2 py-2 text-left rounded-lg hover:bg-studio-700 transition-colors group"
                    >
                      <span className="text-sm">{icon}</span>
                      <span className="flex-1 text-sm font-medium text-gray-300 group-hover:text-white">
                        {category}
                      </span>
                      <span className="text-xs text-gray-500">{presets.length}</span>
                      {isExpanded
                        ? <ChevronDown size={14} className="text-gray-500" />
                        : <ChevronRight size={14} className="text-gray-500" />
                      }
                    </button>

                    {/* Category presets */}
                    {isExpanded && (
                      <div className="space-y-2 mt-1 ml-1 pl-2 border-l border-studio-600">
                        {presets.map((preset) => (
                          <PatternCard
                            key={preset.id}
                            pattern={preset}
                            onAddAsTrack={handleAddAsTrack}
          
                            onDelete={() => {}}
                            isActive={false}
                            isPreset
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-studio-700 border-t border-studio-600">
        <p className="text-xs text-gray-500">
          {activeTab === 'presets'
            ? `${totalPresets} presets — drag to timeline`
            : '"+ Track" adds a new track'
          }
        </p>
      </div>
    </div>
  );
}
