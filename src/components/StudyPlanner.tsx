import React from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { StudyAllocation } from '../types';
import { getUrgencyColor } from '../utils';

interface StudyPlannerProps {
    allocations: StudyAllocation[];
    onStartPomodoro: (courseCode: string) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ allocations, onStartPomodoro }) => {
    if (allocations.length === 0) return null;

    const totalHours = allocations.reduce((sum, a) => sum + a.hoursPerDay, 0);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-gray-400" />
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
                        Daily Study Plan
                    </span>
                </div>
                <span className="text-[10px] font-mono text-gray-600">
                    {totalHours.toFixed(1)}h / day total
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {allocations.map(alloc => {
                    const maxHours = Math.max(...allocations.map(a => a.hoursPerDay));
                    const barWidth = maxHours > 0 ? (alloc.hoursPerDay / maxHours) * 100 : 0;
                    const urgencyText = getUrgencyColor(
                        alloc.urgencyWeight === 5 ? 'EXTREME' :
                        alloc.urgencyWeight === 4 ? 'CRITICAL' :
                        alloc.urgencyWeight === 3 ? 'HIGH' :
                        alloc.urgencyWeight === 2 ? 'MEDIUM' : 'LOW'
                    ).split(' ')[0];

                    return (
                        <div
                            key={alloc.course_code}
                            className="group flex items-center gap-3 p-2 border border-gray-800 bg-void hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => onStartPomodoro(alloc.course_code)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-mono text-gray-300 truncate">
                                        {alloc.course_code}
                                    </span>
                                    <span className={`text-xs font-mono font-bold ${urgencyText}`}>
                                        {alloc.hoursPerDay}h
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 overflow-hidden">
                                    <div
                                        className={`h-full ${urgencyText.replace('text-', 'bg-')}`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Clock size={12} className="text-gray-500" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-[8px] font-mono text-gray-700 text-center uppercase">
                Click a course to start a Pomodoro session
            </div>
        </div>
    );
};
