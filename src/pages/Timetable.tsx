import { useEffect, useMemo, useState, FormEvent } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Zap,
  Bell,
  CheckCircle2,
  BookOpen,
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

// ---------- Visual/status mapping (Exams-page design language) ----------
// NOTE: purely presentational — does not change any scheduling logic below.

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

// Type badge — mirrors the department-badge treatment used on the Exams page
const TYPE_BADGE: Record<Course["type"], string> = {
  core: "bg-red-500/15 text-red-300 border-red-500/40",
  gst: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  lab: "bg-purple-500/15 text-purple-300 border-purple-500/40",
};

const UNIT_DOT: Record<number, string> = {
  3: "bg-panic",
  2: "bg-caution",
  1: "bg-safe",
};
const unitDotColor = (units: number) => UNIT_DOT[units] ?? "bg-gray-500";

// Left accent border + badge colors, keyed off computed status — replaces the
// old flat background-color-per-status treatment with the Exams-style
// border-accent + badge language.
const STATUS_ACCENT: Record<CourseStatus["status"], string> = {
  live: "border-safe",
  seated: "border-cyan-400",
  prepare: "border-caution",
  upcoming: "border-gray-800",
  completed: "border-gray-800",
};

const STATUS_BADGE: Record<CourseStatus["status"], string> = {
  live: "bg-safe/10 text-safe border-safe/40",
  seated: "bg-cyan-500/10 text-cyan-300 border-cyan-500/40",
  prepare: "bg-caution/10 text-caution border-caution/40",
  upcoming: "bg-gray-800/60 text-gray-400 border-gray-700",
  completed: "bg-gray-900 text-gray-600 border-gray-800",
};

