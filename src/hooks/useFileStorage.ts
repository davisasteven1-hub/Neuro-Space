import { useState, useEffect, useCallback } from 'react';
import { UploadedFile } from '../types/notes';
import { FILES_STORAGE_KEY } from '../constants/notesConstants';
import { generateId, getExtension, categorizeFile, readFileAsDataURL, isFileTooLarge } from '../utils/notesUtils';

interface UseFileStorageResult {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  loading: boolean;
  uploadFiles: (noteId: string, fileList: FileList | File[]) => Promise<{ succeeded: UploadedFile[]; rejected: string[] }>;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  getFilesForNote: (noteId: string) => UploadedFile[];
}

export function useFileStorage(): UseFileStorageResult {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILES_STORAGE_KEY);
      setFiles(raw ? (JSON.parse(raw) as UploadedFile[]) : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      window.localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
    } catch (err) {
      // Most likely QuotaExceededError — base64 files fill localStorage fast.
      console.error('Failed to persist files (storage may be full):', err);
    }
  }, [files, loading]);

  // Reads each file as a data URL and appends it to storage. Returns which
  // files succeeded and which were rejected (with a reason) so the caller
  // (UploadModal) can show per-file feedback instead of an all-or-nothing result.
  const uploadFiles = useCallback(
    async (noteId: string, fileList: FileList | File[]): Promise<{ succeeded: UploadedFile[]; rejected: string[] }> => {
      const fileArray = Array.from(fileList);
      const succeeded: UploadedFile[] = [];
      const rejected: string[] = [];

      for (const file of fileArray) {
        if (isFileTooLarge(file)) {
          rejected.push(`${file.name} (too large — 4MB limit per file)`);
          continue;
        }
        try {
          const dataURL = await readFileAsDataURL(file);
          const extension = getExtension(file.name);
          const uploaded: UploadedFile = {
            id: generateId(),
            noteId,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            extension,
            uploadedAt: new Date().toISOString(),
            dataURL,
            category: categorizeFile(extension),
          };
          succeeded.push(uploaded);
        } catch {
          rejected.push(`${file.name} (failed to read)`);
        }
      }

      if (succeeded.length > 0) {
        setFiles((prev) => [...prev, ...succeeded]);
      }

      return { succeeded, rejected };
    },
    []
  );

  const deleteFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const renameFile = useCallback((fileId: string, newName: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f)));
  }, []);

  const getFilesForNote = useCallback(
    (noteId: string) => files.filter((f) => f.noteId === noteId),
    [files]
  );

  return { files, setFiles, loading, uploadFiles, deleteFile, renameFile, getFilesForNote };
}