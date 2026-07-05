import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LayoutDashboard, Files, FolderOpen, Star, Pin, HardDrive } from 'lucide-react';
import { Note, Folder, UploadedFile, SidebarView, SortOption, ViewMode } from '../types/notes';
import { useNotesStorage } from '../hooks/useNotesStorage';
import { useFileStorage } from '../hooks/useFileStorage';
import { createBlankNote, searchNotes, sortNotes, calculateStats, formatFileSize } from '../utils/notesUtils';

import { NotesSidebar } from '../components/Notes/NotesSidebar';
import { NotesToolbar } from '../components/Notes/NotesToolbar';
import { NotesGrid } from '../components/Notes/NotesGrid';
import { NoteEditor } from '../components/Notes/NoteEditor';
import { FolderModal } from '../components/Notes/FolderModal';
import { UploadModal } from '../components/Notes/UploadModal';
import { FilePreviewModal } from '../components/Notes/FilePreviewModal';
import { DeleteConfirmModal } from '../components/Notes/DeleteConfirmModal';

// Only one overlay can be open at a time — modeled as a discriminated union
// instead of five separate booleans so we never accidentally stack two.
type ModalState =
  | { type: 'none' }
  | { type: 'folder-create' }
  | { type: 'folder-rename'; folder: Folder }
  | { type: 'delete-folder'; folder: Folder }
  | { type: 'trash-note'; noteId: string }
  | { type: 'delete-note-forever'; noteId: string }
  | { type: 'upload'; noteId: string }
  | { type: 'preview-file'; file: UploadedFile };

