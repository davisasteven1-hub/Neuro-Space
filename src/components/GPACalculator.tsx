import React from "react";
import { Calculator } from "lucide-react";
import { Course } from "../types/gpa";
import { calculateTotals, calculateCoursePoints } from "../utils/gpaCalculator";
import { GRADE_POINTS } from "../constants/gradingSystem";

interface GPACalculatorProps {
  courses: Course[];
  title?: string;
}

const GPACalculator: React.FC<GPACalculatorProps> = ({ courses, title = "Semester Calculation" }) => {
  const totals = calculateTotals(courses);

  if (courses.length === 0) {
    return (
      <div className="border border-dashed border-gray-800 p-4 text-center text-gray-600 font-mono text-xs uppercase">
        No courses to calculate yet.
      </div>
    );
  }

  return (
    <div className="border border-gray-800 bg-black/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={12} className="text-gray-500" />
        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">{title}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between text-xs font-mono text-gray-300 border-b border-gray-900 pb-1.5"
          >
            <span className="text-gray-400">{c.code}</span>
            <span className="text-gray-600">
              {c.grade} ({GRADE_POINTS[c.grade].toFixed(1)}) × {c.units}u
            </span>
            <span className="text-white font-bold">{calculateCoursePoints(c).toFixed(1)} pts</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
          {totals.totalUnits} Units · {totals.totalPoints.toFixed(1)} Points
        </span>
        <span className="text-lg font-bold text-safe font-mono">GPA {totals.gpa.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default GPACalculator;
