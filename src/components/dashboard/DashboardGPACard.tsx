import React from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Semester } from '../../types/gpa';
import { calculateCGPA, calculateSemesterHistory, sortSemesters } from '../../utils/gpaCalculator';

interface Props {
  semesters: Semester[];
  index?: number;
}

const DashboardGPACard: React.FC<Props> = ({ semesters, index = 0 }) => {
  const ordered = sortSemesters(semesters);
  const history = calculateSemesterHistory(semesters);
  const overall = calculateCGPA(semesters);

  const currentGPA = history.length > 0 ? history[history.length - 1].gpa : 0;
  const currentLevel = ordered.length > 0 ? ordered[ordered.length - 1].level : '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-900">
        <Target size={14} className="text-gray-400" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          GPA / CGPA
        </span>
      </div>

      {semesters.length === 0 ? (
        <p className="text-gray-500 text-xs font-mono leading-relaxed">
          No semesters recorded yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border border-gray-800 p-3">
            <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">Semester GPA</span>
            <p className="text-2xl font-bold font-mono text-white mt-1">{currentGPA.toFixed(2)}</p>
          </div>
          <div className="border border-gray-800 p-3">
            <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">CGPA</span>
            <p className="text-2xl font-bold font-mono text-safe mt-1">{overall.gpa.toFixed(2)}</p>
          </div>
        </div>
      )}

      <p className="text-gray-500 text-[10px] font-mono">
        Current level: <span className="text-gray-300">{currentLevel}</span>
      </p>

      <Link
        to="/gpa"
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        View GPA <ArrowUpRight size={12} />
      </Link>
    </motion.div>
  );
};

export default DashboardGPACard;