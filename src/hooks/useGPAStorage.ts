import { useEffect, useState, useCallback } from "react";
import { GPAData, Semester, Course, PredictedCourse, ResetScope } from "../types/gpa";
import { DEFAULT_CREDITS_REQUIRED } from "../constants/gradingSystem";

const STORAGE_KEY = "neurospace_gpa";

const seedData: GPAData = {
  semesters: [
    {
      id: "sem-100l-first",
      level: "100L",
      term: "First Semester",
      courses: [
        { id: "c-csc101", code: "CSC101", title: "Introduction to Computer Science", units: 3, grade: "A" },
        { id: "c-gst111", code: "GST111", title: "Communication in English", units: 2, grade: "B" },
        { id: "c-mth101", code: "MTH101", title: "Elementary Mathematics I", units: 3, grade: "C" },
      ],
    },
  ],
  predictedCourses: [],
  creditsRequired: DEFAULT_CREDITS_REQUIRED,
};

const loadData = (): GPAData => {
  if (typeof window === "undefined") return seedData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.semesters)) {
      return {
        semesters: parsed.semesters,
        predictedCourses: Array.isArray(parsed.predictedCourses) ? parsed.predictedCourses : [],
        creditsRequired:
          typeof parsed.creditsRequired === "number" ? parsed.creditsRequired : DEFAULT_CREDITS_REQUIRED,
      };
    }
    return seedData;
  } catch {
    return seedData;
  }
};

const saveData = (data: GPAData) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — fail silently
  }
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const useGPAStorage = () => {
  const [data, setData] = useState<GPAData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addSemester = useCallback((level: string, term: string) => {
    setData((prev) => ({
      ...prev,
      semesters: [...prev.semesters, { id: makeId("sem"), level, term, courses: [] }],
    }));
  }, []);

  const deleteSemester = useCallback((semesterId: string) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.filter((s) => s.id !== semesterId),
    }));
  }, []);

  const addCourse = useCallback((semesterId: string, course: Omit<Course, "id">) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId ? { ...s, courses: [...s.courses, { ...course, id: makeId("course") }] } : s
      ),
    }));
  }, []);

  const updateCourse = useCallback((semesterId: string, course: Course) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId
          ? { ...s, courses: s.courses.map((c) => (c.id === course.id ? course : c)) }
          : s
      ),
    }));
  }, []);

  const deleteCourse = useCallback((semesterId: string, courseId: string) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) } : s
      ),
    }));
  }, []);

  const duplicateCourse = useCallback((semesterId: string, courseId: string) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => {
        if (s.id !== semesterId) return s;
        const original = s.courses.find((c) => c.id === courseId);
        if (!original) return s;
        return { ...s, courses: [...s.courses, { ...original, id: makeId("course") }] };
      }),
    }));
  }, []);

  const moveCourse = useCallback((fromSemesterId: string, toSemesterId: string, courseId: string) => {
    if (fromSemesterId === toSemesterId) return;
    setData((prev) => {
      const fromSem = prev.semesters.find((s) => s.id === fromSemesterId);
      const course = fromSem?.courses.find((c) => c.id === courseId);
      if (!course) return prev;

      return {
        ...prev,
        semesters: prev.semesters.map((s) => {
          if (s.id === fromSemesterId) return { ...s, courses: s.courses.filter((c) => c.id !== courseId) };
          if (s.id === toSemesterId) return { ...s, courses: [...s.courses, course] };
          return s;
        }),
      };
    });
  }, []);

  const addPredictedCourse = useCallback((course: Omit<PredictedCourse, "id">) => {
    setData((prev) => ({
      ...prev,
      predictedCourses: [...prev.predictedCourses, { ...course, id: makeId("pred") }],
    }));
  }, []);

  const updatePredictedCourse = useCallback((course: PredictedCourse) => {
    setData((prev) => ({
      ...prev,
      predictedCourses: prev.predictedCourses.map((p) => (p.id === course.id ? course : p)),
    }));
  }, []);

  const deletePredictedCourse = useCallback((courseId: string) => {
    setData((prev) => ({
      ...prev,
      predictedCourses: prev.predictedCourses.filter((p) => p.id !== courseId),
    }));
  }, []);

  const setCreditsRequired = useCallback((units: number) => {
    setData((prev) => ({ ...prev, creditsRequired: units }));
  }, []);

  const resetSemester = useCallback((semesterId: string) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => (s.id === semesterId ? { ...s, courses: [] } : s)),
    }));
  }, []);

  const resetLevel = useCallback((level: string) => {
    setData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => (s.level === level ? { ...s, courses: [] } : s)),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData({ semesters: [], predictedCourses: [], creditsRequired: DEFAULT_CREDITS_REQUIRED });
  }, []);

  const importData = useCallback((incoming: GPAData) => {
    setData({
      semesters: Array.isArray(incoming.semesters) ? incoming.semesters : [],
      predictedCourses: Array.isArray(incoming.predictedCourses) ? incoming.predictedCourses : [],
      creditsRequired:
        typeof incoming.creditsRequired === "number" ? incoming.creditsRequired : DEFAULT_CREDITS_REQUIRED,
    });
  }, []);

  return {
    data,
    setData,
    addSemester,
    deleteSemester,
    addCourse,
    updateCourse,
    deleteCourse,
    duplicateCourse,
    moveCourse,
    addPredictedCourse,
    updatePredictedCourse,
    deletePredictedCourse,
    setCreditsRequired,
    resetSemester,
    resetLevel,
    resetAll,
    importData,
  };
};
