import React, { useState } from 'react';
import {
  Files, Star, Clock, Tags, Trash2, FolderOpen, Folder as FolderIcon,
  ChevronDown, ChevronRight, Plus, Pencil, Trash, MoreVertical,
} from 'lucide-react';
import { Folder, Note, SidebarView } from '../../types/notes';

interface NotesSidebarProps {
  folders: Folder[];
  notes: Note[];
  allTags: string[];
  activeView: SidebarView;
  onChangeView: (view: SidebarView) => void;
  onNewFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
}

const isSameView = (a: SidebarView, b: SidebarView): boolean => {
  if (a.type !== b.type) return false;
  if (a.type === 'folder' && b.type === 'folder') return a.folderId === b.folderId;
  if (a.type === 'tag' && b.type === 'tag') return a.tag === b.tag;
  return true;
};

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  folders,
  notes,
  allTags,
  activeView,
  onChangeView,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
}) => {
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);

  const activeNotes = notes.filter((n) => !n.trashed);
  const countInFolder = (folderId: string) => activeNotes.filter((n) => n.folderId === folderId).length;
  const countForTag = (tag: string) => activeNotes.filter((n) => n.tags.includes(tag)).length;

  const navItem = (view: SidebarView, icon: React.ReactNode, label: string, count?: number) => {
    const active = isSameView(activeView, view);
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors ${
          active ? 'bg-safe/10 text-safe border-l-2 border-safe' : 'text-gray-400 hover:text-gray-200 border-l-2 border-transparent'
        }`}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        {typeof count === 'number' && <span className="text-[10px] text-gray-600">{count}</span>}
      </button>
    );
  };

  return (
    <aside className="w-full md:w-56 shrink-0 border-r border-gray-800 bg-surface flex flex-col gap-1 py-3 overflow-y-auto">
      <div className="flex flex-col gap-0.5 px-1">
        {navItem({ type: 'all' }, <Files size={14} />, 'All Notes', activeNotes.length)}
        {navItem({ type: 'favorites' }, <Star size={14} />, 'Favorites', activeNotes.filter((n) => n.favorite).length)}
        {navItem({ type: 'recent' }, <Clock size={14} />, 'Recent')}
        {navItem({ type: 'trash' }, <Trash2 size={14} />, 'Trash', notes.filter((n) => n.trashed).length)}
      </div>

      <div className="mt-3 border-t border-gray-900 pt-3 px-1">
        <div className="flex items-center justify-between px-2 mb-1">
          <button
            onClick={() => setFoldersExpanded(!foldersExpanded)}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-600 font-mono font-bold"
          >
            {foldersExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Folders
          </button>
          <button onClick={onNewFolder} className="text-gray-600 hover:text-safe" title="New folder">
            <Plus size={12} />
          </button>
        </div>

        {foldersExpanded && (
          <div className="flex flex-col gap-0.5">
            {folders.map((folder) => {
              const active = isSameView(activeView, { type: 'folder', folderId: folder.id });
              return (
                <div key={folder.id} className="group relative flex items-center">
                  <button
                    onClick={() => onChangeView({ type: 'folder', folderId: folder.id })}
                    className={`flex-1 flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors ${
                      active ? 'bg-safe/10 text-safe border-l-2 border-safe' : 'text-gray-400 hover:text-gray-200 border-l-2 border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FolderIcon size={12} />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-[10px] text-gray-600 shrink-0">{countInFolder(folder.id)}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenuFolderId(openMenuFolderId === folder.id ? null : folder.id); }}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-white p-1"
                  >
                    <MoreVertical size={12} />
                  </button>
                  {openMenuFolderId === folder.id && (
                    <div className="absolute right-0 top-6 z-20 w-32 border border-gray-700 bg-void flex flex-col shadow-lg">
                      <button
                        onClick={() => { onRenameFolder(folder); setOpenMenuFolderId(null); }}
                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-gray-300 hover:bg-gray-900 uppercase"
                      >
                        <Pencil size={10} /> Rename
                      </button>
                      <button
                        onClick={() => { onDeleteFolder(folder); setOpenMenuFolderId(null); }}
                        className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-panic hover:bg-gray-900 uppercase"
                      >
                        <Trash size={10} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-gray-900 pt-3 px-1">
        <button
          onClick={() => setTagsExpanded(!tagsExpanded)}
          className="flex items-center gap-1 px-2 mb-1 text-[10px] uppercase tracking-widest text-gray-600 font-mono font-bold"
        >
          {tagsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Tags
        </button>
        {tagsExpanded && (
          <div className="flex flex-col gap-0.5">
            {allTags.length === 0 && <p className="px-3 text-[10px] font-mono text-gray-700">No tags yet</p>}
            {allTags.map((tag) => {
              const active = isSameView(activeView, { type: 'tag', tag });
              return (
                <button
                  key={tag}
                  onClick={() => onChangeView({ type: 'tag', tag })}
                  className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors ${
                    active ? 'bg-safe/10 text-safe border-l-2 border-safe' : 'text-gray-400 hover:text-gray-200 border-l-2 border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Tags size={12} />
                    <span className="truncate">{tag}</span>
                  </span>
                  <span className="text-[10px] text-gray-600 shrink-0">{countForTag(tag)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};