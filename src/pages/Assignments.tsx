import { useEffect, useMemo, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Filter, Pencil, Trash2, Clock, MapPin, User, AlertTriangle,
    X, CalendarDays, CheckCircle2, Armchair, BellRing,
} from "lucide-react";

type Course = {
  id: number;
  code: string;
  title: string;
  units: number;
  type: "core" | "gst" | "lab";
  lecturer: string;
  venue: string;
  day: string;
  start: string;
  end: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STORAGE_KEY = "neurospace_timetable";

const seedCourses: Course[] = [
  {
    id: 1,
    code: "CSC201",
    title: "Computer Programming II",
    units: 3,
    type: "core",
    lecturer: "Dr. Musa",
    venue: "Lab A",
    day: "Monday",
    start: "08:00",
    end: "10:00",
  },
  {
    id: 2,
    code: "GST201",
    title: "Entrepreneurship",
    units: 1,
    type: "gst",
    lecturer: "Dr. Bello",
    venue: "LT3",
    day: "Monday",
    start: "12:00",
    end: "13:00",
  },
  {
    id: 3,
    code: "CSC203",
    title: "Programming Lab",
    units: 2,
    type: "lab",
    lecturer: "Dr. Ibrahim",
    venue: "Lab 2",
    day: "Wednesday",
    start: "14:00",
    end: "17:00",
  },
];

const loadCourses = (): Course[] => {
  if (typeof window === "undefined") return seedCourses;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCourses;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return seedCourses;
  } catch {
    return seedCourses;
  }
};

const saveCourses = (courses: Course[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // storage full or unavailable, fail silently
  }
};

