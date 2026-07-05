import React from "react";
import { Sigma } from "lucide-react";
import { Semester } from "../types/gpa";
import { calculateSemesterHistory, calculateCGPA } from "../utils/gpaCalculator";

interface CGPACalculatorProps {
  semesters: Semester[];
}

const CGPACalculator: React.FC<CGPACalculatorProps> = ({ semesters }) => {
  const history = calculateSemesterHistory(semesters);
  const overall = calculateCGPA(semesters);

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sigma size={14} className="text-cyan-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Cumulative GPA Calculator
        </span>
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-gray-800 p-4 text-center text-gray-600 font-mono text-xs uppercase">
          No semesters recorded yet.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between text-xs font-mono text-gray-300 border-b border-gray-900 pb-1.5"
            >
              <span className="text-gray-400">{h.label}</span>
              <span className="text-white font-bold">{h.gpa.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-cyan-500/40">
        <span className="text-xs uppercase tracking-widest text-gray-400 font-mono font-bold">CGPA</span>
        <span className="text-2xl font-bold text-cyan-300 font-mono">{overall.gpa.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default CGPACalculator;
