import React, { useState } from "react";
import { Rocket, Plus, Trash2, Sparkle } from "lucide-react";
import { PredictedCourse, Semester, Grade } from "../types/gpa";
import { GRADE_OPTIONS } from "../constants/gradingSystem";
import {
  calculatePredictedTotals,
  calculateCombinedPredictedCGPA,
  calculateBestCaseCGPA,
} from "../utils/gpaCalculator";
import { getCreditsCompleted } from "../utils/statistics";

interface GPAPredictorProps {
  semesters: Semester[];
  predictedCourses: PredictedCourse[];
  creditsRequired: number;
  onAdd: (course: Omit<PredictedCourse, "id">) => void;
  onDelete: (id: string) => void;
}

const GPAPredictor: React.FC<GPAPredictorProps> = ({
  semesters,
  predictedCourses,
  creditsRequired,
  onAdd,
  onDelete,
}) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [units, setUnits] = useState("3");
  const [expectedGrade, setExpectedGrade] = useState<Grade>("A");

  const predictedTotals = calculatePredictedTotals(predictedCourses);
  const combined = calculateCombinedPredictedCGPA(semesters, predictedCourses);

  const { unitsPassed } = getCreditsCompleted(semesters);
  const remainingUnits = Math.max(0, creditsRequired - unitsPassed);
  const bestCase = calculateBestCaseCGPA(semesters, remainingUnits);

  const handleAdd = () => {
    const unitsNumber = Number(units);
    if (!code.trim() || !unitsNumber || unitsNumber < 1) return;
    onAdd({ code: code.trim().toUpperCase(), title: title.trim() || code.trim().toUpperCase(), units: unitsNumber, expectedGrade });
    setCode("");
    setTitle("");
    setUnits("3");
    setExpectedGrade("A");
  };

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Rocket size={14} className="text-cyan-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          GPA Predictor
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {predictedCourses.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 p-2.5 bg-black/30 border border-gray-800 text-xs font-mono"
          >
            <span className="text-gray-300">
              <span className="text-gray-500 mr-2">{p.code}</span>
              {p.title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-gray-500">{p.units}u · {p.expectedGrade}</span>
              <button
                onClick={() => onDelete(p.id)}
                className="w-6 h-6 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
        {predictedCourses.length === 0 && (
          <div className="p-3 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-[10px] uppercase">
            Add courses you plan to take to preview your GPA impact.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          className="col-span-1 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="col-span-2 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
        />
        <input
          type="number"
          min={1}
          max={6}
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          placeholder="Units"
          className="col-span-1 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
        />
        <select
          value={expectedGrade}
          onChange={(e) => setExpectedGrade(e.target.value as Grade)}
          className="col-span-1 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAdd}
        className="w-full mb-4 py-2 border border-gray-700 text-gray-400 hover:border-cyan-400 hover:text-cyan-300 transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-1.5"
      >
        <Plus size={12} /> Add Planned Course
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-800">
        <div className="border border-gray-800 bg-black/30 p-3 text-center">
          <p className="text-lg font-bold text-white font-mono">{predictedTotals.gpa.toFixed(2)}</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">Predicted Semester GPA</p>
        </div>
        <div className="border border-cyan-500/40 bg-cyan-500/5 p-3 text-center">
          <p className="text-lg font-bold text-cyan-300 font-mono">{combined.gpa.toFixed(2)}</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">Predicted CGPA</p>
        </div>
        <div className="border border-safe/40 bg-safe/5 p-3 text-center flex flex-col items-center">
          <span className="flex items-center gap-1 text-lg font-bold text-safe font-mono">
            <Sparkle size={12} /> {bestCase.toFixed(2)}
          </span>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">
            Best Case (A in remaining {remainingUnits}u)
          </p>
        </div>
      </div>
    </div>
  );
};

export default GPAPredictor;
