import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    AlertTriangle, Clock, MapPin, Calendar, Zap, Eye, EyeOff, Skull, AlertCircle,
    ChevronDown, ChevronRight, Settings, BookOpen, Timer, Plus, Pencil, Search,
    ArrowUpDown, Star, CheckSquare, Square, Bell, Download, Upload, CalendarDays,
    List, CheckCircle2, Circle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeState, Exam, SleepSchedule, PomodoroState, PomodoroSettings, ChecklistItem } from '../types';
import { parseExamDate, getExamEndDate, calculateTimeRemaining, calculateStudyAllocations, getUrgencyColor, getUrgencyBg } from '../utils';
import { GlitchText } from '../components/GlitchText';
import { TimerBlock } from '../components/TimerBlock';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { StudyPlanner } from '../components/StudyPlanner';
import { SleepSettings } from '../components/SleepSettings';
import { ExamForm } from '../components/ExamForm';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useExamStorage } from '../hooks/useExamStorage';

const DEFAULT_SLEEP_SCHEDULE: SleepSchedule = { bedtime: '23:00', wakeTime: '07:00' };
const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = { focusMinutes: 50, breakMinutes: 10 };

// ---------- Self-contained additions (no types.ts / utils.ts changes needed) ----------

type SortOption = 'date' | 'urgency' | 'code' | 'alphabetical';
type FilterMode = 'all' | 'today' | 'week' | 'upcoming' | 'completed';
type ViewMode = 'list' | 'calendar';

const DIFFICULTY_LABELS: Record<number, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
    4: 'Very Hard',
};

const URGENCY_RANK: Record<string, number> = {
    EXTREME: 4,
    CRITICAL: 3,
    HIGH: 2,
    MODERATE: 1,
    LOW: 0,
};

const ASSUMED_PREP_WINDOW_DAYS = 21;

const NOTIFICATION_THRESHOLDS: { minutes: number; label: string }[] = [
    { minutes: 1440, label: '1 day' },
    { minutes: 60, label: '1 hour' },
    { minutes: 15, label: '15 minutes' },
];

const DEPARTMENT_COLORS: Record<string, string> = {
    CS: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    COS: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    MTH: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    GST: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    PHY: 'bg-pink-500/15 text-pink-300 border-pink-500/40',
    CHM: 'bg-green-500/15 text-green-300 border-green-500/40',
    BIO: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
    STA: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
};
const FALLBACK_DEPT_COLORS = [
    'bg-orange-500/15 text-orange-300 border-orange-500/40',
    'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    'bg-red-500/15 text-red-300 border-red-500/40',
    'bg-lime-500/15 text-lime-300 border-lime-500/40',
];

// Reads extra fields that may not exist on the base Exam type yet.
// These are stored as plain extra properties on the exam object,
// so nothing in types.ts needs to change for this file to work.
const getDifficulty = (exam: Exam): number => (exam as any).difficulty ?? 2;
const getChecklist = (exam: Exam): ChecklistItem[] => (exam as any).checklist ?? [];
const getCreatedAt = (exam: Exam): string | undefined => (exam as any).createdAt;
const getCompleted = (exam: Exam): boolean => !!(exam as any).completed;

const getDepartment = (courseCode: string): string => (courseCode.match(/^[A-Za-z]+/)?.[0] ?? 'GEN').toUpperCase();

const getDepartmentColor = (dept: string): string => {
    if (DEPARTMENT_COLORS[dept]) return DEPARTMENT_COLORS[dept];
    let hash = 0;
    for (let i = 0; i < dept.length; i++) hash = dept.charCodeAt(i) + ((hash << 5) - hash);
    return FALLBACK_DEPT_COLORS[Math.abs(hash) % FALLBACK_DEPT_COLORS.length];
};

// Automatic urgency — computed from time remaining instead of manual entry.
const calculateAutoUrgency = (examDate: Date, now: Date): Exam['urgency'] => {
    const hoursRemaining = (examDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursRemaining <= 24) return 'EXTREME';
    if (hoursRemaining <= 72) return 'CRITICAL';
    if (hoursRemaining <= 168) return 'HIGH';
    if (hoursRemaining <= 336) return 'MODERATE';
    return 'LOW';
};
const getEffectiveUrgency = (exam: Exam, now: Date): Exam['urgency'] =>
    calculateAutoUrgency(parseExamDate(exam.date, exam.time), now);

const filterExamsBySearch = (exams: Exam[], query: string): Exam[] => {
    if (!query.trim()) return exams;
    const q = query.trim().toLowerCase();
    return exams.filter(
        (e) => e.course_code.toLowerCase().includes(q) || e.course_name.toLowerCase().includes(q)
    );
};

