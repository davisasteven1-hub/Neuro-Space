import React from 'react';

interface TimerBlockProps {
  value: number;
  label: string;
  colorClass: string;
}

export const TimerBlock: React.FC<TimerBlockProps> = ({ value, label, colorClass }) => (
  <div className={`flex-1 flex flex-col items-center justify-center py-3 border-2 bg-black/40 ${colorClass}`}>
    <span className="text-3xl md:text-5xl font-mono font-bold text-white tabular-nums">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mt-1">{label}</span>
  </div>
);