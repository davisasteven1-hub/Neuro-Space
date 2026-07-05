import React from 'react';
import { Plus, FolderPlus, Upload, ArrowUpDown, LayoutGrid, List, Rows3 } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { SortOption, ViewMode } from '../../types/notes';

interface NotesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  onNewNote: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
  { value: 'recentlyEdited', label: 'Recently Edited' },
  { value: 'largestFile', label: 'Largest File' },
  { value: 'smallestFile', label: 'Smallest File' },
];

export const NotesToolbar: React.FC<NotesToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onNewNote,
  onNewFolder,
  onUpload,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 flex-wrap">
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
        <ArrowUpDown size={14} className="text-gray-600" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-300 text-[10px] font-mono uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
        >
          <Plus size={12} /> New Note
        </button>
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider hover:border-gray-500 transition-colors"
        >
          <FolderPlus size={12} /> New Folder
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider hover:border-gray-500 transition-colors"
        >
          <Upload size={12} /> Upload
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 border ${viewMode === 'grid' ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500'}`}
          title="Grid view"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => onViewModeChange('compact')}
          className={`p-2 border ${viewMode === 'compact' ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500'}`}
          title="Compact view"
        >
          <Rows3 size={14} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 border ${viewMode === 'list' ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500'}`}
          title="List view"
        >
          <List size={14} />
        </button>
      </div>
    </div>
  </div>
);