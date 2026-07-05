import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search notes...' }) => (
  <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface">
    <Search size={14} className="text-gray-600 shrink-0" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent outline-none text-xs font-mono text-gray-200 placeholder-gray-600 w-full"
    />
    {value && (
      <button onClick={() => onChange('')} className="text-gray-600 hover:text-white shrink-0" title="Clear search">
        <X size={14} />
      </button>
    )}
  </div>
);