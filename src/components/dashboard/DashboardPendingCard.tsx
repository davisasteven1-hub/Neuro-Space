import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  icon: React.ReactNode;
  title: string;
  message: string;
  linkTo?: string;
  linkLabel?: string;
  index?: number;
}

const DashboardPendingCard: React.FC<Props> = ({ icon, title, message, linkTo, linkLabel, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
    className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
  >
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-900">
      <span className="text-gray-400">{icon}</span>
      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
        {title}
      </span>
    </div>
    <p className="text-gray-500 text-xs font-mono leading-relaxed">
      {message}
    </p>
    {linkTo && linkLabel && (
      <Link
        to={linkTo}
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        {linkLabel} <ArrowUpRight size={12} />
      </Link>
    )}
  </motion.div>
);

export default DashboardPendingCard;