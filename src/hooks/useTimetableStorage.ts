import { useEffect, useState } from "react";

export type Course = {
  id: number;
  code: string;
  title: string;
  units: number;
  type: "core" | "gst" | "lab";
  lecturer: string;
  venue: string;
  day: string;
  start: string;
  end: string;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STORAGE_KEY = "neurospace_timetable";

const seedCourses: Course[] = [
  { id: 1, code: "CSC201", title: "Computer Programming II", units: 3, type: "core", lecturer: "Dr. Musa", venue: "Lab A", day: "Monday", start: "08:00", end: "10:00" },
  { id: 2, code: "GST201", title: "Entrepreneurship", units: 1, type: "gst", lecturer: "Dr. Bello", venue: "LT3", day: "Monday", start: "12:00", end: "13:00" },
  { id: 3, code: "CSC203", title: "Programming Lab", units: 2, type: "lab", lecturer: "Dr. Ibrahim", venue: "Lab 2", day: "Wednesday", start: "14:00", end: "17:00" },
];

const loadCourses = (): Course[] => {
  if (typeof window === "undefined") return seedCourses;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCourses;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedCourses;
  } catch {
    return seedCourses;
  }
};

const saveCourses = (courses: Course[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // storage full or unavailable, fail silently
  }
};

// Reads/writes the same "neurospace_timetable" key that Timetable.tsx already
// owns. Timetable.tsx is untouched and remains the primary editor; this hook
// just gives the Dashboard (and anything else) read/write access to the same
// source of truth, matching the useExamStorage architecture.
export function useTimetableStorage(): [Course[], React.Dispatch<React.SetStateAction<Course[]>>, boolean] {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCourses(loadCourses());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    saveCourses(courses);
  }, [courses, loading]);

  return [courses, setCourses, loading];
}