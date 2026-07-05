import React, { useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Upload,
  Printer,
  RotateCcw,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

import { Course, Semester, GPAData, Grade } from "../types/gpa";
import { LEVELS, TERMS } from "../constants/gradingSystem";
import { useGPAStorage } from "../hooks/useGPAStorage";
import {
  calculateCGPA,
  calculateSemesterHistory,
  sortSemesters,
} from "../utils/gpaCalculator";
import { getDegreeClass } from "../utils/degreeClassification";
import { getCreditsCompleted, generateInsights, getCourseStatus } from "../utils/statistics";

import GPADashboard from "../components/GPADashboard";
import SemesterCard from "../components/SemesterCard";
import CourseForm from "../components/CourseForm";
import CGPACalculator from "../components/CGPACalculator";
import GPAStats from "../components/GPAStats";
import CreditTracker from "../components/CreditTracker";
import SemesterGraph from "../components/SemesterGraph";
import GradeDistribution from "../components/GradeDistribution";
import AcademicInsights from "../components/AcademicInsights";
import GPAPredictor from "../components/GPAPredictor";
import WhatIfSimulator from "../components/WhatIfSimulator";

type CourseFilter = "all" | "passed" | "failed";

// ---------- Import / Export helpers ----------

const escapeCSV = (val: string): string => `"${String(val ?? "").replace(/"/g, '""')}"`;

const dataToCSV = (semesters: Semester[]): string => {
  const headers = ["level", "term", "code", "title", "units", "grade"];
  const rows: string[] = [];
  semesters.forEach((s) => {
    s.courses.forEach((c) => {
      rows.push([s.level, s.term, c.code, c.title, String(c.units), c.grade].map(escapeCSV).join(","));
    });
  });
  return [headers.join(","), ...rows].join("\n");
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      values.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  values.push(cur);
  return values;
};

const csvToSemesters = (text: string): Semester[] => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const semMap = new Map<string, Semester>();

  lines.slice(1).filter(Boolean).forEach((line) => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));

    const key = `${obj.level}__${obj.term}`;
    if (!semMap.has(key)) {
      semMap.set(key, { id: `sem-${key}-${Date.now()}`, level: obj.level, term: obj.term, courses: [] });
    }
    semMap.get(key)!.courses.push({
      id: `course-${Date.now()}-${Math.random()}`,
      code: obj.code,
      title: obj.title,
      units: Number(obj.units) || 1,
      grade: (obj.grade || "A") as Grade,
    });
  });

  return Array.from(semMap.values());
};

const triggerDownload = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------- Component ----------

