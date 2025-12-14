import { useState } from 'react';

export default function PatternForm({ onSave, onCancel, initialData = {} }) {
  const [name, setName] = useState(initialData.name || '');
  const [tags, setTags] = useState(initialData.tags?.join(', ') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: name || 'Untitled',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-studio-700 rounded-lg space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Pattern Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Pattern"
          className="w-full px-3 py-2 bg-studio-800 border border-studio-500 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Tags (comma separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="drums, bass, synth"
          className="w-full px-3 py-2 bg-studio-800 border border-studio-500 rounded text-white text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-3 py-2 bg-accent-primary text-black text-sm font-medium rounded hover:bg-emerald-400"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 bg-studio-600 text-gray-300 text-sm rounded hover:bg-studio-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
