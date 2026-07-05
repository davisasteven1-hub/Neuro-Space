import { DegreeClass } from "../types/gpa";

export const getDegreeClass = (gpa: number): DegreeClass => {
  if (gpa >= 4.5) return "FIRST CLASS";
  if (gpa >= 3.5) return "SECOND CLASS UPPER";
  if (gpa >= 2.4) return "SECOND CLASS LOWER";
  if (gpa >= 1.5) return "THIRD CLASS";
  if (gpa >= 1.0) return "PASS";
  return "FAIL";
};

// Maps degree class to the shared safe/caution/panic-style palette used across the app
export const DEGREE_CLASS_THEME: Record<
  DegreeClass,
  { text: string; border: string; bg: string; badge: string }
> = {
  "FIRST CLASS": {
    text: "text-safe",
    border: "border-safe",
    bg: "bg-safe",
    badge: "bg-safe/10 text-safe border-safe/40",
  },
  "SECOND CLASS UPPER": {
    text: "text-cyan-300",
    border: "border-cyan-400",
    bg: "bg-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/40",
  },
  "SECOND CLASS LOWER": {
    text: "text-caution",
    border: "border-caution",
    bg: "bg-caution",
    badge: "bg-caution/10 text-caution border-caution/40",
  },
  "THIRD CLASS": {
    text: "text-orange-400",
    border: "border-orange-500",
    bg: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/40",
  },
  PASS: {
    text: "text-orange-500",
    border: "border-orange-600",
    bg: "bg-orange-600",
    badge: "bg-orange-600/10 text-orange-500 border-orange-600/40",
  },
  FAIL: {
    text: "text-panic",
    border: "border-panic",
    bg: "bg-panic",
    badge: "bg-panic/10 text-panic border-panic/40",
  },
};

export const getAcademicStanding = (gpa: number): string => {
  if (gpa >= 4.5) return "Excellent";
  if (gpa >= 3.5) return "Very Good";
  if (gpa >= 2.4) return "Good";
  if (gpa >= 1.5) return "Fair";
  if (gpa >= 1.0) return "Weak";
  return "Critical";
};

export const getStandingColor = (gpa: number): string => {
  if (gpa >= 4.5) return "text-safe";
  if (gpa >= 3.5) return "text-cyan-300";
  if (gpa >= 2.4) return "text-caution";
  if (gpa >= 1.5) return "text-orange-400";
  return "text-panic";
};