const sortExamsLocal = (exams: Exam[], sortBy: SortOption, now: Date): Exam[] => {
    const list = [...exams];
    switch (sortBy) {
        case 'urgency':
            return list.sort(
                (a, b) => (URGENCY_RANK[getEffectiveUrgency(b, now)] ?? 0) - (URGENCY_RANK[getEffectiveUrgency(a, now)] ?? 0)
            );
        case 'code':
            return list.sort((a, b) => a.course_code.localeCompare(b.course_code));
        case 'alphabetical':
            return list.sort((a, b) => a.course_name.localeCompare(b.course_name));
        case 'date':
        default:
            return list.sort(
                (a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime()
            );
    }
};

const calculateProgressPercent = (exam: Exam, now: Date): number => {
    const examDate = parseExamDate(exam.date, exam.time);
    const createdAt = getCreatedAt(exam);
    const start = createdAt
        ? new Date(createdAt)
        : new Date(examDate.getTime() - ASSUMED_PREP_WINDOW_DAYS * 86400000);

    const total = examDate.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

const calculateReadiness = (exam: Exam, now: Date): number => {
    const checklist = getChecklist(exam);
    const taskCompletion =
        checklist.length > 0 ? (checklist.filter((c) => c.done).length / checklist.length) * 100 : 0;

    const difficulty = getDifficulty(exam);
    const prepProgress = calculateProgressPercent(exam, now);

    const difficultyPenalty = (difficulty - 2) * 6;
    const timeFactor = Math.max(0, 100 - Math.abs(prepProgress - taskCompletion));

    const score = taskCompletion * 0.65 + timeFactor * 0.35 - difficultyPenalty;
    return Math.min(100, Math.max(0, Math.round(score)));
};

// ---------- Import / Export helpers ----------

const escapeCSV = (val: string): string => `"${String(val ?? '').replace(/"/g, '""')}"`;

const examsToCSV = (list: Exam[]): string => {
    const headers = ['course_code', 'course_name', 'date', 'time', 'duration', 'venue', 'urgency', 'notes', 'difficulty', 'completed'];
    const rows = list.map((e) =>
        [
            e.course_code,
            e.course_name,
            e.date,
            e.time,
            e.duration,
            e.venue,
            e.urgency,
            e.notes ?? '',
            String(getDifficulty(e)),
            String(getCompleted(e)),
        ]
            .map(escapeCSV)
            .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let cur = '';
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
        } else if (ch === ',' && !inQuotes) {
            values.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    values.push(cur);
    return values;
};

const parseCSV = (text: string): Exam[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.trim());
    return lines.slice(1).filter(Boolean).map((line) => {
        const values = parseCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = values[i] ?? ''));
        return {
            course_code: obj.course_code,
            course_name: obj.course_name,
            date: obj.date,
            time: obj.time,
            duration: obj.duration || '3 hours',
            venue: obj.venue,
            urgency: (obj.urgency || 'HIGH') as Exam['urgency'],
            notes: obj.notes || undefined,
            difficulty: obj.difficulty ? Number(obj.difficulty) : 2,
            completed: obj.completed === 'true',
        } as Exam;
    });
};

const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ---------- Component ----------

