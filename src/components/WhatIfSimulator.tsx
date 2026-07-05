import React, { useMemo, useState } from "react";
import { FlaskConical, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Semester, Grade } from "../types/gpa";
import { GRADE_OPTIONS } from "../constants/gradingSystem";
import { simulateGradeChange } from "../utils/gpaCalculator";

interface WhatIfSimulatorProps {
  semesters: Semester[];
}

const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ semesters }) => {
  const allCourses = useMemo(
    () => semesters.flatMap((s) => s.courses.map((c) => ({ ...c, semesterLabel: `${s.level} ${s.term}` }))),
    [semesters]
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>(allCourses[0]?.id ?? "");
  const [hypotheticalGrade, setHypotheticalGrade] = useState<Grade>("A");

  const selectedCourse = allCourses.find((c) => c.id === selectedCourseId);

  const result = selectedCourseId
    ? simulateGradeChange(semesters, selectedCourseId, hypotheticalGrade)
    : null;

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={14} className="text-caution" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          What-If Simulator
        </span>
      </div>

      {allCourses.length === 0 ? (
        <div className="p-4 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
          Add courses to start simulating grade changes.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.semesterLabel}) — currently {c.grade}
                </option>
              ))}
            </select>

            <select
              value={hypotheticalGrade}
              onChange={(e) => setHypotheticalGrade(e.target.value as Grade)}
              className="bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  Change to {g}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && result && (
            <div className="flex items-center justify-center gap-4 sm:gap-6 p-4 border border-gray-800 bg-black/30 flex-wrap">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mb-1">Current CGPA</p>
                <p className="text-2xl font-bold text-gray-300 font-mono">{result.before.toFixed(2)}</p>
              </div>

              <ArrowRight size={20} className="text-gray-600" />

              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mb-1">
                  If {selectedCourse.code} → {hypotheticalGrade}
                </p>
                <p
                  className={`text-2xl font-bold font-mono ${
                    result.delta > 0 ? "text-safe" : result.delta < 0 ? "text-panic" : "text-gray-300"
                  }`}
                >
                  {result.after.toFixed(2)}
                </p>
              </div>

              <div
                className={`flex items-center gap-1 px-3 py-1.5 border text-xs font-bold font-mono uppercase ${
                  result.delta > 0
                    ? "border-safe/40 bg-safe/10 text-safe"
                    : result.delta < 0
                    ? "border-panic/40 bg-panic/10 text-panic"
                    : "border-gray-700 bg-gray-800/40 text-gray-400"
                }`}
              >
                {result.delta > 0 ? <TrendingUp size={12} /> : result.delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {result.delta > 0 ? "+" : ""}
                {result.delta.toFixed(2)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WhatIfSimulator;
