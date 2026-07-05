import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../../hooks/useTimetableStorage';

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const timeToDate = (time: string, base: Date) => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

interface Props {
  courses: Course[];
  now: Date;
  index?: number;
}

const DashboardScheduleCard: React.FC<Props> = ({ courses, now, index = 0 }) => {
  const today = now.toLocaleDateString('en-US', { weekday: 'long' });

  const todaysClasses = courses
    .filter((c) => c.day === today)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const currentClass = todaysClasses.find((c) => {
    const start = timeToDate(c.start, now);
    const end = timeToDate(c.end, now);
    return now >= start && now <= end;
  }) ?? null;

  const nextClass = todaysClasses.find((c) => timeToDate(c.start, now) > now) ?? null;
  const highlight = currentClass ?? nextClass;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-900">
        <CalendarDays size={14} className="text-gray-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Today's Schedule
        </span>
      </div>

      {todaysClasses.length === 0 ? (
        <p className="text-gray-500 text-xs font-mono leading-relaxed">
          No classes scheduled today.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-safe">{todaysClasses.length}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
              class{todaysClasses.length === 1 ? '' : 'es'} today
            </span>
          </div>

          {highlight && (
            <div className={`border-l-4 ${currentClass ? 'border-safe' : 'border-caution'} border-t border-r border-b border-gray-800 bg-black/30 p-3`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${currentClass ? 'text-safe' : 'text-caution'}`}>
                {currentClass ? 'In Progress' : 'Next Up'}
              </span>
              <p className="text-white font-bold text-sm mt-1">
                <span className="text-gray-500 mr-2">{highlight.code}</span>
                {highlight.title}
              </p>
              <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {highlight.start} - {highlight.end}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {highlight.venue}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <Link
        to="/timetable"
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        View timetable <ArrowUpRight size={12} />
      </Link>
    </motion.div>
  );
};

export default DashboardScheduleCard;