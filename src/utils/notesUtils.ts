import { Note, UploadedFile, Folder, FileCategory, SortOption, NotesStats } from '../types/notes';
import { FILE_CATEGORY_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../constants/notesConstants';

// ---------- IDs ----------

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// ---------- File helpers ----------

export const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const categorizeFile = (extension: string): FileCategory => {
  const ext = extension.toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORY_EXTENSIONS) as [FileCategory, string[]][]) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const isFileTooLarge = (file: File): boolean => file.size > MAX_FILE_SIZE_BYTES;

// ---------- Text helpers ----------

// Rich text content is stored as HTML; for search/preview we need plain text.
export const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent ?? '';
};

export const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;

// ---------- Search ----------

export const searchNotes = (
  notes: Note[],
  files: UploadedFile[],
  folders: Folder[],
  query: string
): Note[] => {
  const q = query.trim().toLowerCase();
  if (!q) return notes;

  const folderNameById = new Map(folders.map((f) => [f.id, f.name.toLowerCase()]));
  const filesByNoteId = new Map<string, UploadedFile[]>();
  files.forEach((f) => {
    if (!filesByNoteId.has(f.noteId)) filesByNoteId.set(f.noteId, []);
    filesByNoteId.get(f.noteId)!.push(f);
  });

  return notes.filter((note) => {
    if (note.title.toLowerCase().includes(q)) return true;
    if (stripHtml(note.content).toLowerCase().includes(q)) return true;
    if (note.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (note.folderId && folderNameById.get(note.folderId)?.includes(q)) return true;
    const attached = filesByNoteId.get(note.id) ?? [];
    if (attached.some((f) => f.name.toLowerCase().includes(q))) return true;
    return false;
  });
};

// ---------- Sorting ----------

export const sortNotes = (notes: Note[], sortBy: SortOption, files: UploadedFile[]): Note[] => {
  const list = [...notes];

  const fileSizeForNote = (noteId: string): number =>
    files.filter((f) => f.noteId === noteId).reduce((sum, f) => sum + f.size, 0);

  const withPinnedFirst = (compareFn: (a: Note, b: Note) => number) => {
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return compareFn(a, b);
    });
  };

  switch (sortBy) {
    case 'oldest':
      return withPinnedFirst((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'az':
      return withPinnedFirst((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return withPinnedFirst((a, b) => b.title.localeCompare(a.title));
    case 'recentlyEdited':
      return withPinnedFirst((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'largestFile':
      return withPinnedFirst((a, b) => fileSizeForNote(b.id) - fileSizeForNote(a.id));
    case 'smallestFile':
      return withPinnedFirst((a, b) => fileSizeForNote(a.id) - fileSizeForNote(b.id));
    case 'newest':
    default:
      return withPinnedFirst((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

// ---------- Stats ----------

export const calculateStats = (notes: Note[], folders: Folder[], files: UploadedFile[]): NotesStats => {
  const activeNotes = notes.filter((n) => !n.trashed);
  const categoryCounts: Record<FileCategory, number> = {
    documents: 0,
    images: 0,
    videos: 0,
    audio: 0,
    archives: 0,
    other: 0,
  };
  let storageUsedBytes = 0;
  let largestFile: UploadedFile | null = null;

  files.forEach((f) => {
    categoryCounts[f.category] += 1;
    storageUsedBytes += f.size;
    if (!largestFile || f.size > largestFile.size) largestFile = f;
  });

  return {
    totalNotes: activeNotes.length,
    totalFolders: folders.length,
    totalFiles: files.length,
    favoritesCount: activeNotes.filter((n) => n.favorite).length,
    pinnedCount: activeNotes.filter((n) => n.pinned).length,
    storageUsedBytes,
    largestFile,
    categoryCounts,
  };
};

// ---------- Note factory ----------

export const createBlankNote = (folderId: string | null = null): Note => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: '',
    content: '',
    folderId,
    tags: [],
    color: 'gray',
    favorite: false,
    pinned: false,
    trashed: false,
    createdAt: now,
    updatedAt: now,
    attachmentIds: [],
  };
};