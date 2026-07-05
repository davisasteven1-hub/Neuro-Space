import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onCancel}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm border-2 border-panic/50 bg-surface p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-panic">
          <AlertTriangle size={18} />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wide">{title}</h3>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <p className="text-xs font-mono text-gray-400 leading-relaxed">{message}</p>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 font-mono text-[10px] uppercase tracking-widest"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 border border-panic text-panic hover:bg-panic/10 font-mono text-[10px] uppercase tracking-widest"
        >
          {confirmLabel}
        </button>
      </div>
    </motion.div>
  </div>
);