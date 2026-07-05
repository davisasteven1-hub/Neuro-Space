import React from 'react';
import { Note, UploadedFile, Folder, ViewMode } from '../../types/notes';
import { NoteCard } from './NoteCard';
import { EmptyState } from './EmptyState';

interface NotesGridProps {
  notes: Note[];
  files: UploadedFile[];
  folders: Folder[];
  viewMode: ViewMode;
  emptyVariant: 'no-notes' | 'no-search-results' | 'no-folder-notes' | 'trash-empty';
  onOpenNote: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onTrash: (noteId: string) => void;
  onRestore: (noteId: string) => void;
  onDeleteForever: (noteId: string) => void;
  onNewNote?: () => void;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  files,
  folders,
  viewMode,
  emptyVariant,
  onOpenNote,
  onToggleFavorite,
  onTogglePin,
  onTrash,
  onRestore,
  onDeleteForever,
  onNewNote,
}) => {
  if (notes.length === 0) {
    return (
      <EmptyState
        variant={emptyVariant}
        actionLabel={emptyVariant === 'no-notes' && onNewNote ? 'Create a note' : undefined}
        onAction={emptyVariant === 'no-notes' ? onNewNote : undefined}
      />
    );
  }

  const folderNameById = new Map(folders.map((f) => [f.id, f.name]));

  const containerClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
      : 'flex flex-col gap-2';

  return (
    <div className={containerClass}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          attachments={files.filter((f) => f.noteId === note.id)}
          viewMode={viewMode}
          folderName={note.folderId ? folderNameById.get(note.folderId) : undefined}
          onOpen={onOpenNote}
          onToggleFavorite={onToggleFavorite}
          onTogglePin={onTogglePin}
          onTrash={onTrash}
          onRestore={onRestore}
          onDeleteForever={onDeleteForever}
        />
      ))}
    </div>
  );
};