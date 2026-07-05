import React from 'react';
import { StudyAllocation } from '../types';

interface StudyPlannerProps {
  allocations: StudyAllocation[];
  onStartPomodoro: (courseCode: string) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ allocations, onStartPomodoro }) => {
  if (allocations.length === 0) {
    return (
      <div className="border-2 border-gray-700 bg-surface p-4 text-center text-gray-500 font-mono text-xs uppercase">
        No upcoming exams to plan for.
      </div>
    );
  }
  const maxHours = Math.max(...allocations.map((a) => a.hoursPerDay), 1);
  return (
    <div className="border-2 border-gray-700 bg-surface p-4 flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-widest font-mono text-gray-300 font-bold">Study Plan</h3>
      {allocations.map((a) => (
        <div key={a.course_code} className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] font-mono text-gray-300">
            <span>{a.course_code} — {a.course_name}</span>
            <span>{a.hoursPerDay}h/day</span>
          </div>
          <div className="h-2 w-full bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="h-full bg-caution" style={{ width: `${(a.hoursPerDay / maxHours) * 100}%` }} />
          </div>
          <button
            onClick={() => onStartPomodoro(a.course_code)}
            className="self-start text-[10px] font-mono uppercase text-gray-500 hover:text-safe mt-1"
          >
            Start Pomodoro →
          </button>
        </div>
      ))}
    </div>
  );
};