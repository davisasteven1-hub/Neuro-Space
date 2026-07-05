import React from "react";
import { Pencil, Trash2, Copy, ArrowRightLeft } from "lucide-react";
import { Course, Semester } from "../types/gpa";
import { calculateCoursePoints } from "../utils/gpaCalculator";
import { getCourseStatus } from "../utils/statistics";
import { GRADE_POINTS } from "../constants/gradingSystem";

interface CourseTableProps {
  semesterId: string;
  courses: Course[];
  otherSemesters: Semester[];
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onDuplicate: (courseId: string) => void;
  onMove: (courseId: string, targetSemesterId: string) => void;
}

const GRADE_COLOR: Record<string, string> = {
  A: "text-safe border-safe/40 bg-safe/10",
  B: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
  C: "text-caution border-caution/40 bg-caution/10",
  D: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  E: "text-orange-500 border-orange-600/40 bg-orange-600/10",
  F: "text-panic border-panic/40 bg-panic/10",
};

const CourseTable: React.FC<CourseTableProps> = ({
  semesterId,
  courses,
  otherSemesters,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}) => {
  if (courses.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
        No courses added to this semester yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {courses.map((course) => {
        const status = getCourseStatus(course.grade);
        return (
          <div
            key={course.id}
            className={`group flex items-center justify-between gap-3 p-3 bg-black/30 border-l-4 ${
              status === "Failed" ? "border-panic" : "border-gray-800"
            } border-t border-r border-b border-gray-800 hover:border-gray-600 transition-all flex-wrap`}
          >
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${GRADE_COLOR[course.grade]}`}>
                  Grade {course.grade}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${
                    status === "Failed"
                      ? "bg-panic/10 text-panic border-panic/40"
                      : "bg-safe/10 text-safe border-safe/40"
                  }`}
                >
                  {status}
                </span>
                <span className="text-[9px] text-gray-500 font-mono">{course.units}u</span>
              </div>
              <p className="text-white font-bold text-sm">
                <span className="text-xs text-gray-500 mr-2">{course.code}</span>
                {course.title}
              </p>
              {course.remarks && <p className="text-[10px] text-gray-600 font-mono">{course.remarks}</p>}
            </div>

            <div className="text-right shrink-0 font-mono">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                {GRADE_POINTS[course.grade].toFixed(1)} × {course.units}
              </p>
              <p className="text-white font-bold">{calculateCoursePoints(course).toFixed(1)} pts</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {otherSemesters.length > 0 && (
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onMove(course.id, e.target.value);
                      e.target.value = "";
                    }}
                    title="Move to semester"
                    className="appearance-none w-8 h-8 bg-transparent border border-gray-700 text-gray-500 hover:border-safe hover:text-safe transition-all cursor-pointer text-[0px]"
                  >
                    <option value="" disabled>
                      Move
                    </option>
                    {otherSemesters.map((s) => (
                      <option key={s.id} value={s.id} className="bg-surface text-xs">
                        {s.level} {s.term}
                      </option>
                    ))}
                  </select>
                  <ArrowRightLeft size={12} className="absolute inset-0 m-auto pointer-events-none text-current" />
                </div>
              )}
              <button
                onClick={() => onDuplicate(course.id)}
                className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-cyan-400 hover:text-cyan-300 transition-all"
                title="Duplicate course"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={() => onEdit(course)}
                className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe transition-all"
                title="Edit course"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onDelete(course.id)}
                className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic transition-all"
                title="Delete course"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseTable;
