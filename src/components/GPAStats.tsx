import React from "react";
import { BarChart3 } from "lucide-react";
import { Semester } from "../types/gpa";
import { getGradeCounts } from "../utils/statistics";
import { GRADE_OPTIONS } from "../constants/gradingSystem";

interface GPAStatsProps {
  semesters: Semester[];
}

const GRADE_TEXT: Record<string, string> = {
  A: "text-safe",
  B: "text-cyan-300",
  C: "text-caution",
  D: "text-orange-400",
  E: "text-orange-500",
  F: "text-panic",
};

const GRADE_BORDER: Record<string, string> = {
  A: "border-safe/40",
  B: "border-cyan-500/40",
  C: "border-caution/40",
  D: "border-orange-500/40",
  E: "border-orange-600/40",
  F: "border-panic/40",
};

const GPAStats: React.FC<GPAStatsProps> = ({ semesters }) => {
  const counts = getGradeCounts(semesters);

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-gray-500" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Academic Statistics
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {GRADE_OPTIONS.map((g) => (
          <div key={g} className={`border ${GRADE_BORDER[g]} bg-black/30 p-3 flex flex-col items-center gap-1`}>
            <span className={`text-2xl font-bold font-mono ${GRADE_TEXT[g]}`}>{counts[g]}</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Grade {g}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GPAStats;