const Notes: React.FC = () => {
  const { notes, setNotes, folders, setFolders, loading: notesLoading } = useNotesStorage();
  const { files, setFiles, loading: filesLoading, uploadFiles, deleteFile, getFilesForNote } = useFileStorage();

  const [activeView, setActiveView] = useState<SidebarView>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const loading = notesLoading || filesLoading;

  // ---------- Derived data ----------

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const stats = useMemo(() => calculateStats(notes, folders, files), [notes, folders, files]);

  // Base list for the current sidebar view, before search/sort.
  const viewFilteredNotes = useMemo(() => {
    switch (activeView.type) {
      case 'favorites':
        return notes.filter((n) => !n.trashed && n.favorite);
      case 'recent':
        return [...notes.filter((n) => !n.trashed)].sort(
          (a, b) => new Date(b.lastOpenedAt ?? b.updatedAt).getTime() - new Date(a.lastOpenedAt ?? a.updatedAt).getTime()
        ).slice(0, 20);
      case 'trash':
        return notes.filter((n) => n.trashed);
      case 'folder':
        return notes.filter((n) => !n.trashed && n.folderId === activeView.folderId);
      case 'tag':
        return notes.filter((n) => !n.trashed && n.tags.includes(activeView.tag));
      case 'all':
      default:
        return notes.filter((n) => !n.trashed);
    }
  }, [notes, activeView]);

  const searchedNotes = useMemo(
    () => searchNotes(viewFilteredNotes, files, folders, searchQuery),
    [viewFilteredNotes, files, folders, searchQuery]
  );

  const displayedNotes = useMemo(
    () => sortNotes(searchedNotes, sortBy, files),
    [searchedNotes, sortBy, files]
  );

  const emptyVariant = useMemo(() => {
    if (searchQuery.trim()) return 'no-search-results' as const;
    if (activeView.type === 'trash') return 'trash-empty' as const;
    if (activeView.type === 'folder') return 'no-folder-notes' as const;
    return 'no-notes' as const;
  }, [searchQuery, activeView]);

  const openNote = openNoteId ? notes.find((n) => n.id === openNoteId) ?? null : null;
  const openNoteAttachments = openNoteId ? getFilesForNote(openNoteId) : [];

  // ---------- Note CRUD ----------

  const handleNewNote = useCallback(() => {
    const folderId = activeView.type === 'folder' ? activeView.folderId : null;
    const note = createBlankNote(folderId);
    setNotes((prev) => [note, ...prev]);
    setOpenNoteId(note.id);
    setReadingMode(false);
  }, [activeView, setNotes]);

  const handleOpenNote = useCallback((note: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, lastOpenedAt: new Date().toISOString() } : n)));
    setOpenNoteId(note.id);
    setReadingMode(false);
  }, [setNotes]);

  const handleSaveNote = useCallback((updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, [setNotes]);

  const handleCloseEditor = useCallback(() => {
    setOpenNoteId(null);
    setReadingMode(false);
  }, []);

  const handleToggleFavorite = useCallback((noteId: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, favorite: !n.favorite } : n)));
  }, [setNotes]);

  const handleTogglePin = useCallback((noteId: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)));
  }, [setNotes]);

  const handleTrashNote = useCallback((noteId: string) => {
    setModal({ type: 'trash-note', noteId });
  }, []);

  const confirmTrashNote = useCallback(() => {
    if (modal.type !== 'trash-note') return;
    const { noteId } = modal;
    setNotes((prev) => prev.map((n) =>
      n.id === noteId ? { ...n, trashed: true, trashedAt: new Date().toISOString() } : n
    ));
    setModal({ type: 'none' });
    if (openNoteId === noteId) setOpenNoteId(null);
  }, [modal, setNotes, openNoteId]);

  const handleRestoreNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.map((n) =>
      n.id === noteId ? { ...n, trashed: false, trashedAt: undefined } : n
    ));
  }, [setNotes]);

  const handleDeleteNoteForever = useCallback((noteId: string) => {
    setModal({ type: 'delete-note-forever', noteId });
  }, []);

  const confirmDeleteNoteForever = useCallback(() => {
    if (modal.type !== 'delete-note-forever') return;
    const { noteId } = modal;
    // Clean up attachments that belonged only to this note.
    setFiles((prev) => prev.filter((f) => f.noteId !== noteId));
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setModal({ type: 'none' });
  }, [modal, setNotes, setFiles]);

  // ---------- Folder CRUD ----------

  const handleSaveFolder = useCallback((name: string) => {
    if (modal.type === 'folder-rename') {
      const folderId = modal.folder.id;
      setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name } : f)));
    } else {
      setFolders((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, createdAt: new Date().toISOString() }]);
    }
    setModal({ type: 'none' });
  }, [modal, setFolders]);

  const confirmDeleteFolder = useCallback(() => {
    if (modal.type !== 'delete-folder') return;
    const folderId = modal.folder.id;
    // Notes in a deleted folder become unfiled, not deleted.
    setNotes((prev) => prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n)));
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeView.type === 'folder' && activeView.folderId === folderId) {
      setActiveView({ type: 'all' });
    }
    setModal({ type: 'none' });
  }, [modal, setNotes, setFolders, activeView]);

  const handleToggleFolderCollapsed = useCallback((folderId: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, collapsed: !f.collapsed } : f)));
  }, [setFolders]);

  // ---------- File handlers ----------

  const handleUploadForOpenNote = useCallback(
    async (fileList: FileList | File[]) => {
      if (!openNoteId) return { succeeded: [], rejected: [] };
      const result = await uploadFiles(openNoteId, fileList);
      if (result.succeeded.length > 0) {
        setNotes((prev) => prev.map((n) =>
          n.id === openNoteId
            ? { ...n, attachmentIds: [...n.attachmentIds, ...result.succeeded.map((f) => f.id)] }
            : n
        ));
      }
      return result;
    },
    [openNoteId, uploadFiles, setNotes]
  );

  const handleDeleteAttachment = useCallback((fileId: string) => {
    deleteFile(fileId);
    if (openNoteId) {
      setNotes((prev) => prev.map((n) =>
        n.id === openNoteId ? { ...n, attachmentIds: n.attachmentIds.filter((id) => id !== fileId) } : n
      ));
    }
  }, [deleteFile, openNoteId, setNotes]);

  // ---------- Keyboard shortcuts ----------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only fire global shortcuts when no modal/editor is capturing input,
      // and not while the user is typing in an unrelated input field.
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isTyping) {
        e.preventDefault();
        handleNewNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isTyping) {
        e.preventDefault();
        document.getElementById('notes-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewNote]);

  const viewTitle = useMemo(() => {
    switch (activeView.type) {
      case 'favorites': return 'Favorites';
      case 'recent': return 'Recent';
      case 'trash': return 'Trash';
      case 'folder': return folders.find((f) => f.id === activeView.folderId)?.name ?? 'Folder';
      case 'tag': return `#${activeView.tag}`;
      case 'all':
      default: return 'All Notes';
    }
  }, [activeView, folders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <span className="text-gray-600 font-mono text-xs uppercase tracking-widest">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void bg-grid font-display flex flex-col md:flex-row">
      <NotesSidebar
        folders={folders}
        notes={notes}
        allTags={allTags}
        activeView={activeView}
        onChangeView={setActiveView}
        onNewFolder={() => setModal({ type: 'folder-create' })}
        onRenameFolder={(folder) => setModal({ type: 'folder-rename', folder })}
        onDeleteFolder={(folder) => setModal({ type: 'delete-folder', folder })}
        onToggleFolderCollapsed={handleToggleFolderCollapsed}
      />

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 overflow-y-auto">
        {/* Dashboard stats */}
        {showDashboard && (
          <div className="border border-gray-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
                <LayoutDashboard size={12} /> Notes Dashboard
              </span>
              <button
                onClick={() => setShowDashboard(false)}
                className="text-[10px] text-gray-600 hover:text-gray-300 font-mono uppercase"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBlock icon={<Files size={13} />} label="Notes" value={stats.totalNotes} />
              <StatBlock icon={<FolderOpen size={13} />} label="Folders" value={stats.totalFolders} />
              <StatBlock icon={<Files size={13} />} label="Files" value={stats.totalFiles} />
              <StatBlock icon={<Star size={13} />} label="Favorites" value={stats.favoritesCount} />
              <StatBlock icon={<Pin size={13} />} label="Pinned" value={stats.pinnedCount} />
              <StatBlock icon={<HardDrive size={13} />} label="Storage" value={formatFileSize(stats.storageUsedBytes)} />
            </div>
          </div>
        )}
        {!showDashboard && (
          <button
            onClick={() => setShowDashboard(true)}
            className="self-start text-[10px] text-gray-600 hover:text-gray-300 font-mono uppercase tracking-widest"
          >
            Show dashboard
          </button>
        )}

        <div className="flex items-center gap-3">
          <h2 className="text-white font-bold tracking-widest text-sm uppercase whitespace-nowrap">{viewTitle}</h2>
          <div className="h-px w-full bg-gray-800" />
          <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap">{displayedNotes.length} notes</span>
        </div>

        <NotesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewNote={handleNewNote}
          onNewFolder={() => setModal({ type: 'folder-create' })}
          onUpload={() => {
            // Uploading from the toolbar (no note open yet) creates a fresh
            // note first, then opens the upload modal against it.
            const folderId = activeView.type === 'folder' ? activeView.folderId : null;
            const note = createBlankNote(folderId);
            setNotes((prev) => [note, ...prev]);
            setOpenNoteId(note.id);
            setModal({ type: 'upload', noteId: note.id });
          }}
        />

        <NotesGrid
          notes={displayedNotes}
          files={files}
          folders={folders}
          viewMode={viewMode}
          emptyVariant={emptyVariant}
          onOpenNote={handleOpenNote}
          onToggleFavorite={handleToggleFavorite}
          onTogglePin={handleTogglePin}
          onTrash={handleTrashNote}
          onRestore={handleRestoreNote}
          onDeleteForever={handleDeleteNoteForever}
          onNewNote={handleNewNote}
        />
      </main>

      {/* Note editor */}
      {openNote && (
        <NoteEditor
          note={openNote}
          folders={folders}
          attachments={openNoteAttachments}
          allTags={allTags}
          readingMode={readingMode}
          onToggleReadingMode={() => setReadingMode((r) => !r)}
          onSave={handleSaveNote}
          onClose={handleCloseEditor}
          onUploadClick={() => openNoteId && setModal({ type: 'upload', noteId: openNoteId })}
          onDeleteAttachment={handleDeleteAttachment}
          onPreviewAttachment={(file) => setModal({ type: 'preview-file', file })}
        />
      )}

      {/* Modals */}
      {modal.type === 'folder-create' && (
        <FolderModal
          folder={null}
          existingNames={folders.map((f) => f.name)}
          onSave={handleSaveFolder}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'folder-rename' && (
        <FolderModal
          folder={modal.folder}
          existingNames={folders.map((f) => f.name)}
          onSave={handleSaveFolder}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'delete-folder' && (
        <DeleteConfirmModal
          title="Delete Folder"
          message={`Delete "${modal.folder.name}"? Notes inside will move to "All Notes" — they won't be deleted.`}
          confirmLabel="Delete Folder"
          onConfirm={confirmDeleteFolder}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'trash-note' && (
        <DeleteConfirmModal
          title="Move to Trash"
          message="This note will be moved to Trash. You can restore it later or delete it permanently from there."
          confirmLabel="Move to Trash"
          onConfirm={confirmTrashNote}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'delete-note-forever' && (
        <DeleteConfirmModal
          title="Delete Forever"
          message="This permanently deletes the note and all its attachments. This cannot be undone."
          confirmLabel="Delete Forever"
          onConfirm={confirmDeleteNoteForever}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'upload' && openNote && (
        <UploadModal
          noteTitle={openNote.title}
          onUpload={handleUploadForOpenNote}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'preview-file' && (
        <FilePreviewModal file={modal.file} onClose={() => setModal({ type: 'none' })} />
      )}
    </div>
  );
};

const StatBlock: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1 p-2 border border-gray-900">
    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gray-600 font-mono">
      {icon} {label}
    </span>
    <span className="text-lg font-bold text-white font-mono">{value}</span>
  </div>
);

export default Notes;