const Exams: React.FC = () => {
    const [now, setNow] = useState(new Date());

    const [exams, setExams, examsLoading] = useExamStorage();
    const [sleepSchedule, setSleepSchedule] = useLocalStorage<SleepSchedule>('sleep-schedule', DEFAULT_SLEEP_SCHEDULE);
    const [pomodoroSettings] = useLocalStorage<PomodoroSettings>('pomodoro-settings', DEFAULT_POMODORO_SETTINGS);
    const [triageMode, setTriageMode] = useLocalStorage<boolean>('triage-mode', false);
    const [sleepMode, setSleepMode] = useLocalStorage<boolean>('sleep-mode', false);
    const [notifiedFlags, setNotifiedFlags] = useLocalStorage<Record<string, boolean>>('exam-notification-flags', {});

    const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
    const [showSleepSettings, setShowSleepSettings] = useState(false);
    const [showStudyPlanner, setShowStudyPlanner] = useState(false);
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [showExamForm, setShowExamForm] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
        isRunning: false,
        mode: 'focus',
        secondsLeft: DEFAULT_POMODORO_SETTINGS.focusMinutes * 60,
        sessionsCompleted: 0,
        targetExamCode: null,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [filterMode, setFilterMode] = useState<FilterMode>('upcoming');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleExam = (code: string) => {
        const next = new Set(expandedExams);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        setExpandedExams(next);
    };

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ---------- Desktop notifications ----------
    useEffect(() => {
        if (notifPermission !== 'granted' || typeof window === 'undefined' || !('Notification' in window)) return;
        exams.forEach((exam) => {
            if (getCompleted(exam)) return;
            const examDate = parseExamDate(exam.date, exam.time);
            NOTIFICATION_THRESHOLDS.forEach(({ minutes, label }) => {
                const key = `${exam.course_code}-${minutes}`;
                if (notifiedFlags[key]) return;
                const targetTime = examDate.getTime() - minutes * 60000;
                if (now.getTime() >= targetTime && now.getTime() < targetTime + 60000) {
                    try {
                        new Notification(`Exam Alert: ${exam.course_code}`, {
                            body: `${exam.course_name} starts in ${label} — ${exam.venue}`,
                        });
                    } catch {
                        // ignore — some browsers block Notification() outside a service worker
                    }
                    setNotifiedFlags((prev) => ({ ...prev, [key]: true }));
                }
            });
        });
    }, [now, exams, notifPermission, notifiedFlags, setNotifiedFlags]);

    const requestNotifPermission = useCallback(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        Notification.requestPermission().then(setNotifPermission);
    }, []);

    const { activeExam, isOngoing } = useMemo(() => {
        const ongoing = exams.find((exam) => {
            if (getCompleted(exam)) return false;
            const start = parseExamDate(exam.date, exam.time);
            const end = getExamEndDate(exam);
            return now >= start && now <= end;
        });

        if (ongoing) return { activeExam: ongoing, isOngoing: true };

        const next = exams
            .filter((exam) => !getCompleted(exam) && parseExamDate(exam.date, exam.time) > now)
            .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime())[0];

        return { activeExam: next, isOngoing: false };
    }, [now, exams]);

    const upcomingExams = useMemo(() => {
        return exams
            .filter((exam) => exam !== activeExam && !getCompleted(exam) && parseExamDate(exam.date, exam.time) > now)
            .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime());
    }, [now, activeExam, exams]);

    const doubleHeaderExam = useMemo(() => {
        if (!activeExam || upcomingExams.length < 1) return null;
        const next = upcomingExams[0];
        if (activeExam.date === next.date) return next;
        return null;
    }, [activeExam, upcomingExams]);

    const timer = useMemo(() => {
        if (!activeExam || isOngoing) return null;
        return calculateTimeRemaining(parseExamDate(activeExam.date, activeExam.time), sleepMode, sleepSchedule);
    }, [activeExam, now, sleepMode, isOngoing, sleepSchedule]);

    const theme: ThemeState = useMemo(() => {
        if (isOngoing) return 'panic';
        if (!timer) return 'safe';
        const realTimer = activeExam ? calculateTimeRemaining(parseExamDate(activeExam.date, activeExam.time), false) : null;
        if (!realTimer) return 'safe';
        if (realTimer.totalHours <= 24) return 'panic';
        if (realTimer.totalHours <= 48) return 'caution';
        return 'safe';
    }, [timer, activeExam, isOngoing]);

    const studyAllocations = useMemo(() => {
        return calculateStudyAllocations(exams, sleepSchedule);
    }, [exams, sleepSchedule, now]);

    const themeColors = {
        panic: 'text-panic border-panic shadow-panic',
        caution: 'text-caution border-caution shadow-caution',
        safe: 'text-safe border-safe shadow-safe',
    };
    const currentThemeClass = themeColors[theme];
    const primaryColor = theme === 'panic' ? '#FF0000' : theme === 'caution' ? '#FFD700' : '#00FF9D';

    // ---------- Filtering ----------
    const filterModeList = useMemo(() => {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        switch (filterMode) {
            case 'today':
                return exams.filter((e) => {
                    if (getCompleted(e)) return false;
                    const d = parseExamDate(e.date, e.time);
                    return d >= startOfToday && d < endOfToday;
                });
            case 'week':
                return exams.filter((e) => {
                    if (getCompleted(e)) return false;
                    const d = parseExamDate(e.date, e.time);
                    return d >= startOfToday && d < endOfWeek;
                });
            case 'completed':
                return exams.filter(getCompleted);
            case 'upcoming':
                return exams.filter((e) => !getCompleted(e) && parseExamDate(e.date, e.time) > now);
            case 'all':
            default:
                return exams.filter((e) => e !== activeExam);
        }
    }, [exams, filterMode, now, activeExam]);

    const searchedList = useMemo(() => {
        return filterExamsBySearch(filterModeList, searchQuery);
    }, [filterModeList, searchQuery]);

    const groupedList = useMemo<Record<string, Exam[]>>(() => {
        let list = searchedList;
        if (triageMode) {
            list = list.filter((e) => {
                const u = getEffectiveUrgency(e, now);
                return u === 'EXTREME' || u === 'CRITICAL';
            });
        }
        const groups: Record<string, typeof searchedList> = {};
        list.forEach((exam) => {
            if (!groups[exam.date]) groups[exam.date] = [];
            groups[exam.date].push(exam);
        });
        return groups;
    }, [searchedList, triageMode, now]);

    const flatSortedList = useMemo(() => {
        let list = searchedList;
        if (triageMode) {
            list = list.filter((e) => {
                const u = getEffectiveUrgency(e, now);
                return u === 'EXTREME' || u === 'CRITICAL';
            });
        }
        return sortExamsLocal(list, sortBy, now);
    }, [searchedList, triageMode, sortBy, now]);

    const isLateFinish = useMemo(() => {
        if (!activeExam) return false;
        const end = getExamEndDate(activeExam);
        return end.getHours() >= 17;
    }, [activeExam]);

    // ---------- Conflicts ----------
    const conflictCourseCodes = useMemo(() => {
        const map = new Map<string, Exam[]>();
        exams.forEach((e) => {
            if (getCompleted(e)) return;
            const key = `${e.date}_${e.time}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(e);
        });
        const set = new Set<string>();
        map.forEach((list) => {
            if (list.length > 1) list.forEach((e) => set.add(e.course_code));
        });
        return set;
    }, [exams]);

    // ---------- Progress ----------
    const progressStats = useMemo(() => {
        const completed = exams.filter(getCompleted).length;
        return { completed, total: exams.length };
    }, [exams]);

    // ---------- Calendar ----------
    const examsByDateKey = useMemo(() => {
        const map: Record<string, Exam[]> = {};
        exams.forEach((e) => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [exams]);

    // ---------- CRUD ----------
    const handleAddExam = useCallback((exam: Exam) => {
        const withCreatedAt = { ...exam, createdAt: getCreatedAt(exam) ?? new Date().toISOString() } as Exam;
        setExams((prev: Exam[]) => [...prev, withCreatedAt]);
        setShowExamForm(false);
    }, [setExams]);

    const handleEditExam = useCallback((exam: Exam) => {
        setExams((prev: Exam[]) => prev.map(e => e.course_code === exam.course_code ? { ...e, ...exam } : e));
        setEditingExam(null);
        setShowExamForm(false);
    }, [setExams]);

    const handleDeleteExam = useCallback((courseCode: string) => {
        setExams((prev: Exam[]) => prev.filter(e => e.course_code !== courseCode));
        setEditingExam(null);
        setShowExamForm(false);
    }, [setExams]);

    const openAddForm = useCallback(() => {
        setEditingExam(null);
        setShowExamForm(true);
    }, []);

    const openEditForm = useCallback((exam: Exam) => {
        setEditingExam(exam);
        setShowExamForm(true);
    }, []);

    const toggleCompleted = useCallback((courseCode: string) => {
        setExams((prev: Exam[]) => prev.map(e =>
            e.course_code === courseCode ? ({ ...e, completed: !getCompleted(e) } as Exam) : e
        ));
    }, [setExams]);

    const startPomodoro = useCallback((courseCode: string) => {
        setPomodoroState({
            isRunning: true,
            mode: 'focus',
            secondsLeft: pomodoroSettings.focusMinutes * 60,
            sessionsCompleted: 0,
            targetExamCode: courseCode,
        });
        setShowPomodoro(true);
        setShowStudyPlanner(false);
    }, [pomodoroSettings]);

    const setDifficulty = useCallback((courseCode: string, difficulty: 1 | 2 | 3 | 4) => {
        setExams((prev: Exam[]) => prev.map(e =>
            e.course_code === courseCode ? ({ ...e, difficulty } as Exam) : e
        ));
    }, [setExams]);

    const toggleChecklistItem = useCallback((courseCode: string, itemId: string) => {
        setExams((prev: Exam[]) => prev.map(e => {
            if (e.course_code !== courseCode) return e;
            const checklist = getChecklist(e).map(item =>
                item.id === itemId ? { ...item, done: !item.done } : item
            );
            return ({ ...e, checklist } as Exam);
        }));
    }, [setExams]);

    const addChecklistItem = useCallback((courseCode: string) => {
        const label = (newTaskText[courseCode] ?? '').trim();
        if (!label) return;
        setExams((prev: Exam[]) => prev.map(e => {
            if (e.course_code !== courseCode) return e;
            const checklist = getChecklist(e);
            const newItem: ChecklistItem = { id: `${Date.now()}`, label, done: false };
            return ({ ...e, checklist: [...checklist, newItem] } as Exam);
        }));
        setNewTaskText(prev => ({ ...prev, [courseCode]: '' }));
    }, [newTaskText, setExams]);

    const removeChecklistItem = useCallback((courseCode: string, itemId: string) => {
        setExams((prev: Exam[]) => prev.map(e => {
            if (e.course_code !== courseCode) return e;
            return ({ ...e, checklist: getChecklist(e).filter(item => item.id !== itemId) } as Exam);
        }));
    }, [setExams]);

    // ---------- Import / Export ----------
    const handleExportJSON = useCallback(() => {
        triggerDownload(`neurospace-exams-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(exams, null, 2), 'application/json');
    }, [exams]);

    const handleExportCSV = useCallback(() => {
        triggerDownload(`neurospace-exams-${new Date().toISOString().slice(0, 10)}.csv`, examsToCSV(exams), 'text/csv');
    }, [exams]);

    const handleImportClick = useCallback(() => fileInputRef.current?.click(), []);

    const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result);
                const imported: Exam[] = file.name.toLowerCase().endsWith('.csv') ? parseCSV(text) : JSON.parse(text);
                setExams((prev: Exam[]) => {
                    const byCode = new Map(prev.map(ex => [ex.course_code, ex]));
                    imported.forEach(imp => byCode.set(imp.course_code, { ...(byCode.get(imp.course_code) ?? {}), ...imp } as Exam));
                    return Array.from(byCode.values());
                });
            } catch (err) {
                console.error('Import failed:', err);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }, [setExams]);

    if (!activeExam) {
        return (
            <div className="min-h-screen bg-grid bg-void text-safe font-mono flex items-center justify-center flex-col gap-4 p-4">
                <h1 className="text-4xl font-bold border-2 border-safe p-4 uppercase tracking-widest">NEUROSPACE ONLINE</h1>
                <p>No upcoming tasks. Stay productive.</p>
            </div>
        );
    }

    const pomodoroExamName = pomodoroState.targetExamCode
        ? exams.find(e => e.course_code === pomodoroState.targetExamCode)?.course_name
        : undefined;

    const activeProgress = calculateProgressPercent(activeExam, now);
    const activeReadiness = calculateReadiness(activeExam, now);
    const activeDifficulty = getDifficulty(activeExam);

    const renderDifficultyStars = (courseCode: string, value: number, size = 16) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDifficulty(courseCode, n as 1 | 2 | 3 | 4); }}
                    title={DIFFICULTY_LABELS[n]}
                >
                    <Star
                        size={size}
                        className={n <= value ? 'text-caution fill-caution' : 'text-gray-700 hover:text-gray-500'}
                    />
                </button>
            ))}
        </div>
    );

    const renderProgressBar = (label: string, value: number, colorLow: string, colorMid: string, colorHigh: string) => (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{label}</span>
                <span className="text-[10px] font-mono text-gray-400">{value}%</span>
            </div>
            <div className="h-2 w-full bg-gray-900 border border-gray-800 overflow-hidden">
                <div
                    className={`h-full ${value > 80 ? colorHigh : value > 50 ? colorMid : colorLow}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );

    const renderChecklist = (exam: Exam) => {
        const checklist = getChecklist(exam);
        const completed = checklist.filter(c => c.done).length;

        return (
            <div className="mt-4 border-t border-gray-900 pt-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2">
                    <CheckSquare size={12} className="text-gray-500" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">
                        Study Checklist ({completed}/{checklist.length})
                    </span>
                </div>
                <div className="flex flex-col gap-1.5 mb-2">
                    {checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-2">
                            <button
                                onClick={() => toggleChecklistItem(exam.course_code, item.id)}
                                className="flex items-center gap-2 text-left flex-1"
                            >
                                {item.done
                                    ? <CheckSquare size={14} className="text-safe shrink-0" />
                                    : <Square size={14} className="text-gray-600 shrink-0" />}
                                <span className={`text-xs font-mono ${item.done ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                                    {item.label}
                                </span>
                            </button>
                            <button
                                onClick={() => removeChecklistItem(exam.course_code, item.id)}
                                className="text-gray-600 hover:text-panic text-[10px] font-mono"
                            >
                                remove
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTaskText[exam.course_code] ?? ''}
                        onChange={(e) => setNewTaskText(prev => ({ ...prev, [exam.course_code]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addChecklistItem(exam.course_code); }}
                        placeholder="Add a study task..."
                        className="flex-1 bg-void border border-gray-800 px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-gray-600"
                    />
                    <button
                        onClick={() => addChecklistItem(exam.course_code)}
                        className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-safe hover:text-safe text-[10px] uppercase font-mono"
                    >
                        Add
                    </button>
                </div>
            </div>
        );
    };

    const renderExamCard = (exam: Exam, keySuffix: string) => {
        const isExpanded = expandedExams.has(exam.course_code);
        const examTimer = calculateTimeRemaining(parseExamDate(exam.date, exam.time), sleepMode, sleepSchedule);
        const effUrgency = getEffectiveUrgency(exam, now);
        const urgencyClass = getUrgencyColor(effUrgency).split(' ')[1];
        const difficulty = getDifficulty(exam);
        const checklist = getChecklist(exam);
        const completedCount = checklist.filter(c => c.done).length;
        const prepProgress = calculateProgressPercent(exam, now);
        const readiness = calculateReadiness(exam, now);
        const completed = getCompleted(exam);
        const dept = getDepartment(exam.course_code);
        const hasConflict = conflictCourseCodes.has(exam.course_code);

        return (
            <div key={keySuffix} className={`flex flex-col ${completed ? 'opacity-50' : ''}`}>
                <div
                    onClick={() => toggleExam(exam.course_code)}
                    className={`group relative flex items-center justify-between p-4 bg-surface border-l-4 border-r border-t border-b border-gray-800 hover:border-gray-600 transition-all cursor-pointer ${urgencyClass}`}>
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${getUrgencyBg(effUrgency)} ${getUrgencyColor(effUrgency).split(' ')[0]}`}>
                                {effUrgency}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${getDepartmentColor(dept)}`}>
                                {dept}
                            </span>
                            {effUrgency === 'EXTREME' && <AlertTriangle size={12} className="text-panic" />}
                            {hasConflict && (
                                <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-panic/40 bg-panic/10 text-panic">
                                    <AlertTriangle size={9} /> Clash
                                </span>
                            )}
                            {completed && (
                                <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-safe/40 bg-safe/10 text-safe">
                                    <CheckCircle2 size={9} /> Done
                                </span>
                            )}
                            <span className="flex items-center gap-0.5 text-[9px] text-gray-500 font-mono ml-1">
                                {[1, 2, 3, 4].map(n => (
                                    <Star
                                        key={n}
                                        size={9}
                                        className={n <= difficulty ? 'text-caution fill-caution' : 'text-gray-700'}
                                    />
                                ))}
                            </span>
                        </div>
                        <h5 className="text-white font-bold text-lg leading-tight">
                            <span className="text-xs text-gray-500 mr-2">{exam.course_code}</span>
                            {exam.course_name}
                        </h5>
                        <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {(() => { const [y, m, d] = exam.date.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); })()}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {exam.time}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {exam.venue}</span>
                            {checklist.length > 0 && (
                                <span className="flex items-center gap-1"><CheckSquare size={10} /> {completedCount}/{checklist.length}</span>
                            )}
                        </div>
                        <div className="mt-2 max-w-xs">
                            {renderProgressBar('Prep time', prepProgress, 'bg-safe', 'bg-caution', 'bg-panic')}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleCompleted(exam.course_code); }}
                            className={`w-8 h-8 flex items-center justify-center border transition-all ${completed ? 'border-safe text-safe bg-safe/10' : 'border-gray-700 text-gray-500 hover:border-safe hover:text-safe'}`}
                            title={completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                            {completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(exam); }}
                            className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe active:bg-safe/10 transition-all"
                            title="Edit exam"
                        >
                            <Pencil size={12} />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="bg-black/40 border-x border-b border-gray-800 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">
                                        {sleepMode ? "Adjusted Study Countdown" : "Absolute Countdown"}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-700">{exam.course_code}</span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1 flex flex-col items-center p-2 border border-gray-800 bg-void">
                                        <span className="text-xl font-mono font-bold text-white">{examTimer.days.toString().padStart(2, '0')}</span>
                                        <span className="text-[8px] uppercase text-gray-600 font-mono">Days</span>
                                    </div>
                                    <span className="text-gray-800 font-bold">:</span>
                                    <div className="flex-1 flex flex-col items-center p-2 border border-gray-800 bg-void">
                                        <span className="text-xl font-mono font-bold text-white">{examTimer.hours.toString().padStart(2, '0')}</span>
                                        <span className="text-[8px] uppercase text-gray-600 font-mono">Hrs</span>
                                    </div>
                                    <span className="text-gray-800 font-bold">:</span>
                                    <div className="flex-1 flex flex-col items-center p-2 border border-gray-800 bg-void">
                                        <span className="text-xl font-mono font-bold text-white">{examTimer.minutes.toString().padStart(2, '0')}</span>
                                        <span className="text-[8px] uppercase text-gray-600 font-mono">Mins</span>
                                    </div>
                                    <span className="text-gray-800 font-bold">:</span>
                                    <div className="flex-1 flex flex-col items-center p-2 border border-gray-800 bg-void">
                                        <span className="text-xl font-mono font-bold text-panic">{examTimer.seconds.toString().padStart(2, '0')}</span>
                                        <span className="text-[8px] uppercase text-gray-600 font-mono">Secs</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">
                                        Difficulty: <span className="text-gray-300">{DIFFICULTY_LABELS[difficulty]}</span>
                                    </span>
                                    {renderDifficultyStars(exam.course_code, difficulty)}
                                </div>

                                <div className="mb-2">
                                    {renderProgressBar('Readiness', readiness, 'bg-panic', 'bg-caution', 'bg-safe')}
                                </div>

                                {renderChecklist(exam)}

                                <button
                                    onClick={(e) => { e.stopPropagation(); startPomodoro(exam.course_code); }}
                                    className="mt-4 w-full py-2 border border-gray-700 text-gray-400 hover:border-safe hover:text-safe transition-colors text-[10px] font-mono uppercase tracking-widest"
                                >
                                    Start Pomodoro for {exam.course_code}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const renderCalendarView = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                        className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white text-xs font-mono"
                    >
                        ← Prev
                    </button>
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-300 font-bold">
                        {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                        className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white text-xs font-mono"
                    >
                        Next →
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-[9px] text-gray-600 font-mono uppercase text-center py-1">{d}</div>
                    ))}
                    {cells.map((day, idx) => {
                        if (day === null) return <div key={idx} className="aspect-square" />;
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayExams = examsByDateKey[dateKey] ?? [];
                        const isToday = (() => {
                            const t = new Date();
                            return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
                        })();
                        return (
                            <div
                                key={idx}
                                className={`aspect-square border ${isToday ? 'border-safe' : 'border-gray-800'} bg-surface p-1 flex flex-col gap-0.5 overflow-hidden`}
                            >
                                <span className={`text-[9px] font-mono ${isToday ? 'text-safe font-bold' : 'text-gray-500'}`}>{day}</span>
                                <div className="flex flex-col gap-0.5">
                                    {dayExams.slice(0, 3).map((e) => (
                                        <span
                                            key={e.course_code}
                                            title={`${e.course_code} — ${e.course_name}${conflictCourseCodes.has(e.course_code) ? ' (clash)' : ''}`}
                                            className={`text-[7px] px-0.5 truncate rounded border ${getDepartmentColor(getDepartment(e.course_code))} ${getCompleted(e) ? 'opacity-40 line-through' : ''}`}
                                        >
                                            {e.course_code}
                                        </span>
                                    ))}
                                    {dayExams.length > 3 && (
                                        <span className="text-[7px] text-gray-500 font-mono">+{dayExams.length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const filterButtons: { key: FilterMode; label: string }[] = [
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'completed', label: 'Completed' },
        { key: 'all', label: 'All' },
    ];

    return (
        <div className={`min-h-screen bg-void bg-grid font-display selection:bg-white selection:text-black overflow-x-hidden flex flex-col`}>
            <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#1a1a1a] bg-void/90 backdrop-blur-md">
                <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-6 h-6 ${theme === 'panic' ? 'text-panic animate-pulse-fast' : theme === 'caution' ? 'text-caution' : 'text-safe'}`} />
                        <h1 className="text-white text-sm md:text-base font-bold tracking-tighter uppercase font-mono">
                            Anxiety_Timer_<span className={theme === 'panic' ? 'text-panic' : 'text-gray-500'}>v2.0</span>
                        </h1>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <button
                            onClick={requestNotifPermission}
                            className={`p-2 border ${notifPermission === 'granted' ? 'border-safe text-safe bg-safe/10' : 'border-[#333] text-gray-500'} hover:border-safe transition-colors`}
                            title={notifPermission === 'granted' ? 'Alerts enabled' : 'Enable exam alerts'}
                        >
                            <Bell size={16} />
                        </button>
                        <button
                            onClick={() => setShowStudyPlanner(!showStudyPlanner)}
                            className={`p-2 border ${showStudyPlanner ? 'border-safe text-safe bg-safe/10' : 'border-[#333] text-gray-500'} hover:border-safe transition-colors`}
                            title="Study Planner"
                        >
                            <BookOpen size={16} />
                        </button>
                        <button
                            onClick={() => setShowPomodoro(!showPomodoro)}
                            className={`p-2 border ${showPomodoro ? 'border-white text-white bg-white/10' : 'border-[#333] text-gray-500'} hover:border-white transition-colors`}
                            title="Pomodoro Timer"
                        >
                            <Timer size={16} />
                        </button>
                        <button
                            onClick={() => setSleepMode(!sleepMode)}
                            className={`p-2 border ${sleepMode ? 'border-white text-white bg-white/10' : 'border-[#333] text-gray-500'} hover:border-white transition-colors`}
                            title="Sleep Adjusted Time"
                        >
                            {sleepMode ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                            onClick={() => setShowSleepSettings(!showSleepSettings)}
                            className={`p-2 border ${showSleepSettings ? 'border-white text-white bg-white/10' : 'border-[#333] text-gray-500'} hover:border-white transition-colors`}
                            title="Sleep Schedule Settings"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={() => setTriageMode(!triageMode)}
                            className={`p-2 border ${triageMode ? 'border-panic text-panic bg-panic/10' : 'border-[#333] text-gray-500'} hover:border-panic transition-colors`}
                            title="Triage Mode (Extreme Only)"
                        >
                            <Skull size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full p-4 pt-20 flex flex-col gap-8">

                <AnimatePresence>
                    {showExamForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <ExamForm
                                exam={editingExam}
                                onSave={editingExam ? handleEditExam : handleAddExam}
                                onDelete={editingExam ? handleDeleteExam : undefined}
                                onClose={() => { setShowExamForm(false); setEditingExam(null); }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSleepSettings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <SleepSettings
                                schedule={sleepSchedule}
                                onChange={setSleepSchedule}
                                onClose={() => setShowSleepSettings(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showPomodoro && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <PomodoroTimer
                                state={pomodoroState}
                                settings={pomodoroSettings}
                                onStateChange={setPomodoroState}
                                examName={pomodoroExamName}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showStudyPlanner && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <StudyPlanner
                                allocations={studyAllocations}
                                onStartPomodoro={startPomodoro}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-mono font-bold">System Status</span>
                        <span className={`text-[10px] font-mono uppercase animate-pulse ${theme === 'panic' ? 'text-panic' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>
                            LIVE MONITORING
                        </span>
                    </div>
                    <div className={`border-2 ${currentThemeClass} bg-opacity-5 bg-black p-6 text-center relative overflow-hidden`}>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-3xl`} style={{ backgroundColor: primaryColor }}></div>
                        <h2 className={`text-5xl md:text-6xl font-bold leading-none tracking-tighter relative z-10 ${theme === 'panic' ? 'text-panic drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>
                            <span className="block text-sm font-mono tracking-widest text-gray-400 mb-2 font-bold opacity-70">THREAT LEVEL</span>
                            <GlitchText text={theme.toUpperCase()} active={theme === 'panic'} />
                        </h2>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-1">
                        <span className="text-[10px] font-mono text-gray-500">
                            {progressStats.completed} of {progressStats.total} exams completed
                        </span>
                        <div className="h-1.5 w-32 bg-gray-900 border border-gray-800 overflow-hidden">
                            <div
                                className="h-full bg-safe"
                                style={{ width: `${progressStats.total ? (progressStats.completed / progressStats.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <section className="relative group">
                    <div className={`absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 ${currentThemeClass}`}></div>
                    <div className={`absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 ${currentThemeClass}`}></div>

                    <div className={`border-2 ${currentThemeClass} bg-surface p-5 relative`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold text-black uppercase mb-2 ${isOngoing ? 'bg-white animate-pulse' : (theme === 'panic' ? 'bg-panic' : theme === 'caution' ? 'bg-caution' : 'bg-safe')}`}>
                                    {isOngoing ? 'Threat In Progress' : 'Immediate Threat'}
                                </span>
                                <h3 className="text-2xl md:text-3xl font-bold uppercase leading-tight text-white max-w-[80%]">
                                    {activeExam.course_code}:<br />
                                    <span className="text-gray-400">{activeExam.course_name}</span>
                                </h3>
                                {isLateFinish && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-panic uppercase tracking-widest">
                                        <Skull size={10} /> Late Finish Warning: Recovery Required
                                    </div>
                                )}
                                {conflictCourseCodes.has(activeExam.course_code) && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-panic uppercase tracking-widest">
                                        <AlertTriangle size={10} /> Timetable Clash Detected
                                    </div>
                                )}
                            </div>
                            {activeExam.notes && (
                                <div className="group/tooltip relative">
                                    <AlertCircle className="text-gray-600 hover:text-white transition-colors cursor-help" />
                                    <div className="absolute right-0 top-8 w-48 bg-gray-900 border border-gray-700 p-2 text-xs text-gray-300 z-20 hidden group-hover/tooltip:block">
                                        {activeExam.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <div className={`flex items-center gap-2 px-3 py-2 border ${theme === 'panic' ? 'border-panic/30 bg-panic/5' : 'border-gray-700 bg-gray-900'} `}>
                                <MapPin size={16} className={theme === 'panic' ? 'text-panic' : 'text-gray-400'} />
                                <span className={`font-mono text-sm font-bold uppercase ${theme === 'panic' ? 'text-panic' : 'text-gray-200'}`}>
                                    {activeExam.venue}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Difficulty</span>
                            {renderDifficultyStars(activeExam.course_code, activeDifficulty)}
                        </div>

                        <div className="mb-6 flex flex-col gap-3">
                            {renderProgressBar('Prep Time Elapsed', activeProgress, 'bg-safe', 'bg-caution', 'bg-panic')}
                            {renderProgressBar('Readiness', activeReadiness, 'bg-panic', 'bg-caution', 'bg-safe')}
                        </div>

                        {renderChecklist(activeExam)}

                        <div className="border-t border-gray-800 pt-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                                    {sleepMode ? "Sleep-Adjusted Study Hours" : "Time Remaining"}
                                </span>
                            </div>

                            <div className="flex items-start gap-2 md:gap-4">
                                {isOngoing ? (
                                    <div className="flex-1 py-8 border-2 border-dashed border-panic flex flex-col items-center justify-center gap-2">
                                        <Zap className="text-panic animate-bounce" size={32} />
                                        <span className="text-panic font-bold tracking-[0.4em] uppercase text-sm">Combat in Progress</span>
                                        <span className="text-gray-500 text-[10px] font-mono">Ends at {getExamEndDate(activeExam).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ) : (
                                    <>
                                        <TimerBlock value={timer?.days || 0} label="Days" colorClass={currentThemeClass} />
                                        <span className={`text-2xl md:text-4xl font-bold mt-4 ${theme === 'panic' ? 'text-panic' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>:</span>
                                        <TimerBlock value={timer?.hours || 0} label="Hours" colorClass={currentThemeClass} />
                                        <span className={`text-2xl md:text-4xl font-bold mt-4 ${theme === 'panic' ? 'text-panic' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>:</span>
                                        <TimerBlock value={timer?.minutes || 0} label="Mins" colorClass={currentThemeClass} />
                                        <span className={`text-2xl md:text-4xl font-bold mt-4 ${theme === 'panic' ? 'text-panic' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>:</span>
                                        <TimerBlock value={timer?.seconds || 0} label="Secs" colorClass={currentThemeClass} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {doubleHeaderExam && (
                        <div className="absolute -bottom-16 left-0 right-0 animate-bounce">
                            <div className="bg-void border border-panic text-panic p-3 flex items-center justify-between shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} fill="currentColor" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Double Header Alert</span>
                                </div>
                                <span className="text-xs font-mono">Next: {doubleHeaderExam.course_code} @ {doubleHeaderExam.time}</span>
                            </div>
                        </div>
                    )}
                </section>

                {doubleHeaderExam && <div className="h-8"></div>}

                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">Incoming Threats</h4>
                        <div className="h-px w-full bg-gray-800"></div>
                        <button
                            onClick={openAddForm}
                            className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors"
                        >
                            <Plus size={12} /> Add
                        </button>
                    </div>

                    {/* Filter chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {filterButtons.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilterMode(key)}
                                className={`px-2.5 py-1 border text-[10px] font-mono uppercase tracking-wider ${filterMode === key ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* View mode + import/export */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 border flex items-center gap-1 text-[10px] font-mono uppercase ${viewMode === 'list' ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500'}`}
                                title="List view"
                            >
                                <List size={12} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 border flex items-center gap-1 text-[10px] font-mono uppercase ${viewMode === 'calendar' ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500'}`}
                                title="Calendar view"
                            >
                                <CalendarDays size={12} /> Calendar
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleExportJSON}
                                className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
                                title="Export as JSON"
                            >
                                <Download size={12} /> JSON
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
                                title="Export as CSV"
                            >
                                <Download size={12} /> CSV
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="p-2 border border-gray-800 text-gray-500 hover:border-gray-600 flex items-center gap-1 text-[10px] font-mono uppercase"
                                title="Import JSON or CSV"
                            >
                                <Upload size={12} /> Import
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                onChange={handleImportFile}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {viewMode === 'calendar' ? (
                        renderCalendarView()
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface">
                                    <Search size={14} className="text-gray-600 shrink-0" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search exams..."
                                        className="bg-transparent outline-none text-xs font-mono text-gray-200 placeholder-gray-600 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
                                    <ArrowUpDown size={14} className="text-gray-600" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="bg-transparent outline-none text-xs font-mono text-gray-200 cursor-pointer"
                                    >
                                        <option className="bg-surface" value="date">Date</option>
                                        <option className="bg-surface" value="urgency">Urgency</option>
                                        <option className="bg-surface" value="code">Course Code</option>
                                        <option className="bg-surface" value="alphabetical">Alphabetical</option>
                                    </select>
                                </div>
                            </div>

                            {sortBy === 'date' ? (
                                <div className="flex flex-col gap-6">
                                    {(Object.entries(groupedList) as [string, Exam[]][]).map(([date, examsInGroup]) => (
                                        <div key={date} className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between border-b border-gray-900 pb-1 mb-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-4 bg-gray-800"></div>
                                                    <span className="text-xs font-mono text-gray-300 uppercase tracking-wider font-bold">
                                                        {(() => {
                                                            const [y, m, d] = date.split('-').map(Number);
                                                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                                                        })()}
                                                    </span>
                                                    {(() => {
                                                        const [y, m, d] = date.split('-').map(Number);
                                                        const examLocal = new Date(y, m - 1, d);
                                                        const todayLocal = new Date();
                                                        todayLocal.setHours(0, 0, 0, 0);
                                                        return examLocal.getTime() === todayLocal.getTime();
                                                    })() && (
                                                        <span className="px-1.5 py-0.5 bg-safe/10 text-safe text-[8px] font-bold uppercase tracking-tighter border border-safe/20">Target Date</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-gray-500 italic mr-2">
                                                        {(() => {
                                                            const [year, month, day] = date.split('-').map(Number);
                                                            const examDate = new Date(year, month - 1, day);
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const diffDays = Math.round((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                            if (diffDays < 0) return 'Passed';
                                                            return diffDays === 0 ? 'Today' : (diffDays === 1 ? 'Tomorrow' : `${diffDays} days to go`);
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            {examsInGroup.map((exam, idx) => renderExamCard(exam, `${exam.course_code}-${idx}`))}
                                        </div>
                                    ))}
                                    {Object.keys(groupedList).length === 0 && (
                                        <div className="p-8 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                                            No exams matching filter criteria.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {flatSortedList.map((exam, idx) => renderExamCard(exam, `${exam.course_code}-flat-${idx}`))}
                                    {flatSortedList.length === 0 && (
                                        <div className="p-8 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                                            No exams matching filter criteria.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </section>

            </main>

            <div className="h-8"></div>
        </div>
    );
};

export default Exams;