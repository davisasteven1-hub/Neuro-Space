import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, MapPin, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Exam } from '../../types';
import { parseExamDate } from '../../utils';

const isCompleted = (e: Exam): boolean => !!(e as any).completed;

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return 'Now';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

interface Props {
  exams: Exam[];
  now: Date;
  index?: number;
}

const DashboardExamCard: React.FC<Props> = ({ exams, now, index = 0 }) => {
  const upcoming = exams
    .filter((e) => !isCompleted(e) && parseExamDate(e.date, e.time) > now)
    .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime());

  const nearest = upcoming[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-900">
        <GraduationCap size={14} className="text-gray-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Upcoming Exams
        </span>
      </div>

      {!nearest ? (
        <p className="text-gray-500 text-xs font-mono leading-relaxed">
          No upcoming exams. You're all clear.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-panic">{upcoming.length}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
              exam{upcoming.length === 1 ? '' : 's'} pending
            </span>
          </div>

          <div className="border-l-4 border-panic border-t border-r border-b border-gray-800 bg-black/30 p-3">
            <p className="text-white font-bold text-sm">
              <span className="text-gray-500 mr-2">{nearest.course_code}</span>
              {nearest.course_name}
            </p>
            <div className="flex items-center gap-3 text-gray-400 text-[10px] font-mono mt-1 flex-wrap">
              <span className="flex items-center gap-1"><Clock size={10} /> {nearest.date} · {nearest.time}</span>
              <span className="flex items-center gap-1"><MapPin size={10} /> {nearest.venue}</span>
            </div>
            <p className="text-panic text-[10px] font-mono mt-2 flex items-center gap-1.5">
              <AlertTriangle size={10} /> {formatCountdown(parseExamDate(nearest.date, nearest.time).getTime() - now.getTime())} remaining
            </p>
          </div>
        </div>
      )}

      <Link
        to="/exams"
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        View exams <ArrowUpRight size={12} />
      </Link>
    </motion.div>
  );
};

export default DashboardExamCard;