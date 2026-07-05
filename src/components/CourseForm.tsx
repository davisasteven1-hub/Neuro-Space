import React, { useState } from "react";
import { BookOpen, AlertTriangle } from "lucide-react";
import { Course, Grade } from "../types/gpa";
import { GRADE_OPTIONS } from "../constants/gradingSystem";

interface CourseFormProps {
  course: Course | null;
  semesterLabel: string;
  onSave: (course: Omit<Course, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, semesterLabel, onSave, onClose }) => {
  const [code, setCode] = useState(course?.code ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [units, setUnits] = useState(String(course?.units ?? 3));
  const [grade, setGrade] = useState<Grade>(course?.grade ?? "A");
  const [remarks, setRemarks] = useState(course?.remarks ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !title.trim()) {
      setError("Course code and title are required.");
      return;
    }

    const unitsNumber = Number(units);
    if (!unitsNumber || unitsNumber < 1) {
      setError("Units must be a number of at least 1.");
      return;
    }

    onSave({
      id: course?.id,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      units: unitsNumber,
      grade,
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="border-2 border-gray-800 bg-surface p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1 border-b border-gray-800 pb-3">
          <BookOpen size={16} className="text-safe" />
          <h2 className="text-white font-bold uppercase tracking-widest text-sm">
            {course ? "Edit Course" : "Add Course"}
          </h2>
        </div>
        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-4 mt-2">{semesterLabel}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
              placeholder="CSC201"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
              placeholder="Data Structures"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Credit Units
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as Grade)}
                className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Remarks (optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
              placeholder="e.g. Resit recommended"
            />
          </div>

          {error && (
            <p className="text-panic text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={11} /> {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe active:bg-safe/10 font-mono text-[10px] uppercase tracking-widest transition-colors"
            >
              {course ? "Save Changes" : "Add Course"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 font-mono text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
