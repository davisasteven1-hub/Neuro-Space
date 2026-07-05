import { Semester, Grade, GradeDistributionEntry, Insight } from "../types/gpa";
import { GRADE_OPTIONS } from "../constants/gradingSystem";
import { calculateSemesterHistory, round2 } from "./gpaCalculator";

export const getAllCourses = (semesters: Semester[]) => semesters.flatMap((s) => s.courses);

export const getGradeCounts = (semesters: Semester[]): Record<Grade, number> => {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 } as Record<Grade, number>;
  getAllCourses(semesters).forEach((c) => {
    counts[c.grade] = (counts[c.grade] ?? 0) + 1;
  });
  return counts;
};

export const getGradeDistribution = (semesters: Semester[]): GradeDistributionEntry[] => {
  const courses = getAllCourses(semesters);
  const total = courses.length;
  const counts = getGradeCounts(semesters);

  return GRADE_OPTIONS.map((grade) => ({
    grade,
    count: counts[grade],
    percent: total > 0 ? round2((counts[grade] / total) * 100) : 0,
  }));
};

export const getCreditsCompleted = (semesters: Semester[]) => {
  const courses = getAllCourses(semesters);
  const totalUnitsAttempted = courses.reduce((sum, c) => sum + c.units, 0);
  const unitsPassed = courses
    .filter((c) => c.grade !== "F")
    .reduce((sum, c) => sum + c.units, 0);
  return { totalUnitsAttempted, unitsPassed };
};

export const getCourseStatus = (grade: Grade) => (grade === "F" ? "Failed" : "Passed");

export const generateInsights = (semesters: Semester[]): Insight[] => {
  const history = calculateSemesterHistory(semesters);
  const insights: Insight[] = [];

  if (history.length === 0) {
    insights.push({
      type: "info",
      message: "Add your first semester to start tracking academic performance.",
    });
    return insights;
  }

  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const diff = round2(last.gpa - prev.gpa);

    if (diff > 0) {
      insights.push({
        type: "success",
        message: `Your GPA improved by ${diff.toFixed(2)} in ${last.label}. Keep it up.`,
      });
    } else if (diff < 0) {
      insights.push({
        type: "warning",
        message: `Your GPA dropped by ${Math.abs(diff).toFixed(2)} in ${last.label}. Review your weaker courses.`,
      });
    } else {
      insights.push({
        type: "info",
        message: `Your GPA held steady at ${last.gpa.toFixed(2)} in ${last.label}.`,
      });
    }
  }

  const counts = getGradeCounts(semesters);
  if (counts.F > 0) {
    insights.push({
      type: "warning",
      message: `You have ${counts.F} failed course${counts.F > 1 ? "s" : ""}. Prioritize resitting ${counts.F > 1 ? "these" : "this"}.`,
    });
  }

  const latestCgpa = history[history.length - 1]?.cgpa ?? 0;
  if (latestCgpa >= 4.5) {
    insights.push({ type: "success", message: "You're on track for a First Class. Stay consistent." });
  } else if (latestCgpa < 2.4 && history.length > 0) {
    insights.push({
      type: "warning",
      message: "Your CGPA is below Second Class Lower. Consider academic support resources.",
    });
  }

  return insights;
};
