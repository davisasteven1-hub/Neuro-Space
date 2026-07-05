import React from 'react';
import { FileQuestion, FolderOpen, SearchX, Inbox, LucideIcon } from 'lucide-react';

type EmptyStateVariant = 'no-notes' | 'no-files' | 'no-search-results' | 'no-folder-notes' | 'trash-empty';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: LucideIcon; title: string; subtitle: string }> = {
  'no-notes': {
    icon: Inbox,
    title: 'No notes yet',
    subtitle: 'Create your first note to start building your knowledge base.',
  },
  'no-files': {
    icon: FileQuestion,
    title: 'No files attached',
    subtitle: 'Upload PDFs, images, or documents to keep everything in one place.',
  },
  'no-search-results': {
    icon: SearchX,
    title: 'No results found',
    subtitle: 'Try a different search term or clear your filters.',
  },
  'no-folder-notes': {
    icon: FolderOpen,
    title: 'This folder is empty',
    subtitle: 'Move a note here or create a new one.',
  },
  'trash-empty': {
    icon: Inbox,
    title: 'Trash is empty',
    subtitle: 'Deleted notes will show up here before being permanently removed.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ variant, actionLabel, onAction }) => {
  const { icon: Icon, title, subtitle } = VARIANT_CONFIG[variant];
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 border border-dashed border-gray-800 text-center">
      <Icon size={32} className="text-gray-700" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-mono text-gray-400 uppercase tracking-wide">{title}</span>
        <span className="text-xs font-mono text-gray-600">{subtitle}</span>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe text-[10px] font-mono uppercase tracking-widest"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};