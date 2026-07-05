import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { SUGGESTED_TAGS } from '../../constants/notesConstants';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[]; // known tags across all notes, for suggestions
}

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange, allTags = [] }) => {
  const [draft, setDraft] = useState('');

  const suggestions = Array.from(new Set([...SUGGESTED_TAGS, ...allTags])).filter(
    (t) => !selectedTags.includes(t) && t.toLowerCase().includes(draft.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    onChange([...selectedTags, trimmed]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 border border-safe/40 bg-safe/10 text-safe text-[10px] font-mono uppercase tracking-wide"
          >
            <TagIcon size={9} />
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-panic">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(draft);
            }
          }}
          placeholder="Add a tag..."
          className="flex-1 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-gray-600"
        />
        <button
          onClick={() => addTag(draft)}
          className="px-2 py-1.5 border border-gray-700 text-gray-400 hover:border-safe hover:text-safe"
          title="Add tag"
        >
          <Plus size={12} />
        </button>
      </div>

      {draft && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 text-[10px] font-mono uppercase"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};