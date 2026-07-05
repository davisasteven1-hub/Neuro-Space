import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowUpRight, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Note, UploadedFile } from '../../types/notes';

interface Props {
  notes: Note[];
  files: UploadedFile[];
  index?: number;
}

const DashboardNotesCard: React.FC<Props> = ({ notes, files, index = 0 }) => {
  const activeNotes = notes.filter((n) => !n.trashed);

  const lastEdited = [...activeNotes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0] ?? null;

  const recentUploads = [...files]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-900">
        <BookOpen size={14} className="text-gray-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Recent Notes
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-bold font-mono text-white">{activeNotes.length}</span>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
          total notes
        </span>
      </div>

      {lastEdited ? (
        <div className="border-l-4 border-gray-700 border-t border-r border-b border-gray-800 bg-black/30 p-3 mb-3">
          <p className="text-white font-bold text-sm truncate">{lastEdited.title || 'Untitled'}</p>
          <p className="text-gray-500 text-[10px] font-mono mt-1">
            Last edited {new Date(lastEdited.updatedAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-xs font-mono leading-relaxed mb-3">
          No notes yet.
        </p>
      )}

      {recentUploads.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Recent Uploads</span>
          {recentUploads.map((f) => (
            <span key={f.id} className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono truncate">
              <Paperclip size={9} className="shrink-0" /> {f.name}
            </span>
          ))}
        </div>
      )}

      <Link
        to="/notes"
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        View notes <ArrowUpRight size={12} />
      </Link>
    </motion.div>
  );
};

export default DashboardNotesCard;