const STATUS_TEXT_COLOR: Record<CourseStatus["status"], string> = {
  live: "text-safe",
  seated: "text-cyan-300",
  prepare: "text-caution",
  upcoming: "text-gray-400",
  completed: "text-gray-600",
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

  return (
    <div className="flex flex-col gap-8 font-display">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-mono font-bold">
            Schedule Control
          </span>
          <h1 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight mt-1">
            Timetable
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-1">
            Live academic schedule — always up to date.
          </p>
        </div>

        <button
          onClick={() => openAddModal(DAYS.includes(today) ? today : DAYS[0])}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start"
        >
          <Plus size={12} /> Add Class
        </button>
      </div>

      {/* ---------- Today's Timeline ---------- */}
      <section className="relative">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />

        <div className="border-2 border-safe bg-surface p-5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-3xl bg-safe" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-safe" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-safe">
                Today · {today}
              </h2>
            </div>
            <p className="text-gray-300 font-mono text-sm flex items-center gap-1.5">
              <Clock size={12} className="text-gray-500" />
              {currentTime.toLocaleTimeString()}
            </p>
          </div>

          {todaysClasses.length === 0 ? (
            <p className="text-gray-500 text-sm font-mono relative z-10">
              {isWeekend
                ? "No classes today. Enjoy your weekend."
                : "No classes scheduled today."}
            </p>
          ) : (
            <div className="flex flex-col gap-3 relative z-10">
              {currentClass && (
                <div className="border-l-4 border-safe border-t border-r border-b border-gray-800 bg-black/40 p-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-safe uppercase tracking-widest mb-1">
                    <Zap size={10} /> Currently In Class
                  </span>
                  <p className="text-lg font-bold text-white">
                    <span className="text-xs text-gray-500 mr-2">{currentClass.code}</span>
                    {currentClass.title}
                  </p>
                  <p className="text-safe text-xs font-mono mt-1">
                    {getCourseStatus(currentClass, currentTime, true).text}
                  </p>
                </div>
              )}

              {nextClass && (
                <div className="border-l-4 border-caution border-t border-r border-b border-gray-800 bg-black/40 p-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-caution uppercase tracking-widest mb-1">
                    <Bell size={10} /> {currentClass ? "Next Class" : "Next Up"}
                  </span>
                  <p className="text-lg font-bold text-white">
                    <span className="text-xs text-gray-500 mr-2">{nextClass.code}</span>
                    {nextClass.title}
                  </p>
                  <p className="text-caution text-xs font-mono mt-1">
                    {getCourseStatus(nextClass, currentTime, true).text}
                  </p>
                </div>
              )}

              {!currentClass && !nextClass && (
                <p className="text-gray-500 text-sm font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-safe" /> All of today's classes are done. Nice work.
                </p>
              )}

              <div className="pt-2 border-t border-gray-900 mt-1">
                {todaysClasses.map((course, index) => {
                  const status = getCourseStatus(course, currentTime, true);
                  const hasConflict = conflictIds.has(course.id);

                  return (
                    <div key={course.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-600 font-mono w-12">
                          {course.start}
                        </span>
                        <span className="flex-1 w-px bg-gray-800 my-1" />
                        {index === todaysClasses.length - 1 && (
                          <span className="text-[10px] text-gray-600 font-mono w-12">
                            {course.end}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div
                          className={`border-l-4 ${STATUS_ACCENT[status.status]} border-t border-r border-b border-gray-800 bg-black/30 p-3 hover:border-gray-700 transition-colors`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-bold text-sm text-white">
                              <span className="text-gray-500">{course.code}</span> · {course.title}
                            </p>
                            {hasConflict && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-panic/40 bg-panic/10 text-panic">
                                <AlertTriangle size={9} /> Clash
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-mono mt-1 ${STATUS_TEXT_COLOR[status.status]}`}>
                            {status.text}
                          </p>
                          <p className="text-[10px] text-gray-600 font-mono mt-1">
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
      <div className="flex flex-col sm:flex-row gap-2">
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer uppercase tracking-wider"
          >
            <option className="bg-surface" value="all">All Types</option>
            <option className="bg-surface" value="core">Core</option>
            <option className="bg-surface" value="gst">GST</option>
            <option className="bg-surface" value="lab">Lab</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer uppercase tracking-wider"
          >
            <option className="bg-surface" value="all">All Status</option>
            <option className="bg-surface" value="upcoming">Upcoming</option>
            <option className="bg-surface" value="live">Live</option>
            <option className="bg-surface" value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* ---------- Legend ---------- */}
      <div className="border border-gray-800 bg-surface p-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-panic" /> 3 Units</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-caution" /> 2 Units</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-safe" /> 1 Unit</span>
        <span className="flex items-center gap-1.5"><span className={`inline-block w-2 h-2 rounded-full border ${TYPE_BADGE.lab}`} /> Lab</span>
        <span className="flex items-center gap-1.5"><span className={`inline-block w-2 h-2 rounded-full border ${TYPE_BADGE.gst}`} /> GST</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-safe" /> Live</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-caution" /> Get Ready</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-cyan-400" /> Be Seated</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-gray-700" /> Completed</span>
      </div>

      {/* ---------- Weekly Timetable ---------- */}
      {DAYS.map((day) => {
        const classes = timetable[day];

        return (
          <section key={day} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">
                {day}
                {day === today && <span className="text-safe ml-2">· Today</span>}
              </h4>
              <div className="h-px w-full bg-gray-800" />
              <button
                onClick={() => openAddModal(day)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
              >
                <Plus size={11} /> Add
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                No classes match your filters.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {classes.map((course) => {
                  const status = getCourseStatus(course, currentTime, course.day === today);
                  const hasConflict = conflictIds.has(course.id);

                  return (
                    <div
                      key={course.id}
                      className={`group relative flex flex-col gap-3 p-4 bg-surface border-l-4 border-r border-t border-b border-gray-800 hover:border-gray-600 transition-all ${STATUS_ACCENT[status.status]}`}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${TYPE_BADGE[course.type]}`}>
                              {course.type}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${STATUS_BADGE[status.status]}`}>
                              {status.status}
                            </span>
                            {hasConflict && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-panic/40 bg-panic/10 text-panic">
                                <AlertTriangle size={9} /> Clash
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[9px] text-gray-500 font-mono ml-1">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${unitDotColor(course.units)}`} />
                              {course.units} {course.units === 1 ? "Unit" : "Units"}
                            </span>
                          </div>

                          <h3 className="text-white font-bold text-lg leading-tight">
                            <span className="text-xs text-gray-500 mr-2">{course.code}</span>
                            {course.title}
                          </h3>

                          <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Clock size={10} /> {course.start} - {course.end} ({formatDuration(course.start, course.end)})</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {course.venue}</span>
                            <span className="flex items-center gap-1"><User size={10} /> {course.lecturer}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
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

                      <p className={`text-xs font-mono font-bold ${STATUS_TEXT_COLOR[status.status]}`}>
                        {status.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* ---------- Add / Edit Modal ---------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border-2 border-gray-800 bg-surface p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
              <BookOpen size={16} className="text-safe" />
              <h2 className="text-white font-bold uppercase tracking-widest text-sm">
                {editingId !== null ? "Edit Class" : "Add Class"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Course Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleFormChange("code", e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
                  placeholder="CSC201"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Course Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
                  placeholder="Computer Programming II"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={form.units}
                    onChange={(e) => handleFormChange("units", e.target.value)}
                    className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => handleFormChange("type", e.target.value as Course["type"])}
                    className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                  >
                    <option value="core">Core</option>
                    <option value="gst">GST</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Lecturer</label>
                <input
                  type="text"
                  value={form.lecturer}
                  onChange={(e) => handleFormChange("lecturer", e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
                  placeholder="Dr. Musa"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Venue</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => handleFormChange("venue", e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-700 outline-none focus:border-gray-600"
                  placeholder="Lab A"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Day</label>
                <select
                  value={form.day}
                  onChange={(e) => handleFormChange("day", e.target.value)}
                  className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.start}
                    onChange={(e) => handleFormChange("start", e.target.value)}
                    className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.end}
                    onChange={(e) => handleFormChange("end", e.target.value)}
                    className="w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-panic text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={11} /> {formError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe active:bg-safe/10 font-mono text-[10px] uppercase tracking-widest transition-colors"
                >
                  {editingId !== null ? "Save Changes" : "Add Class"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 font-mono text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
