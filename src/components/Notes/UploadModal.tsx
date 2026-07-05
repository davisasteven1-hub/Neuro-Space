import React, { useState, useCallback, useRef } from 'react';
import { X, UploadCloud, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadModalProps {
  noteTitle: string;
  onUpload: (files: FileList | File[]) => Promise<{ succeeded: unknown[]; rejected: string[] }>;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ noteTitle, onUpload, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsUploading(true);
      setRejected([]);
      setSuccessCount(null);
      const result = await onUpload(files);
      setIsUploading(false);
      setSuccessCount(result.succeeded.length);
      setRejected(result.rejected);
    },
    [onUpload]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border-2 border-gray-700 bg-surface p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-gray-300">
            Upload to "{noteTitle || 'Untitled'}"
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed cursor-pointer transition-colors ${
            isDragging ? 'border-safe bg-safe/5 text-safe' : 'border-gray-700 text-gray-500 hover:border-gray-500'
          }`}
        >
          <UploadCloud size={28} />
          <span className="text-xs font-mono uppercase tracking-wide">
            {isUploading ? 'Uploading...' : 'Drag files here or click to browse'}
          </span>
          <span className="text-[10px] font-mono text-gray-600">PDF, DOCX, images, video, audio, archives — up to 4MB each</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {successCount !== null && successCount > 0 && (
          <p className="text-safe text-[11px] font-mono">{successCount} file(s) uploaded successfully.</p>
        )}

        {rejected.length > 0 && (
          <div className="flex flex-col gap-1 border border-panic/30 bg-panic/5 p-2">
            {rejected.map((r, i) => (
              <span key={i} className="flex items-center gap-1.5 text-panic text-[10px] font-mono">
                <AlertTriangle size={10} /> {r}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};