import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Plus, Trash2, RotateCcw, Layers } from "lucide-react";
import { Course, Semester } from "../types/gpa";
import { calculateSemesterTotals } from "../utils/gpaCalculator";
import CourseTable from "./CourseTable";
import GPACalculator from "./GPACalculator";

interface SemesterCardProps {
  semester: Semester;
  otherSemesters: Semester[];
  defaultExpanded?: boolean;
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onDuplicateCourse: (courseId: string) => void;
  onMoveCourse: (courseId: string, targetSemesterId: string) => void;
  onDeleteSemester: () => void;
  onResetSemester: () => void;
}

const gpaColor = (gpa: number) => {
  if (gpa >= 4.5) return "text-safe border-safe/40 bg-safe/10";
  if (gpa >= 3.5) return "text-cyan-300 border-cyan-500/40 bg-cyan-500/10";
  if (gpa >= 2.4) return "text-caution border-caution/40 bg-caution/10";
  if (gpa >= 1.5) return "text-orange-400 border-orange-500/40 bg-orange-500/10";
  return "text-panic border-panic/40 bg-panic/10";
};

const SemesterCard: React.FC<SemesterCardProps> = ({
  semester,
  otherSemesters,
  defaultExpanded = false,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onDuplicateCourse,
  onMoveCourse,
  onDeleteSemester,
  onResetSemester,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const totals = calculateSemesterTotals(semester);

  return (
    <div className="flex flex-col">
      <div
        onClick={() => setExpanded((e) => !e)}
        className="group flex items-center justify-between p-4 bg-surface border border-gray-800 hover:border-gray-600 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-gray-500" />
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-base uppercase tracking-wide">
              {semester.level} <span className="text-gray-400">{semester.term}</span>
            </h3>
            <span className="text-[10px] text-gray-600 font-mono">
              {semester.courses.length} course{semester.courses.length !== 1 ? "s" : ""} · {totals.totalUnits} units
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${gpaColor(totals.gpa)}`}>
            GPA {totals.gpa.toFixed(2)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResetSemester();
            }}
            className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-caution hover:text-caution transition-all"
            title="Reset semester courses"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSemester();
            }}
            className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic transition-all"
            title="Delete semester"
          >
            <Trash2 size={12} />
          </button>
          <div className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-black/40 border-x border-b border-gray-800 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">Courses</span>
                <button
                  onClick={onAddCourse}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
                >
                  <Plus size={11} /> Add Course
                </button>
              </div>

              <CourseTable
                semesterId={semester.id}
                courses={semester.courses}
                otherSemesters={otherSemesters}
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
                onDuplicate={onDuplicateCourse}
                onMove={onMoveCourse}
              />

              <GPACalculator courses={semester.courses} title="Live GPA Calculation" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SemesterCard;
