import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, MapPin, Calendar, ArrowRight, Zap, Eye, EyeOff, Skull, AlertCircle, ChevronDown, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXAM_DATA } from './constants';
import { ThemeState, Exam } from './types';
import { parseExamDate, getExamEndDate, calculateTimeRemaining, getUrgencyColor, getUrgencyBg } from './utils';
import { GlitchText } from './components/GlitchText';
import { TimerBlock } from './components/TimerBlock';

const App: React.FC = () => {
    const [now, setNow] = useState(new Date());
    const [triageMode, setTriageMode] = useState(false);
    const [sleepMode, setSleepMode] = useState(false);
    const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());

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

    // 1. Identify active or next exam
    const { activeExam, isOngoing } = useMemo(() => {
        // First check if any exam is CURRENTLY happening
        const ongoing = EXAM_DATA.find(exam => {
            const start = parseExamDate(exam.date, exam.time);
            const end = getExamEndDate(exam);
            return now >= start && now <= end;
        });

        if (ongoing) return { activeExam: ongoing, isOngoing: true };

        // Otherwise find the next upcoming one
        const next = EXAM_DATA
            .filter(exam => parseExamDate(exam.date, exam.time) > now)
            .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime())[0];

        return { activeExam: next, isOngoing: false };
    }, [now]);

    // 2. Filter list of future exams (excluding the one being tracked above)
    const upcomingExams = useMemo(() => {
        return EXAM_DATA
            .filter(exam => exam !== activeExam && parseExamDate(exam.date, exam.time) > now)
            .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime());
    }, [now, activeExam]);

    // 3. Double Header Detection
    const doubleHeaderExam = useMemo(() => {
        if (!activeExam || upcomingExams.length < 2) return null;
        const next = upcomingExams[1];
        if (activeExam.date === next.date) {
            return next;
        }
        return null;
    }, [activeExam, upcomingExams]);

    // 4. Timer State & Theme Calculation
    const timer = useMemo(() => {
        if (!activeExam || isOngoing) return null;
        return calculateTimeRemaining(parseExamDate(activeExam.date, activeExam.time), sleepMode);
    }, [activeExam, now, sleepMode, isOngoing]);

    const theme: ThemeState = useMemo(() => {
        if (isOngoing) return 'panic';
        if (!timer) return 'safe';
        // Logic: panic if < 24 real hours, caution if < 48 real hours
        const realTimer = activeExam ? calculateTimeRemaining(parseExamDate(activeExam.date, activeExam.time), false) : null;

        if (!realTimer) return 'safe';
        if (realTimer.totalHours <= 24) return 'panic';
        if (realTimer.totalHours <= 48) return 'caution';
        return 'safe';
    }, [timer, activeExam, isOngoing]);

    // Dynamic Theme Colors
    const themeColors = {
        panic: 'text-panic border-panic shadow-panic',
        caution: 'text-caution border-caution shadow-caution',
        safe: 'text-safe border-safe shadow-safe',
    };

    const currentThemeClass = themeColors[theme];
    const primaryColor = theme === 'panic' ? '#FF0000' : theme === 'caution' ? '#FFD700' : '#00FF9D';

    // 5. Grouped List based on Date
    const groupedList = useMemo<Record<string, Exam[]>>(() => {
        let list = upcomingExams;
        if (triageMode) {
            list = list.filter(e => e.urgency === 'EXTREME' || e.urgency === 'CRITICAL');
        }

        // Group by date
        const groups: Record<string, typeof upcomingExams> = {};
        list.forEach(exam => {
            if (!groups[exam.date]) groups[exam.date] = [];
            groups[exam.date].push(exam);
        });
        return groups;
    }, [upcomingExams, triageMode]);

    const isLateFinish = useMemo(() => {
        if (!activeExam) return false;
        const end = getExamEndDate(activeExam);
        return end.getHours() >= 17; // 5 PM or later
    }, [activeExam]);

    if (!activeExam) {
        return (
            <div className="min-h-screen bg-grid bg-void text-safe font-mono flex items-center justify-center flex-col gap-4 p-4">
                <h1 className="text-4xl font-bold border-2 border-safe p-4 uppercase tracking-widest">System Offline</h1>
                <p>No upcoming threats detected. Relax.</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-void bg-grid font-display selection:bg-white selection:text-black overflow-x-hidden flex flex-col`}>
            {/* --- Sticky Header --- */}
            <header className="sticky top-0 z-50 border-b-2 border-[#1a1a1a] bg-void/90 backdrop-blur-md">
                <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-6 h-6 ${theme === 'panic' ? 'text-panic animate-pulse-fast' : theme === 'caution' ? 'text-caution' : 'text-safe'}`} />
                        <h1 className="text-white text-sm md:text-base font-bold tracking-tighter uppercase font-mono">
                            Anxiety_Timer_<span className={theme === 'panic' ? 'text-panic' : 'text-gray-500'}>v1.0</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSleepMode(!sleepMode)}
                            className={`p-2 border ${sleepMode ? 'border-white text-white bg-white/10' : 'border-[#333] text-gray-500'} hover:border-white transition-colors`}
                            title="Sleep Adjusted Time"
                        >
                            {sleepMode ? <EyeOff size={16} /> : <Eye size={16} />}
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

            <main className="flex-1 max-w-xl mx-auto w-full p-4 flex flex-col gap-8">

                {/* --- Threat Level --- */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-mono font-bold">System Status</span>
                        <span className={`text-[10px] font-mono uppercase animate-pulse ${theme === 'panic' ? 'text-panic' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>
                            LIVE MONITORING
                        </span>
                    </div>
                    <div className={`border-2 ${currentThemeClass} bg-opacity-5 bg-black p-6 text-center relative overflow-hidden`}>
                        {/* Background Glow */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-3xl`} style={{ backgroundColor: primaryColor }}></div>

                        <h2 className={`text-5xl md:text-6xl font-bold leading-none tracking-tighter relative z-10 ${theme === 'panic' ? 'text-panic drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : theme === 'caution' ? 'text-caution' : 'text-safe'}`}>
                            <span className="block text-sm font-mono tracking-widest text-gray-400 mb-2 font-bold opacity-70">THREAT LEVEL</span>
                            <GlitchText text={theme.toUpperCase()} active={theme === 'panic'} />
                        </h2>
                    </div>
                </div>

                {/* --- Active Exam Card --- */}
                <section className="relative group">
                    {/* Decorative Corners */}
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
                            </div>
                            {/* Notes Icon if notes exist */}
                            {activeExam.notes && (
                                <div className="group/tooltip relative">
                                    <AlertCircle className="text-gray-600 hover:text-white transition-colors cursor-help" />
                                    <div className="absolute right-0 top-8 w-48 bg-gray-900 border border-gray-700 p-2 text-xs text-gray-300 z-20 hidden group-hover/tooltip:block">
                                        {activeExam.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Venue */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className={`flex items-center gap-2 px-3 py-2 border ${theme === 'panic' ? 'border-panic/30 bg-panic/5' : 'border-gray-700 bg-gray-900'} `}>
                                <MapPin size={16} className={theme === 'panic' ? 'text-panic' : 'text-gray-400'} />
                                <span className={`font-mono text-sm font-bold uppercase ${theme === 'panic' ? 'text-panic' : 'text-gray-200'}`}>
                                    {activeExam.venue}
                                </span>
                            </div>
                        </div>

                        {/* Timer Display */}
                        <div className="border-t border-gray-800 pt-6">
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

                    {/* Double Header Alert */}
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

                {/* --- Spacing for Double Header --- */}
                {doubleHeaderExam && <div className="h-8"></div>}

                {/* --- Incoming List --- */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <h4 className="text-white font-bold tracking-widest text-xs uppercase whitespace-nowrap">Incoming Threats</h4>
                        <div className="h-px w-full bg-gray-800"></div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {(Object.entries(groupedList) as [string, Exam[]][]).map(([date, exams]) => (
                            <div key={date} className="flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-gray-900 pb-1 mb-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-4 bg-gray-800"></div>
                                        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider font-bold">
                                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </span>
                                        {new Date(date).toDateString() === new Date().toDateString() && (
                                            <span className="px-1.5 py-0.5 bg-safe/10 text-safe text-[8px] font-bold uppercase tracking-tighter border border-safe/20">Target Date</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-gray-500 italic mr-2">
                                            {Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === 0
                                                ? 'Today'
                                                : `${Math.ceil((new Date(date).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) / (1000 * 60 * 60 * 24))} days to go`}
                                        </span>
                                        {new Date(date).getTime() < new Date('2026-02-01').getTime() && (
                                            <span className="px-1.5 py-0.5 bg-panic/5 text-panic/60 text-[8px] font-bold uppercase tracking-widest border border-panic/10">Week 01 // HELL_WEEK</span>
                                        )}
                                    </div>
                                </div>
                                {exams.map((exam, idx) => {
                                    const isExpanded = expandedExams.has(exam.course_code);
                                    const examTimer = calculateTimeRemaining(parseExamDate(exam.date, exam.time), sleepMode);
                                    const urgencyClass = getUrgencyColor(exam.urgency).split(' ')[1];

                                    return (
                                        <div key={`${exam.course_code}-${idx}`} className="flex flex-col">
                                            <div
                                                onClick={() => toggleExam(exam.course_code)}
                                                className={`group relative flex items-center justify-between p-4 bg-surface border-l-4 border-r border-t border-b border-gray-800 hover:border-gray-600 transition-all cursor-pointer ${urgencyClass}`}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${getUrgencyBg(exam.urgency)} ${getUrgencyColor(exam.urgency).split(' ')[0]}`}>
                                                            {exam.urgency}
                                                        </span>
                                                        {exam.urgency === 'EXTREME' && <AlertTriangle size={12} className="text-panic" />}
                                                    </div>
                                                    <h5 className="text-white font-bold text-lg leading-tight">
                                                        <span className="text-xs text-gray-500 mr-2">{exam.course_code}</span>
                                                        {exam.course_name}
                                                    </h5>
                                                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1">
                                                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {exam.time}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={10} /> {exam.venue}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- Dropdown Timer --- */}
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
                                                            <div className="flex items-center gap-3">
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
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {Object.keys(groupedList).length === 0 && (
                            <div className="p-8 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                                No further threats matching filter criteria.
                            </div>
                        )}
                    </div>
                </section>

                {/* --- Action Buttons --- */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-4 bg-transparent border border-gray-700 hover:border-white text-white transition-all font-bold uppercase tracking-wider text-sm">
                        <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                        <span className="relative z-10 group-hover:text-black flex items-center gap-2">
                            <Plus size={16} /> Add Exam
                        </span>
                    </button>
                    <button className={`flex items-center justify-center gap-2 py-4 px-4 border text-black font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:opacity-90 transition-opacity ${theme === 'panic' ? 'bg-panic border-panic' : theme === 'caution' ? 'bg-caution border-caution' : 'bg-safe border-safe'}`}>
                        <RefreshCw size={16} /> <span>Sync Cal</span>
                    </button>
                </div>

            </main>
            <div className="h-8"></div>
        </div>
    );
};

export default App;
