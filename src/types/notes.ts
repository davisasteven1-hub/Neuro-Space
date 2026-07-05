export type ViewMode = 'grid' | 'compact' | 'list';
export type SortOption =
  | 'newest'
  | 'oldest'
  | 'az'
  | 'za'
  | 'recentlyEdited'
  | 'largestFile'
  | 'smallestFile';

export type NoteColor = 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray';

export type FileCategory = 'documents' | 'images' | 'videos' | 'audio' | 'archives' | 'other';

export type SidebarView =
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'recent' }
  | { type: 'trash' }
  | { type: 'folder'; folderId: string }
  | { type: 'tag'; tag: string };

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  collapsed?: boolean;
}

export interface UploadedFile {
  id: string;
  noteId: string;
  name: string;
  size: number;
  type: string; // MIME type
  extension: string;
  uploadedAt: string;
  dataURL: string;
  category: FileCategory;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML string from the rich text editor
  folderId: string | null;
  tags: string[];
  color: NoteColor;
  favorite: boolean;
  pinned: boolean;
  trashed: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  attachmentIds: string[];
}

export interface NotesStats {
  totalNotes: number;
  totalFolders: number;
  totalFiles: number;
  favoritesCount: number;
  pinnedCount: number;
  storageUsedBytes: number;
  largestFile: UploadedFile | null;
  categoryCounts: Record<FileCategory, number>;
}