// ---------- Time helpers ----------

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const timeToDate = (time: string, base: Date) => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatDuration = (startTime: string, endTime: string) => {
  const totalMinutes = toMinutes(endTime) - toMinutes(startTime);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

// ---------- Visual accent helpers (Exams-page language) ----------
// Same inputs/outputs role as before — course type/units and live status
// still drive the color, just expressed as Exams' border/bg/text token
// combinations instead of solid rounded pills.

type Accent = { border: string; bg: string; text: string; label?: string };

const getTypeAccent = (course: Course): Accent => {
  if (course.type === "lab") {
    return { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300", label: "Lab" };
  }
  if (course.type === "gst") {
    return { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300", label: "GST" };
  }
  if (course.units === 3) {
    return { border: "border-panic/40", bg: "bg-panic/10", text: "text-panic", label: "3 Units" };
  }
  if (course.units === 2) {
    return { border: "border-caution/40", bg: "bg-caution/10", text: "text-caution", label: "2 Units" };
  }
  return { border: "border-safe/40", bg: "bg-safe/10", text: "text-safe", label: "1 Unit" };
};

type CourseStatus = {
  status: "upcoming" | "prepare" | "seated" | "live" | "completed";
  text: string;
};

const getCourseStatus = (
  course: Course,
  currentTime: Date,
  isToday: boolean
): CourseStatus => {
  if (!isToday) {
    return { status: "upcoming", text: `${course.start} - ${course.end}` };
  }

  const now = currentTime;
  const startTime = timeToDate(course.start, now);
  const endTime = timeToDate(course.end, now);

  if (now < startTime) {
    const diff = startTime.getTime() - now.getTime();

    if (diff <= 10 * 60 * 1000) {
      return { status: "seated", text: `Be seated and ready • ${formatCountdown(diff)}` };
    }

    if (diff <= 30 * 60 * 1000) {
      return { status: "prepare", text: `Get ready to leave • ${formatCountdown(diff)}` };
    }

    return { status: "upcoming", text: `Starts in ${formatCountdown(diff)}` };
  }

  if (now >= startTime && now <= endTime) {
    const diff = endTime.getTime() - now.getTime();
    return { status: "live", text: `Live • Ends in ${formatCountdown(diff)}` };
  }

  return { status: "completed", text: "Completed" };
};

const getStatusAccent = (course: Course, status: CourseStatus["status"]): Accent => {
  if (status === "prepare") return { border: "border-caution/40", bg: "bg-caution/10", text: "text-caution" };
  if (status === "seated") return { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-300" };
  if (status === "live") return { border: "border-safe/40", bg: "bg-safe/10", text: "text-safe" };
  if (status === "completed") return { border: "border-gray-700", bg: "bg-gray-900/40", text: "text-gray-500" };
  return getTypeAccent(course);
};

const getStatusIcon = (status: CourseStatus["status"]) => {
  if (status === "prepare") return <BellRing size={11} />;
  if (status === "seated") return <Armchair size={11} />;
  if (status === "live") return <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse inline-block" />;
  if (status === "completed") return <CheckCircle2 size={11} />;
  return <Clock size={11} />;
};

// Finds overlapping classes on the same day
const findConflictIds = (courses: Course[]) => {
  const conflictIds = new Set<number>();

  DAYS.forEach((day) => {
    const dayCourses = courses
      .filter((c) => c.day === day)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    for (let i = 0; i < dayCourses.length - 1; i++) {
      const current = dayCourses[i];
      const next = dayCourses[i + 1];

      if (toMinutes(next.start) < toMinutes(current.end)) {
        conflictIds.add(current.id);
        conflictIds.add(next.id);
      }
    }
  });

  return conflictIds;
};

type FormState = {
  code: string;
  title: string;
  units: string;
  type: Course["type"];
  lecturer: string;
  venue: string;
  day: string;
  start: string;
  end: string;
};

const emptyForm = (day: string): FormState => ({
  code: "",
  title: "",
  units: "1",
  type: "core",
  lecturer: "",
  venue: "",
  day,
  start: "",
  end: "",
});

type TypeFilter = "all" | "core" | "gst" | "lab";
type StatusFilter = "all" | "upcoming" | "live" | "completed";

const inputClass =
  "w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors";
const labelClass = "block text-[10px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-1.5";

const Timetable = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(DAYS[0]));
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  const today = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const isWeekend = today === "Saturday" || today === "Sunday";

  const conflictIds = useMemo(() => findConflictIds(courses), [courses]);

  const todaysClasses = useMemo(
    () =>
      courses
        .filter((c) => c.day === today)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [courses, today]
  );

  const currentClass = useMemo(
    () =>
      todaysClasses.find((c) => {
        const start = timeToDate(c.start, currentTime);
        const end = timeToDate(c.end, currentTime);
        return currentTime >= start && currentTime <= end;
      }) ?? null,
    [todaysClasses, currentTime]
  );

  const nextClass = useMemo(
    () =>
      todaysClasses.find((c) => {
        const start = timeToDate(c.start, currentTime);
        return currentTime < start;
      }) ?? null,
    [todaysClasses, currentTime]
  );

  const timetable: Record<string, Course[]> = {};
  DAYS.forEach((day) => {
    timetable[day] = courses
      .filter((course) => course.day === day)
      .filter((course) => typeFilter === "all" || course.type === typeFilter)
      .filter((course) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
          course.code.toLowerCase().includes(q) ||
          course.title.toLowerCase().includes(q) ||
          course.lecturer.toLowerCase().includes(q) ||
          course.venue.toLowerCase().includes(q)
        );
      })
      .filter((course) => {
        if (statusFilter === "all") return true;
        const status = getCourseStatus(course, currentTime, course.day === today).status;
        if (statusFilter === "upcoming") {
          return status === "upcoming" || status === "prepare" || status === "seated";
        }
        return status === statusFilter;
      })
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  });

  const openAddModal = (day: string) => {
    setEditingId(null);
    setForm(emptyForm(day));
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingId(course.id);
    setForm({
      code: course.code,
      title: course.title,
      units: String(course.units),
      type: course.type,
      lecturer: course.lecturer,
      venue: course.venue,
      day: course.day,
      start: course.start,
      end: course.end,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (id: number) => {
    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!form.code.trim() || !form.title.trim()) {
      setFormError("Course code and title are required.");
      return;
    }

    if (!form.start || !form.end) {
      setFormError("Start and end time are required.");
      return;
    }

    if (form.start >= form.end) {
      setFormError("End time must be after start time.");
      return;
    }

    const unitsNumber = Number(form.units);

    if (!unitsNumber || unitsNumber < 1) {
      setFormError("Units must be a number of at least 1.");
      return;
    }

    const newCourse: Course = {
      id: editingId ?? Date.now(),
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      units: unitsNumber,
      type: form.type,
      lecturer: form.lecturer.trim(),
      venue: form.venue.trim(),
      day: form.day,
      start: form.start,
      end: form.end,
    };

    setCourses((prev) => {
      if (editingId !== null) {
        return prev.map((course) => (course.id === editingId ? newCourse : course));
      }
      return [...prev, newCourse];
    });

    closeModal();
  };

  const todayPanelAccent = currentClass ? "border-safe" : nextClass ? "border-caution" : "border-gray-800";

  const legendItems: { accent: Accent; label: string }[] = [
    { accent: { border: "border-panic/40", bg: "bg-panic/10", text: "text-panic" }, label: "3 Units" },
    { accent: { border: "border-caution/40", bg: "bg-caution/10", text: "text-caution" }, label: "2 Units" },
    { accent: { border: "border-safe/40", bg: "bg-safe/10", text: "text-safe" }, label: "1 Unit" },
    { accent: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300" }, label: "Lab" },
    { accent: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300" }, label: "GST" },
    { accent: { border: "border-safe/40", bg: "bg-safe/10", text: "text-safe" }, label: "Live" },
    { accent: { border: "border-caution/40", bg: "bg-caution/10", text: "text-caution" }, label: "Get Ready" },
    { accent: { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-300" }, label: "Be Seated" },
    { accent: { border: "border-gray-700", bg: "bg-gray-900/40", text: "text-gray-500" }, label: "Completed" },
  ];

  const renderCourseInfoRow = (course: Course) => (
    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1 flex-wrap">
      <span className="flex items-center gap-1"><Clock size={10} /> {course.start} - {course.end} ({formatDuration(course.start, course.end)})</span>
      <span className="flex items-center gap-1"><MapPin size={10} /> {course.venue}</span>
      {course.lecturer && <span className="flex items-center gap-1"><User size={10} /> {course.lecturer}</span>}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 font-mono">

      {/* ---------- Header ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-mono font-bold">
            Academic Schedule
          </span>
          <h1 className="text-4xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <CalendarDays className="text-safe" size={28} /> Timetable
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2 tracking-wide">
            Your live academic schedule — always up to date.
          </p>
        </div>

        <button
          onClick={() => openAddModal(DAYS.includes(today) ? today : DAYS[0])}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start"
        >
          <Plus size={12} /> Add Class
        </button>
      </motion.div>

      {/* ---------- Today's Timeline ---------- */}
      <section className="relative group">
        <div className={`absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 ${todayPanelAccent}`}></div>
        <div className={`absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 ${todayPanelAccent}`}></div>

        <div className={`border-2 ${todayPanelAccent} bg-surface p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-900">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-mono font-bold">Today's Timeline</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{today}</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-void self-start">
              <Clock size={14} className="text-gray-500" />
              <span className="text-gray-300 font-mono text-sm">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>

          {todaysClasses.length === 0 ? (
            <p className="text-gray-500 text-sm font-mono">
              {isWeekend
                ? "No classes today. Enjoy your weekend."
                : "No classes scheduled today."}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {currentClass && (
                <div className="bg-black/40 border-l-4 border-safe border-t border-r border-b border-gray-800 p-4">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-safe/10 text-safe border border-safe/40 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" /> Currently In Class
                  </span>
                  <p className="text-xl font-bold text-white">
                    {currentClass.code} — {currentClass.title}
                  </p>
                  <p className="text-safe mt-1 text-xs font-mono">
                    {getCourseStatus(currentClass, currentTime, true).text}
                  </p>
                </div>
              )}

              {nextClass && (
                <div className="bg-black/40 border-l-4 border-caution border-t border-r border-b border-gray-800 p-4">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-caution/10 text-caution border border-caution/40 mb-2">
                    {currentClass ? "Next Class" : "Next Up"}
                  </span>
                  <p className="text-xl font-bold text-white">
                    {nextClass.code} — {nextClass.title}
                  </p>
                  <p className="text-caution mt-1 text-xs font-mono">
                    {getCourseStatus(nextClass, currentTime, true).text}
                  </p>
                </div>
              )}

              {!currentClass && !nextClass && (
                <p className="text-gray-500 text-sm font-mono flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-safe" /> All of today's classes are done. Nice work.
                </p>
              )}

              <div className="pt-2 border-t border-gray-900">
                {todaysClasses.map((course, index) => {
                  const status = getCourseStatus(course, currentTime, true);
                  const accent = getStatusAccent(course, status.status);
                  const hasConflict = conflictIds.has(course.id);

                  return (
                    <div key={course.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 w-14 font-mono">
                          {course.start}
                        </span>
                        <span className="flex-1 w-px bg-gray-800 my-1" />
                        {index === todaysClasses.length - 1 && (
                          <span className="text-[10px] text-gray-500 w-14 font-mono">
                            {course.end}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className={`border-l-4 ${accent.border} border-t border-r border-b border-gray-800 bg-surface p-3 hover:border-gray-600 transition-colors`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-bold text-white text-sm">
                              {course.code} · {course.title}
                            </p>
                            {hasConflict && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-panic/40 bg-panic/10 text-panic">
                                <AlertTriangle size={9} /> Clash
                              </span>
                            )}
                          </div>
                          <p className={`flex items-center gap-1.5 text-[10px] font-mono mt-1 ${accent.text}`}>
                            {getStatusIcon(status.status)} {status.text}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-1">
                            {formatDuration(course.start, course.end)} · {course.venue}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Search + Filters ---------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface">
          <Search size={14} className="text-gray-600 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search course code, title, lecturer, or venue..."
            className="bg-transparent outline-none text-xs font-mono text-gray-200 placeholder-gray-600 w-full"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
          <Filter size={14} className="text-gray-600" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer"
          >
            <option className="bg-surface" value="all">All Types</option>
            <option className="bg-surface" value="core">Core</option>
            <option className="bg-surface" value="gst">GST</option>
            <option className="bg-surface" value="lab">Lab</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
          <ArrowFilterIcon />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer"
          >
            <option className="bg-surface" value="all">All Status</option>
            <option className="bg-surface" value="upcoming">Upcoming</option>
            <option className="bg-surface" value="live">Live</option>
            <option className="bg-surface" value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* ---------- Color Legend ---------- */}
      <div className="flex flex-wrap gap-2">
        {legendItems.map((item) => (
          <span
            key={item.label}
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${item.accent.border} ${item.accent.bg} ${item.accent.text}`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* ---------- Weekly Timetable ---------- */}
      {DAYS.map((day) => {
        const classes = timetable[day];
        const isToday = day === today;

        return (
          <section key={day} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">
                {day} {isToday && <span className="text-safe">• Today</span>}
              </h4>
              <div className="h-px w-full bg-gray-800"></div>
              <button
                onClick={() => openAddModal(day)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-800 text-gray-500 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
              >
                <Plus size={11} /> Add
              </button>
            </div>

            {classes.length === 0 ? (
              <p className="text-gray-600 text-xs font-mono px-1">No classes match your filters.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {classes.map((course) => {
                  const status = getCourseStatus(course, currentTime, course.day === today);
                  const accent = getStatusAccent(course, status.status);
                  const typeAccent = getTypeAccent(course);
                  const hasConflict = conflictIds.has(course.id);

                  return (
                    <div
                      key={course.id}
                      className={`group relative flex items-start justify-between gap-3 p-4 bg-surface border-l-4 ${accent.border} border-t border-r border-b border-gray-800 hover:border-gray-600 transition-all`}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${typeAccent.border} ${typeAccent.bg} ${typeAccent.text}`}>
                            {typeAccent.label}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-gray-700 text-gray-400 rounded">
                            {course.type.toUpperCase()}
                          </span>
                          {hasConflict && (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-panic/40 bg-panic/10 text-panic">
                              <AlertTriangle size={9} /> Clash
                            </span>
                          )}
                        </div>
                        <h5 className="text-white font-bold text-lg leading-tight">
                          <span className="text-xs text-gray-500 mr-2">{course.code}</span>
                          {course.title}
                        </h5>
                        {renderCourseInfoRow(course)}
                        <p className={`flex items-center gap-1.5 text-[10px] font-mono mt-2 ${accent.text}`}>
                          {getStatusIcon(status.status)} {status.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(course)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe active:bg-safe/10 transition-all"
                          title="Edit class"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic active:bg-panic/10 transition-all"
                          title="Delete class"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* ---------- Add / Edit Modal ---------- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-void border-2 border-gray-800 p-6"
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe"></div>

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-900">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                  {editingId !== null ? "Edit Class" : "Add Class"}
                </h2>
                <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className={labelClass}>Course Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => handleFormChange("code", e.target.value)}
                    className={inputClass}
                    placeholder="CSC201"
                  />
                </div>

                <div>
                  <label className={labelClass}>Course Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className={inputClass}
                    placeholder="Computer Programming II"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Units</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={form.units}
                      onChange={(e) => handleFormChange("units", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => handleFormChange("type", e.target.value as Course["type"])}
                      className={inputClass}
                    >
                      <option className="bg-void" value="core">Core</option>
                      <option className="bg-void" value="gst">GST</option>
                      <option className="bg-void" value="lab">Lab</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Lecturer</label>
                  <input
                    type="text"
                    value={form.lecturer}
                    onChange={(e) => handleFormChange("lecturer", e.target.value)}
                    className={inputClass}
                    placeholder="Dr. Musa"
                  />
                </div>

                <div>
                  <label className={labelClass}>Venue</label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => handleFormChange("venue", e.target.value)}
                    className={inputClass}
                    placeholder="Lab A"
                  />
                </div>

                <div>
                  <label className={labelClass}>Day</label>
                  <select
                    value={form.day}
                    onChange={(e) => handleFormChange("day", e.target.value)}
                    className={inputClass}
                  >
                    {DAYS.map((day) => (
                      <option className="bg-void" key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Start Time</label>
                    <input
                      type="time"
                      value={form.start}
                      onChange={(e) => handleFormChange("start", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>End Time</label>
                    <input
                      type="time"
                      value={form.end}
                      onChange={(e) => handleFormChange("end", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {formError && (
                  <p className="flex items-center gap-1.5 text-panic text-[10px] font-mono uppercase tracking-wide">
                    <AlertTriangle size={11} /> {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-700 text-gray-300 text-[10px] font-mono uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
                  >
                    {editingId !== null ? "Save Changes" : "Add Class"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2 border border-gray-800 text-gray-500 text-[10px] font-mono uppercase tracking-wider hover:border-gray-600 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Small inline icon so the status-filter field doesn't reuse the exact
// same Filter icon twice in a row — purely decorative, no logic.
const ArrowFilterIcon = () => <Filter size={14} className="text-gray-600" />;

export default Timetable;
