export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export type CourseStatus = "Passed" | "Failed";

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  grade: Grade;
  remarks?: string;
}

export interface Semester {
  id: string;
  level: string; // e.g. "100L"
  term: string; // "First Semester" | "Second Semester"
  courses: Course[];
}

export interface PredictedCourse {
  id: string;
  code: string;
  title: string;
  units: number;
  expectedGrade: Grade;
}

export type DegreeClass =
  | "FIRST CLASS"
  | "SECOND CLASS UPPER"
  | "SECOND CLASS LOWER"
  | "THIRD CLASS"
  | "PASS"
  | "FAIL";

export interface GPAData {
  semesters: Semester[];
  predictedCourses: PredictedCourse[];
  creditsRequired: number;
}

export interface SemesterTotals {
  totalUnits: number;
  totalPoints: number;
  gpa: number;
}

export interface GradeDistributionEntry {
  grade: Grade;
  count: number;
  percent: number;
}

export interface Insight {
  type: "success" | "warning" | "info";
  message: string;
}

export type ResetScope = "semester" | "level" | "all";
