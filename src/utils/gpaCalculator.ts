import { Course, Semester, Grade, PredictedCourse, SemesterTotals } from "../types/gpa";
import { GRADE_POINTS } from "../constants/gradingSystem";

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export const gradeToPoint = (grade: Grade): number => GRADE_POINTS[grade] ?? 0;

export const calculateCoursePoints = (course: { units: number; grade: Grade }): number =>
  gradeToPoint(course.grade) * course.units;

export const calculateTotals = (
  courses: { units: number; grade: Grade }[]
): SemesterTotals => {
  const totalUnits = courses.reduce((sum, c) => sum + c.units, 0);
  const totalPoints = courses.reduce((sum, c) => sum + calculateCoursePoints(c), 0);
  const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
  return { totalUnits, totalPoints, gpa: round2(gpa) };
};

export const calculateSemesterGPA = (semester: Semester): number =>
  calculateTotals(semester.courses).gpa;

export const calculateSemesterTotals = (semester: Semester): SemesterTotals =>
  calculateTotals(semester.courses);

export const calculateCGPA = (semesters: Semester[]): SemesterTotals => {
  const allCourses = semesters.flatMap((s) => s.courses);
  return calculateTotals(allCourses);
};

// Chronological ordering helper — sorts semesters by level then term
export const sortSemesters = (semesters: Semester[]): Semester[] => {
  const termOrder: Record<string, number> = { "First Semester": 0, "Second Semester": 1 };
  return [...semesters].sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level, undefined, { numeric: true });
    return (termOrder[a.term] ?? 0) - (termOrder[b.term] ?? 0);
  });
};

// Returns per-semester GPA plus running CGPA at that point in time — used for the graph
export const calculateSemesterHistory = (
  semesters: Semester[]
): { id: string; label: string; gpa: number; cgpa: number }[] => {
  const ordered = sortSemesters(semesters);
  let cumUnits = 0;
  let cumPoints = 0;

  return ordered.map((s) => {
    const t = calculateTotals(s.courses);
    cumUnits += t.totalUnits;
    cumPoints += t.totalPoints;
    const cgpa = cumUnits > 0 ? round2(cumPoints / cumUnits) : 0;
    return {
      id: s.id,
      label: `${s.level} ${s.term === "First Semester" ? "1st" : "2nd"}`,
      gpa: t.gpa,
      cgpa,
    };
  });
};

export const calculatePredictedTotals = (predictedCourses: PredictedCourse[]): SemesterTotals =>
  calculateTotals(predictedCourses.map((p) => ({ units: p.units, grade: p.expectedGrade })));

// Combines existing academic record with hypothetical future courses
export const calculateCombinedPredictedCGPA = (
  semesters: Semester[],
  predictedCourses: PredictedCourse[]
): SemesterTotals => {
  const current = calculateCGPA(semesters);
  const predicted = calculatePredictedTotals(predictedCourses);
  const totalUnits = current.totalUnits + predicted.totalUnits;
  const totalPoints = current.totalPoints + predicted.totalPoints;
  return {
    totalUnits,
    totalPoints,
    gpa: totalUnits > 0 ? round2(totalPoints / totalUnits) : 0,
  };
};

// Best-case scenario: score an A in every remaining unit toward graduation
export const calculateBestCaseCGPA = (
  semesters: Semester[],
  remainingUnits: number
): number => {
  const current = calculateCGPA(semesters);
  const bestPoints = current.totalPoints + Math.max(0, remainingUnits) * GRADE_POINTS.A;
  const bestUnits = current.totalUnits + Math.max(0, remainingUnits);
  return bestUnits > 0 ? round2(bestPoints / bestUnits) : 0;
};

// What-if: recompute CGPA as though one course had a different grade, without mutating state
export const simulateGradeChange = (
  semesters: Semester[],
  courseId: string,
  hypotheticalGrade: Grade
): { before: number; after: number; delta: number } => {
  const before = calculateCGPA(semesters).gpa;

  const modified = semesters.map((s) => ({
    ...s,
    courses: s.courses.map((c) => (c.id === courseId ? { ...c, grade: hypotheticalGrade } : c)),
  }));

  const after = calculateCGPA(modified).gpa;
  return { before, after, delta: round2(after - before) };
};

export const findCourseById = (
  semesters: Semester[],
  courseId: string
): { course: Course; semester: Semester } | null => {
  for (const s of semesters) {
    const course = s.courses.find((c) => c.id === courseId);
    if (course) return { course, semester: s };
  }
  return null;
};
