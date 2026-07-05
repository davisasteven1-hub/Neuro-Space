import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Folder } from '../../types/notes';

interface FolderModalProps {
  folder: Folder | null; // null = creating new
  existingNames: string[];
  onSave: (name: string) => void;
  onClose: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({ folder, existingNames, onSave, onClose }) => {
  const [name, setName] = useState(folder?.name ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name cannot be empty.');
      return;
    }
    const isDuplicate = existingNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== (folder?.name ?? '').toLowerCase()
    );
    if (isDuplicate) {
      setError('A folder with this name already exists.');
      return;
    }
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm border-2 border-gray-700 bg-surface p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300">
            <FolderPlus size={16} />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest">
              {folder ? 'Rename Folder' : 'New Folder'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          placeholder="e.g. Algorithms"
          className="bg-void border border-gray-700 px-3 py-2 text-sm font-mono text-gray-200 outline-none focus:border-safe w-full"
        />

        {error && <p className="text-panic text-[11px] font-mono">{error}</p>}

        <button
          onClick={handleSave}
          className="py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe font-mono text-[10px] uppercase tracking-widest"
        >
          {folder ? 'Save Changes' : 'Create Folder'}
        </button>
      </motion.div>
    </div>
  );
};