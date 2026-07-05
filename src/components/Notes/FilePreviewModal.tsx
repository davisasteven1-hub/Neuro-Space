import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Video, Music, Archive, File as FileIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { UploadedFile } from '../../types/notes';
import { formatFileSize } from '../../utils/notesUtils';
import { CATEGORY_LABELS } from '../../constants/notesConstants';

interface FilePreviewModalProps {
  file: UploadedFile;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<UploadedFile['category'], React.ReactNode> = {
  documents: <FileText size={14} />,
  images: <ImageIcon size={14} />,
  videos: <Video size={14} />,
  audio: <Music size={14} />,
  archives: <Archive size={14} />,
  other: <FileIcon size={14} />,
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (file.extension === 'txt' || file.type === 'text/plain') {
      try {
        // dataURL is base64; decode just enough to show as plain text
        const base64 = file.dataURL.split(',')[1] ?? '';
        setTextContent(atob(base64));
      } catch {
        setTextContent(null);
      }
    }
  }, [file]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.dataURL;
    a.download = file.name;
    a.click();
  };

  const renderPreview = () => {
    if (file.category === 'images') {
      return <img src={file.dataURL} alt={file.name} className="max-w-full max-h-[60vh] object-contain mx-auto" />;
    }
    if (file.extension === 'pdf') {
      return <iframe src={file.dataURL} title={file.name} className="w-full h-[60vh] border border-gray-800" />;
    }
    if (textContent !== null) {
      return (
        <pre className="w-full max-h-[60vh] overflow-auto bg-void border border-gray-800 p-3 text-xs font-mono text-gray-300 whitespace-pre-wrap">
          {textContent}
        </pre>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12 border border-dashed border-gray-800 text-gray-600">
        <FileIcon size={28} />
        <span className="text-xs font-mono uppercase">Preview unavailable</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl border-2 border-gray-700 bg-surface p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-gray-200 min-w-0">
            {CATEGORY_ICONS[file.category]}
            <h3 className="text-sm font-bold font-mono truncate">{file.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white shrink-0">
            <X size={16} />
          </button>
        </div>

        {renderPreview()}

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500 border-t border-gray-900 pt-3">
          <span>Type: <span className="text-gray-300">{CATEGORY_LABELS[file.category]}</span></span>
          <span>Extension: <span className="text-gray-300">.{file.extension}</span></span>
          <span>Size: <span className="text-gray-300">{formatFileSize(file.size)}</span></span>
          <span>Uploaded: <span className="text-gray-300">{new Date(file.uploadedAt).toLocaleDateString()}</span></span>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe font-mono text-[10px] uppercase tracking-widest"
        >
          <Download size={12} /> Download
        </button>
      </motion.div>
    </div>
  );
};