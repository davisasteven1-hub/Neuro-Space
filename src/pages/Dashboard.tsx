import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    GraduationCap, ClipboardList, CalendarDays, Target,
    FolderKanban, Bot, Timer as TimerIcon,
} from 'lucide-react';

import { useExamStorage } from '../hooks/useExamStorage';
import { useGPAStorage } from '../hooks/useGPAStorage';
import { useNotesStorage } from '../hooks/useNotesStorage';
import { useFileStorage } from '../hooks/useFileStorage';
import { useTimetableStorage } from '../hooks/useTimetableStorage';

import { parseExamDate } from '../utils';
import { calculateCGPA } from '../utils/gpaCalculator';

import DashboardExamCard from '../components/dashboard/DashboardExamCard';
import DashboardScheduleCard from '../components/dashboard/DashboardScheduleCard';
import DashboardNotesCard from '../components/dashboard/DashboardNotesCard';
import DashboardGPACard from '../components/dashboard/DashboardGPACard';
import DashboardPendingCard from '../components/dashboard/DashboardPendingCard';

const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
};

const isExamCompleted = (e: any): boolean => !!e?.completed;

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    accent?: 'safe' | 'caution' | 'panic' | 'neutral';
    index?: number;
}> = ({ icon, label, value, accent = 'neutral', index = 0 }) => {
    const accentText =
        accent === 'safe' ? 'text-safe' :
        accent === 'caution' ? 'text-caution' :
        accent === 'panic' ? 'text-panic' :
        'text-white';
    const accentBorder =
        accent === 'safe' ? 'hover:border-safe' :
        accent === 'caution' ? 'hover:border-caution' :
        accent === 'panic' ? 'hover:border-panic' :
        'hover:border-gray-600';

    return (
        <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            className={`group relative bg-surface border border-gray-800 ${accentBorder} p-5 transition-all duration-200`}
        >
            <div className="absolute -top-px -left-px w-3 h-3 border-l-2 border-t-2 border-gray-700 group-hover:border-current transition-colors" />
            <div className="absolute -bottom-px -right-px w-3 h-3 border-r-2 border-b-2 border-gray-700 group-hover:border-current transition-colors" />

            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono font-bold">
                    {label}
                </span>
                <span className={`${accentText} opacity-70 group-hover:opacity-100 transition-opacity`}>
                    {icon}
                </span>
            </div>
            <p className={`text-3xl font-bold font-mono ${accentText}`}>
                {value}
            </p>
        </motion.div>
    );
};

const Dashboard = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    // ---------- Dashboard owns NO data — it only reads each module's hook ----------
    const [exams] = useExamStorage();
    const gpaStore = useGPAStorage();
    const { notes, loading: notesLoading } = useNotesStorage();
    const { files, loading: filesLoading } = useFileStorage();
    const [courses] = useTimetableStorage();

    const semesters = gpaStore.data.semesters;
    const notesReady = !notesLoading && !filesLoading;

    // ---------- Derived stats — pure computation, no duplicated state ----------
    const upcomingExamsCount = useMemo(
        () => exams.filter((e) => !isExamCompleted(e) && parseExamDate(e.date, e.time) > now).length,
        [exams, now]
    );

    const activeNotesCount = useMemo(
        () => notes.filter((n) => !n.trashed).length,
        [notes]
    );

    const todaysClassesCount = useMemo(() => {
        const today = now.toLocaleDateString('en-US', { weekday: 'long' });
        return courses.filter((c) => c.day === today).length;
    }, [courses, now]);

    const cgpa = useMemo(() => calculateCGPA(semesters).gpa, [semesters]);

    return (
        <div className="flex flex-col gap-8 font-mono">

            {/* Welcome */}
            <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ duration: 0.3 }}>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-mono font-bold">
                    System Status
                </span>
                <h1 className="text-4xl font-bold text-white tracking-tight mt-1">
                    Welcome back
                </h1>
                <p className="text-gray-500 text-xs font-mono mt-2 tracking-wide">
                    Your academic operating system is online and monitoring.
                </p>
            </motion.div>

            {/* Quick Stats — every value is read live from its module's storage hook */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    index={0}
                    icon={<GraduationCap size={16} />}
                    label="Upcoming Exams"
                    value={upcomingExamsCount}
                    accent={upcomingExamsCount > 0 ? 'panic' : 'safe'}
                />
                <StatCard
                    index={1}
                    icon={<ClipboardList size={16} />}
                    label="Total Notes"
                    value={notesReady ? activeNotesCount : '--'}
                    accent="caution"
                />
                <StatCard
                    index={2}
                    icon={<CalendarDays size={16} />}
                    label="Classes Today"
                    value={todaysClassesCount}
                    accent="safe"
                />
                <StatCard
                    index={3}
                    icon={<Target size={16} />}
                    label="CGPA"
                    value={semesters.length > 0 ? cgpa.toFixed(2) : '--'}
                    accent="neutral"
                />
            </div>

            {/* Main Dashboard — each card reads directly from its module's hook */}
            <div className="grid lg:grid-cols-2 gap-4">

                <DashboardExamCard exams={exams} now={now} index={0} />

                <DashboardScheduleCard courses={courses} now={now} index={1} />

                <DashboardNotesCard notes={notes} files={files} index={2} />

                <DashboardGPACard semesters={semesters} index={3} />

                {/* Assignments hook doesn't exist yet — once useAssignmentStorage()
                    is created, replace this with a DashboardAssignmentCard the
                    same way DashboardExamCard/DashboardGPACard were wired. */}
                <DashboardPendingCard
                    icon={<ClipboardList size={14} />}
                    title="Assignments"
                    message="Assignments module isn't connected yet. Build the Assignments page + useAssignmentStorage() hook, then wire it up here."
                    index={4}
                />

                {/* Projects page/hook not built yet */}
                <DashboardPendingCard
                    icon={<FolderKanban size={14} />}
                    title="Projects"
                    message="Projects module isn't connected yet — it's still a placeholder route."
                    linkTo="/projects"
                    linkLabel="Open placeholder"
                    index={5}
                />

                {/* Pomodoro/study state currently lives only as local component
                    state inside Exams.tsx — there's no shared storage to read yet */}
                <DashboardPendingCard
                    icon={<TimerIcon size={14} />}
                    title="Study"
                    message="Study sessions aren't tracked in shared storage yet — Pomodoro state currently lives only inside the Exams page."
                    index={6}
                />

                {/* AI page not built yet */}
                <DashboardPendingCard
                    icon={<Bot size={14} />}
                    title="AI Assistant"
                    message="AI module isn't connected yet — it's still a placeholder route."
                    linkTo="/ai"
                    linkLabel="Open placeholder"
                    index={7}
                />

            </div>

        </div>
    );
};

export default Dashboard;