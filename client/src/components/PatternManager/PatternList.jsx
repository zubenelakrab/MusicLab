import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import PatternCard from './PatternCard';
import PatternForm from './PatternForm';
import logger from '../../utils/logger';
import { generateId, generateTrackId, generateClipId } from '../../utils/id';

const API_URL = '/api/patterns';

// Default track colors
const TRACK_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#f7dc6f', '#bb8fce',
  '#85c1e9', '#f8b500', '#e74c3c', '#2ecc71', '#9b59b6',
];

export default function PatternList() {
  const {
    patterns,
    setPatterns,
    currentPattern,
    setCurrentPattern,
    addPattern,
    arrangement,
    setEditingClip,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const trackCount = arrangement.tracks.length;
    const color = TRACK_COLORS[trackCount % TRACK_COLORS.length];
    const trackId = generateTrackId();
    const clipId = generateClipId();

    // Create new track with a clip containing the pattern code
    const newTrack = {
      id: trackId,
      name: pattern.name,
      color,
      muted: false,
      solo: false,
      height: 100,
      params: {
        gain: 0.8,
        cutoff: 8000,
        resonance: 0,
        speed: 1,
        pan: 0,
        reverb: 0,
        reverbSize: 2,
        delay: 0,
        delayTime: 0.25,
        delayFeedback: 0.3,
        distortion: 0,
        hpf: 0,
        phaser: 0,
        phaserDepth: 0.5,
      },
      clips: [{
        id: clipId,
        patternId: pattern.id,
        name: pattern.name,
        startBar: 0,
        durationBars: 4,
        color,
        layers: [{
          id: generateId(),
          name: pattern.name,
          code: pattern.code,
          muted: false,
          solo: false,
          params: pattern.params || {},
        }],
      }],
    };

    // Update arrangement with new track
    useStore.setState((state) => ({
      arrangement: {
        ...state.arrangement,
        tracks: [...state.arrangement.tracks, newTrack],
      },
    }));

    // Select the new clip for editing
    setEditingClip(trackId, clipId);
  };

  // Replace everything with this pattern (loads it as a new project)
  const handleReplace = (pattern) => {
    setCurrentPattern({
      id: pattern.id,
      name: pattern.name,
      code: pattern.code,
      params: pattern.params || { gain: 0.8, cutoff: 8000, resonance: 0, speed: 1, pan: 0 },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-studio-700 border-b border-studio-600">
        <span className="text-sm text-gray-400">Library</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-2 py-1 text-xs bg-accent-primary text-black rounded hover:bg-emerald-400"
        >
          + Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {showForm && (
          <PatternForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
        ) : patterns.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No saved patterns</p>
        ) : (
          patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onAddAsTrack={handleAddAsTrack}
              onReplace={handleReplace}
              onDelete={handleDelete}
              isActive={currentPattern.id === pattern.id}
            />
          ))
        )}
      </div>

      <div className="px-3 py-2 bg-studio-700 border-t border-studio-600">
        <p className="text-xs text-gray-500">
          "+ Track" adds a new track
        </p>
      </div>
    </div>
  );
}
