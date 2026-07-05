import { useState, useEffect, useCallback } from 'react';
import { Note, Folder } from '../types/notes';
import { NOTES_STORAGE_KEY, FOLDERS_STORAGE_KEY, DEFAULT_FOLDERS } from '../constants/notesConstants';
import { generateId } from '../utils/notesUtils';

// This hook is the single point of contact between the Notes UI and storage.
// Swapping localStorage for Firebase/Supabase/an API later means rewriting
// the bodies of load/persist below — the returned interface (notes, setNotes,
// folders, setFolders, loading) stays the same, so no component needs to change.

interface UseNotesStorageResult {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  loading: boolean;
}

const buildDefaultFolders = (): Folder[] =>
  DEFAULT_FOLDERS.map((name) => ({
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  }));

export function useNotesStorage(): UseNotesStorageResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load once on mount.
  useEffect(() => {
    try {
      const rawNotes = window.localStorage.getItem(NOTES_STORAGE_KEY);
      setNotes(rawNotes ? (JSON.parse(rawNotes) as Note[]) : []);
    } catch {
      setNotes([]);
    }

    try {
      const rawFolders = window.localStorage.getItem(FOLDERS_STORAGE_KEY);
      setFolders(rawFolders ? (JSON.parse(rawFolders) as Folder[]) : buildDefaultFolders());
    } catch {
      setFolders(buildDefaultFolders());
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist notes whenever they change (skip the initial load tick).
  useEffect(() => {
    if (loading) return;
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to persist notes:', err);
    }
  }, [notes, loading]);

  // Persist folders whenever they change.
  useEffect(() => {
    if (loading) return;
    try {
      window.localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch (err) {
      console.error('Failed to persist folders:', err);
    }
  }, [folders, loading]);

  return { notes, setNotes, folders, setFolders, loading };
}