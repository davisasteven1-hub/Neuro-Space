import React from "react";
import { PieChart } from "lucide-react";
import { Semester } from "../types/gpa";
import { getGradeDistribution } from "../utils/statistics";

interface GradeDistributionProps {
  semesters: Semester[];
}

const GRADE_HEX: Record<string, string> = {
  A: "#00FF9D",
  B: "#22D3EE",
  C: "#FFD700",
  D: "#FB923C",
  E: "#F97316",
  F: "#FF0000",
};

const GradeDistribution: React.FC<GradeDistributionProps> = ({ semesters }) => {
  const distribution = getGradeDistribution(semesters).filter((d) => d.count > 0);
  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={14} className="text-gray-500" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Grade Distribution
        </span>
      </div>

      {total === 0 ? (
        <div className="border border-dashed border-gray-800 p-8 text-center text-gray-600 font-mono text-xs uppercase">
          No graded courses yet.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg viewBox="0 0 150 150" className="w-40 h-40 -rotate-90 shrink-0">
            <circle cx="75" cy="75" r={radius} fill="none" stroke="#1f1f23" strokeWidth="18" />
            {distribution.map((d) => {
              const dash = (d.percent / 100) * circumference;
              const offset = circumference * (1 - cumulative / 100);
              cumulative += d.percent;
              return (
                <circle
                  key={d.grade}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={GRADE_HEX[d.grade]}
                  strokeWidth="18"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>

          <div className="flex flex-col gap-2 w-full">
            {distribution.map((d) => (
              <div key={d.grade} className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GRADE_HEX[d.grade] }} />
                  Grade {d.grade}
                </span>
                <span className="text-gray-500">
                  {d.count} course{d.count !== 1 ? "s" : ""} · {d.percent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeDistribution;
