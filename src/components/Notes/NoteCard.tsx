import React from 'react';
import { Star, Pin, Paperclip, Trash2, RotateCcw, XCircle } from 'lucide-react';
import { Note, UploadedFile, ViewMode } from '../../types/notes';
import { NOTE_COLOR_CLASSES } from '../../constants/notesConstants';
import { stripHtml, truncateText } from '../../utils/notesUtils';

interface NoteCardProps {
  note: Note;
  attachments: UploadedFile[];
  viewMode: ViewMode;
  folderName?: string;
  onOpen: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onTrash: (noteId: string) => void;
  onRestore?: (noteId: string) => void;
  onDeleteForever?: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  attachments,
  viewMode,
  folderName,
  onOpen,
  onToggleFavorite,
  onTogglePin,
  onTrash,
  onRestore,
  onDeleteForever,
}) => {
  const colorClasses = NOTE_COLOR_CLASSES[note.color];
  const preview = truncateText(stripHtml(note.content), viewMode === 'compact' ? 60 : 140);
  const updatedLabel = new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const isList = viewMode === 'list';
  const isCompact = viewMode === 'compact';

  return (
    <div
      onClick={() => onOpen(note)}
      className={`group relative border ${colorClasses.border} ${colorClasses.bg} hover:brightness-125 transition-all cursor-pointer flex ${
        isList ? 'flex-row items-center gap-4 p-3' : 'flex-col gap-2 p-4'
      }`}
    >
      {note.pinned && (
        <Pin size={12} className="absolute top-2 right-2 text-safe fill-safe" />
      )}

      <div className={`flex items-center gap-2 ${isList ? 'w-40 shrink-0' : ''}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${colorClasses.dot}`} />
        <h4 className="text-sm font-bold text-white truncate">{note.title || 'Untitled'}</h4>
      </div>

      {!isCompact && (
        <p className={`text-xs text-gray-400 font-mono leading-relaxed ${isList ? 'flex-1 truncate' : ''}`}>
          {preview || 'No content'}
        </p>
      )}

      <div className={`flex items-center gap-2 text-[10px] text-gray-600 font-mono flex-wrap ${isList ? 'shrink-0' : 'mt-auto pt-1'}`}>
        {folderName && <span className="px-1.5 py-0.5 border border-gray-800">{folderName}</span>}
        {attachments.length > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip size={9} /> {attachments.length}
          </span>
        )}
        <span>{updatedLabel}</span>
        {note.tags.slice(0, isList ? 1 : 3).map((tag) => (
          <span key={tag} className="px-1.5 py-0.5 border border-safe/30 text-safe/80">
            {tag}
          </span>
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-1 ${isList ? 'shrink-0' : 'absolute top-2 right-2'} ${note.pinned && !isList ? 'mt-4' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        {!note.trashed ? (
          <>
            <button onClick={() => onToggleFavorite(note.id)} className="p-1 text-gray-500 hover:text-caution" title="Favorite">
              <Star size={13} className={note.favorite ? 'fill-caution text-caution' : ''} />
            </button>
            <button onClick={() => onTogglePin(note.id)} className="p-1 text-gray-500 hover:text-safe" title="Pin">
              <Pin size={13} className={note.pinned ? 'fill-safe text-safe' : ''} />
            </button>
            <button onClick={() => onTrash(note.id)} className="p-1 text-gray-500 hover:text-panic" title="Move to trash">
              <Trash2 size={13} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onRestore?.(note.id)} className="p-1 text-gray-500 hover:text-safe" title="Restore">
              <RotateCcw size={13} />
            </button>
            <button onClick={() => onDeleteForever?.(note.id)} className="p-1 text-gray-500 hover:text-panic" title="Delete forever">
              <XCircle size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};