const GPA: React.FC = () => {
  const gpaStore = useGPAStorage();
  const { data } = gpaStore;
  const { semesters, predictedCourses, creditsRequired } = data;

  const [expandedFormSemesterId, setExpandedFormSemesterId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const [showAddSemester, setShowAddSemester] = useState(false);
  const [newSemLevel, setNewSemLevel] = useState(LEVELS[0]);
  const [newSemTerm, setNewSemTerm] = useState(TERMS[0]);

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<CourseFilter>("all");

  const [resetLevelChoice, setResetLevelChoice] = useState(LEVELS[0]);
  const [resetSemesterChoice, setResetSemesterChoice] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderedSemesters = useMemo(() => sortSemesters(semesters), [semesters]);
  const history = useMemo(() => calculateSemesterHistory(semesters), [semesters]);
  const overall = useMemo(() => calculateCGPA(semesters), [semesters]);
  const { totalUnitsAttempted, unitsPassed } = useMemo(() => getCreditsCompleted(semesters), [semesters]);
  const insights = useMemo(() => generateInsights(semesters), [semesters]);

  const currentLevel = orderedSemesters.length > 0 ? orderedSemesters[orderedSemesters.length - 1].level : "";
  const currentGPA = history.length > 0 ? history[history.length - 1].gpa : 0;
  const degreeClass = getDegreeClass(overall.gpa);

  // ---------- Course search across all semesters ----------
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const active = q || levelFilter !== "all" || gradeFilter !== "all" || statusFilter !== "all";
    if (!active) return null;

    const results: { course: Course; semester: Semester }[] = [];
    semesters.forEach((s) => {
      if (levelFilter !== "all" && s.level !== levelFilter) return;
      s.courses.forEach((c) => {
        if (q && !c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return;
        if (gradeFilter !== "all" && c.grade !== gradeFilter) return;
        const status = getCourseStatus(c.grade);
        if (statusFilter === "passed" && status !== "Passed") return;
        if (statusFilter === "failed" && status !== "Failed") return;
        results.push({ course: c, semester: s });
      });
    });
    return results;
  }, [semesters, searchQuery, levelFilter, gradeFilter, statusFilter]);

  // ---------- Course form handlers ----------
  const openAddCourse = (semesterId: string) => {
    setExpandedFormSemesterId(semesterId);
    setEditingCourse(null);
    setShowCourseForm(true);
  };

  const openEditCourse = (semesterId: string, course: Course) => {
    setExpandedFormSemesterId(semesterId);
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const closeCourseForm = () => {
    setShowCourseForm(false);
    setEditingCourse(null);
    setExpandedFormSemesterId(null);
  };

  const handleSaveCourse = (course: Omit<Course, "id"> & { id?: string }) => {
    if (!expandedFormSemesterId) return;
    if (course.id) {
      gpaStore.updateCourse(expandedFormSemesterId, course as Course);
    } else {
      const { id, ...rest } = course;
      gpaStore.addCourse(expandedFormSemesterId, rest);
    }
    closeCourseForm();
  };

  const activeSemesterForForm = semesters.find((s) => s.id === expandedFormSemesterId) ?? null;

  // ---------- Add semester ----------
  const handleAddSemester = () => {
    const exists = semesters.some((s) => s.level === newSemLevel && s.term === newSemTerm);
    if (exists) {
      setShowAddSemester(false);
      return;
    }
    gpaStore.addSemester(newSemLevel, newSemTerm);
    setShowAddSemester(false);
  };

  // ---------- Import / Export ----------
  const handleExportJSON = () => {
    triggerDownload(`neurospace-gpa-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
  };

  const handleExportCSV = () => {
    triggerDownload(`neurospace-gpa-${new Date().toISOString().slice(0, 10)}.csv`, dataToCSV(semesters), "text/csv");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        if (file.name.toLowerCase().endsWith(".csv")) {
          const imported = csvToSemesters(text);
          gpaStore.importData({ semesters: [...semesters, ...imported], predictedCourses, creditsRequired });
        } else {
          const imported: GPAData = JSON.parse(text);
          gpaStore.importData(imported);
        }
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ---------- Reset handlers ----------
  const handleResetSemesterGlobal = () => {
    if (!resetSemesterChoice) return;
    if (window.confirm("Reset all courses in this semester? This cannot be undone.")) {
      gpaStore.resetSemester(resetSemesterChoice);
    }
  };

  const handleResetLevelGlobal = () => {
    if (window.confirm(`Reset all courses for ${resetLevelChoice}? This cannot be undone.`)) {
      gpaStore.resetLevel(resetLevelChoice);
    }
  };

  const handleResetAll = () => {
    if (window.confirm("Reset EVERYTHING — all semesters, courses, and predictions? This cannot be undone.")) {
      gpaStore.resetAll();
    }
  };

  return (
    <div className="flex flex-col gap-8 font-display">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-mono font-bold">
            Academic Control Center
          </span>
          <h1 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight mt-1 flex items-center gap-3">
            <GraduationCap className="text-safe" size={32} />
            GPA / CGPA
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-1">
            Track, calculate, predict, and simulate your academic performance.
          </p>
        </div>

        <button
          onClick={() => setShowAddSemester(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start"
        >
          <Plus size={12} /> Add Semester
        </button>
      </div>

      {/* ---------- Module 1: Dashboard ---------- */}
      <GPADashboard
        currentGPA={currentGPA}
        cgpa={overall.gpa}
        creditsCompleted={unitsPassed}
        currentLevel={currentLevel}
        degreeClass={degreeClass}
        semestersCompleted={semesters.length}
        creditsRequired={creditsRequired}
      />

      {/* ---------- Course Search ---------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface">
            <Search size={14} className="text-gray-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course code or title..."
              className="bg-transparent outline-none text-xs font-mono text-gray-200 placeholder-gray-600 w-full"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer uppercase tracking-wider"
            >
              <option className="bg-surface" value="all">All Levels</option>
              {LEVELS.map((l) => (
                <option className="bg-surface" key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer uppercase tracking-wider"
            >
              <option className="bg-surface" value="all">All Grades</option>
              {["A", "B", "C", "D", "E", "F"].map((g) => (
                <option className="bg-surface" key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CourseFilter)}
              className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer uppercase tracking-wider"
            >
              <option className="bg-surface" value="all">All Status</option>
              <option className="bg-surface" value="passed">Passed</option>
              <option className="bg-surface" value="failed">Failed</option>
            </select>
          </div>
        </div>

        {searchResults && (
          <div className="flex flex-col gap-2">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                No courses match your search.
              </div>
            ) : (
              searchResults.map(({ course, semester }) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 p-3 bg-surface border border-gray-800 hover:border-gray-600 transition-all flex-wrap"
                >
                  <div className="flex flex-col">
                    <p className="text-white font-bold text-sm">
                      <span className="text-gray-500 mr-2">{course.code}</span>
                      {course.title}
                    </p>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {semester.level} · {semester.term} · Grade {course.grade} · {course.units}u
                    </span>
                  </div>
                  <button
                    onClick={() => openEditCourse(semester.id, course)}
                    className="px-3 py-1.5 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider hover:border-safe hover:text-safe transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ---------- Module 2 & 3: Semester Manager + Course Manager ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">
            Semester Manager
          </h4>
          <div className="h-px w-full bg-gray-800" />
        </div>

        {orderedSemesters.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
            No semesters yet. Add your first semester to begin.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orderedSemesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                otherSemesters={semesters.filter((s) => s.id !== semester.id)}
                defaultExpanded={semester.id === orderedSemesters[orderedSemesters.length - 1].id}
                onAddCourse={() => openAddCourse(semester.id)}
                onEditCourse={(course) => openEditCourse(semester.id, course)}
                onDeleteCourse={(courseId) => gpaStore.deleteCourse(semester.id, courseId)}
                onDuplicateCourse={(courseId) => gpaStore.duplicateCourse(semester.id, courseId)}
                onMoveCourse={(courseId, targetId) => gpaStore.moveCourse(semester.id, targetId, courseId)}
                onDeleteSemester={() => {
                  if (window.confirm(`Delete ${semester.level} ${semester.term} and all its courses?`)) {
                    gpaStore.deleteSemester(semester.id);
                  }
                }}
                onResetSemester={() => {
                  if (window.confirm(`Reset all courses in ${semester.level} ${semester.term}?`)) {
                    gpaStore.resetSemester(semester.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Module 4 & 5: GPA / CGPA Calculators ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CGPACalculator semesters={semesters} />
        <GPAStats semesters={semesters} />
      </section>

      {/* ---------- Credits + Graph ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CreditTracker
          creditsRequired={creditsRequired}
          unitsPassed={unitsPassed}
          totalUnitsAttempted={totalUnitsAttempted}
          onChangeRequired={gpaStore.setCreditsRequired}
        />
        <GradeDistribution semesters={semesters} />
      </section>

      <SemesterGraph semesters={semesters} />

      {/* ---------- Insights ---------- */}
      <AcademicInsights insights={insights} />

      {/* ---------- Module 7: GPA Predictor ---------- */}
      <GPAPredictor
        semesters={semesters}
        predictedCourses={predictedCourses}
        creditsRequired={creditsRequired}
        onAdd={gpaStore.addPredictedCourse}
        onDelete={gpaStore.deletePredictedCourse}
      />

      {/* ---------- Module 8: What-If Simulator ---------- */}
      <WhatIfSimulator semesters={semesters} />

      {/* ---------- Import / Export / Reset ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">
            Data Control
          </h4>
          <div className="h-px w-full bg-gray-800" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
          >
            <Download size={12} /> Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
          >
            <Download size={12} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
          >
            <Printer size={12} /> Print
          </button>
          <button
            onClick={handleImportClick}
            className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
          >
            <Upload size={12} /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleImportFile} className="hidden" />
        </div>

        <div className="border border-panic/40 bg-panic/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-panic" />
            <span className="text-[10px] uppercase tracking-widest text-panic font-mono font-bold">Danger Zone</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <select
                value={resetSemesterChoice}
                onChange={(e) => setResetSemesterChoice(e.target.value)}
                className="bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 outline-none"
              >
                <option value="">Select semester...</option>
                {orderedSemesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.level} {s.term}</option>
                ))}
              </select>
              <button
                onClick={handleResetSemesterGlobal}
                className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-caution hover:text-caution text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <RotateCcw size={11} /> Reset Semester
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={resetLevelChoice}
                onChange={(e) => setResetLevelChoice(e.target.value)}
                className="bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-200 outline-none"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button
                onClick={handleResetLevelGlobal}
                className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-caution hover:text-caution text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <RotateCcw size={11} /> Reset Level
              </button>
            </div>

            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 border border-panic/50 text-panic hover:bg-panic/10 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              <Trash2 size={11} /> Reset Everything
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Course Form Modal ---------- */}
      {showCourseForm && activeSemesterForForm && (
        <CourseForm
          course={editingCourse}
          semesterLabel={`${activeSemesterForForm.level} ${activeSemesterForForm.term}`}
          onSave={handleSaveCourse}
          onClose={closeCourseForm}
        />
      )}

      {/* ---------- Add Semester Modal ---------- */}
      {showAddSemester && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border-2 border-gray-800 bg-surface p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Plus size={14} className="text-safe" /> Add Semester
              </h2>
              <button onClick={() => setShowAddSemester(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                  Level
                </label>
                <select
                  value={newSemLevel}
                  onChange={(e) => setNewSemLevel(e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                  Term
                </label>
                <select
                  value={newSemTerm}
                  onChange={(e) => setNewSemTerm(e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                >
                  {TERMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddSemester}
                  className="flex-1 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe active:bg-safe/10 font-mono text-[10px] uppercase tracking-widest transition-colors"
                >
                  Add Semester
                </button>
                <button
                  onClick={() => setShowAddSemester(false)}
                  className="flex-1 py-2 border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 font-mono text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPA;
