import { Grade } from "../types/gpa";

// Standard 5-point Nigerian university grading scale
export const GRADE_POINTS: Record<Grade, number> = {
  A: 5.0,
  B: 4.0,
  C: 3.0,
  D: 2.0,
  E: 1.0,
  F: 0.0,
};

export const GRADE_OPTIONS: Grade[] = ["A", "B", "C", "D", "E", "F"];

export const GRADE_LABELS: Record<Grade, string> = {
  A: "A (Excellent)",
  B: "B (Very Good)",
  C: "C (Good)",
  D: "D (Fair)",
  E: "E (Pass)",
  F: "F (Fail)",
};

export const LEVELS = ["100L", "200L", "300L", "400L", "500L", "600L"];

export const TERMS = ["First Semester", "Second Semester"];

export const DEFAULT_CREDITS_REQUIRED = 140;

export const MAX_GPA = 5.0;
