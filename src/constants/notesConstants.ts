import { NoteColor, FileCategory } from '../types/notes';

export const NOTES_STORAGE_KEY = 'neurospace-notes';
export const FOLDERS_STORAGE_KEY = 'neurospace-folders';
export const FILES_STORAGE_KEY = 'neurospace-files';

// Files this large won't be attempted as base64 in localStorage — browsers
// typically cap localStorage around 5-10MB total, and base64 inflates size ~33%.
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB per file, soft safety limit

export const NOTE_COLOR_CLASSES: Record<NoteColor, { bg: string; border: string; dot: string }> = {
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', dot: 'bg-yellow-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', dot: 'bg-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', dot: 'bg-purple-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/40', dot: 'bg-green-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/40', dot: 'bg-red-400' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/40', dot: 'bg-gray-400' },
};

export const NOTE_COLORS: NoteColor[] = ['yellow', 'blue', 'purple', 'green', 'red', 'gray'];

export const DEFAULT_FOLDERS = [
  '100 Level',
  '200 Level',
  'Assignments',
  'Projects',
  'Algorithms',
  'Networking',
  'Past Questions',
  'Personal',
];

export const FILE_CATEGORY_EXTENSIONS: Record<FileCategory, string[]> = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'],
  images: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
  videos: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
  other: [],
};

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  documents: 'Documents',
  images: 'Images',
  videos: 'Videos',
  audio: 'Audio',
  archives: 'Archives',
  other: 'Other',
};

export const SUGGESTED_TAGS = ['React', 'Math', 'Exam', 'Programming', 'Networking', 'Important'];

export const AUTOSAVE_DEBOUNCE_MS = 1500;