import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Star, Pin, Bold, Italic, Underline, List, ListOrdered, CheckSquare,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2,
  Paperclip, Trash2, Download, Eye, Pencil as PencilIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Note, UploadedFile, Folder, NoteColor } from '../../types/notes';
import { NOTE_COLORS, NOTE_COLOR_CLASSES, AUTOSAVE_DEBOUNCE_MS } from '../../constants/notesConstants';
import { TagSelector } from './TagSelector';
import { formatFileSize } from '../../utils/notesUtils';

interface NoteEditorProps {
  note: Note;
  folders: Folder[];
  attachments: UploadedFile[];
  allTags: string[];
  readingMode: boolean;
  onToggleReadingMode: () => void;
  onSave: (note: Note) => void;
  onClose: () => void;
  onUploadClick: () => void;
  onDeleteAttachment: (fileId: string) => void;
  onPreviewAttachment: (file: UploadedFile) => void;
}

// NOTE: uses document.execCommand for rich text formatting. It's deprecated
// but still supported across current major browsers. If it's ever removed,
// swap this toolbar + contentEditable div for a library like TipTap —
// the Note.content field (stored HTML) doesn't need to change.
const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  attachments,
  allTags,
  readingMode,
  onToggleReadingMode,
  onSave,
  onClose,
  onUploadClick,
  onDeleteAttachment,
  onPreviewAttachment,
}) => {
  const [title, setTitle] = useState(note.title);
  const [folderId, setFolderId] = useState<string | null>(note.folderId);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [color, setColor] = useState<NoteColor>(note.color);
  const [favorite, setFavorite] = useState(note.favorite);
  const [pinned, setPinned] = useState(note.pinned);

  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  // Initialize contentEditable HTML once, on mount only, so we don't fight
  // React's re-render / cursor position on every keystroke.
  useEffect(() => {
    if (contentRef.current && !hasInitialized.current) {
      contentRef.current.innerHTML = note.content;
      hasInitialized.current = true;
    }
  }, [note.content]);

  const buildCurrentNote = useCallback((): Note => ({
    ...note,
    title,
    content: contentRef.current?.innerHTML ?? note.content,
    folderId,
    tags,
    color,
    favorite,
    pinned,
    updatedAt: new Date().toISOString(),
  }), [note, title, folderId, tags, color, favorite, pinned]);

  // Autosave: debounce so we're not writing to storage on every keystroke.
  const scheduleAutosave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSave(buildCurrentNote());
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [buildCurrentNote, onSave]);

  useEffect(() => {
    scheduleAutosave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, folderId, tags, color, favorite, pinned]);

  // Ctrl+S saves immediately; Esc closes.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        onSave(buildCurrentNote());
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [buildCurrentNote, onSave, onClose]);

  const handleClose = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    onSave(buildCurrentNote());
    onClose();
  };

  const insertChecklistItem = () => exec('insertHTML', '<div><input type="checkbox" style="margin-right:6px" />Task item</div>');

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  const colorClasses = NOTE_COLOR_CLASSES[color];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`w-full max-w-2xl border-2 ${colorClasses.border} bg-surface flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled note"
            disabled={readingMode}
            className="flex-1 bg-transparent outline-none text-lg font-bold text-white placeholder-gray-600 disabled:opacity-70"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setFavorite(!favorite)} className="p-2 text-gray-500 hover:text-caution" title="Favorite">
              <Star size={16} className={favorite ? 'fill-caution text-caution' : ''} />
            </button>
            <button onClick={() => setPinned(!pinned)} className="p-2 text-gray-500 hover:text-safe" title="Pin">
              <Pin size={16} className={pinned ? 'fill-safe text-safe' : ''} />
            </button>
            <button
              onClick={onToggleReadingMode}
              className={`p-2 ${readingMode ? 'text-safe' : 'text-gray-500'} hover:text-safe`}
              title={readingMode ? 'Switch to edit mode' : 'Reading mode'}
            >
              {readingMode ? <PencilIcon size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={handleClose} className="p-2 text-gray-500 hover:text-white" title="Close (autosaves)">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Meta row: folder + colors */}
        {!readingMode && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-900 flex-wrap">
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="bg-void border border-gray-800 px-2 py-1 text-[10px] font-mono text-gray-300 outline-none"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded-full ${NOTE_COLOR_CLASSES[c].dot} ${color === c ? 'ring-2 ring-white' : ''}`}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}

        {/* Formatting toolbar */}
        {!readingMode && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-900 flex-wrap">
            {[
              { icon: Bold, cmd: 'bold', title: 'Bold' },
              { icon: Italic, cmd: 'italic', title: 'Italic' },
              { icon: Underline, cmd: 'underline', title: 'Underline' },
              { icon: Heading1, cmd: 'formatBlock', value: '<h1>', title: 'Heading 1' },
              { icon: Heading2, cmd: 'formatBlock', value: '<h2>', title: 'Heading 2' },
              { icon: List, cmd: 'insertUnorderedList', title: 'Bullet list' },
              { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered list' },
              { icon: Quote, cmd: 'formatBlock', value: '<blockquote>', title: 'Quote' },
              { icon: Code, cmd: 'formatBlock', value: '<pre>', title: 'Code block' },
            ].map(({ icon: Icon, cmd, value, title }) => (
              <button
                key={title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(cmd, value)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800"
                title={title}
              >
                <Icon size={14} />
              </button>
            ))}
            <button onMouseDown={(e) => e.preventDefault()} onClick={insertChecklistItem} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800" title="Checklist">
              <CheckSquare size={14} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800" title="Link">
              <LinkIcon size={14} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={insertImage} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800" title="Insert image">
              <ImageIcon size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            ref={contentRef}
            contentEditable={!readingMode}
            suppressContentEditableWarning
            onInput={scheduleAutosave}
            className="prose prose-invert prose-sm max-w-none min-h-[200px] outline-none text-gray-200 font-mono text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-safe [&_blockquote]:pl-3 [&_blockquote]:text-gray-400 [&_pre]:bg-void [&_pre]:p-2 [&_pre]:border [&_pre]:border-gray-800"
          />
        </div>

        {/* Tags + attachments */}
        {!readingMode && (
          <div className="border-t border-gray-900 p-4 flex flex-col gap-3">
            <TagSelector selectedTags={tags} onChange={setTags} allTags={allTags} />

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono flex items-center gap-1">
                <Paperclip size={11} /> Attachments ({attachments.length})
              </span>
              <button
                onClick={onUploadClick}
                className="px-2 py-1 border border-gray-700 text-gray-400 hover:border-safe hover:text-safe text-[10px] font-mono uppercase"
              >
                Upload
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between px-2 py-1.5 border border-gray-800 bg-void">
                    <button
                      onClick={() => onPreviewAttachment(file)}
                      className="flex-1 text-left text-xs font-mono text-gray-300 truncate hover:text-safe"
                    >
                      {file.name}
                    </button>
                    <span className="text-[10px] text-gray-600 font-mono shrink-0 mx-2">{formatFileSize(file.size)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={file.dataURL} download={file.name} className="p-1 text-gray-500 hover:text-safe" title="Download">
                        <Download size={12} />
                      </a>
                      <button onClick={() => onDeleteAttachment(file.id)} className="p-1 text-gray-500 hover:text-panic" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};