import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { SleepSchedule } from '../types';
import { getSleepHours } from '../utils';

interface SleepSettingsProps {
    schedule: SleepSchedule;
    onChange: (schedule: SleepSchedule) => void;
    onClose: () => void;
}

export const SleepSettings: React.FC<SleepSettingsProps> = ({ schedule, onChange, onClose }) => {
    const sleepHours = getSleepHours(schedule);
    const studyHours = 24 - sleepHours;

    return (
        <div className="border border-gray-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
                    Sleep Schedule
                </span>
                <button
                    onClick={onClose}
                    className="text-[10px] font-mono text-gray-600 hover:text-white transition-colors uppercase"
                >
                    Close
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase">
                        <Moon size={10} /> Bedtime
                    </label>
                    <input
                        type="time"
                        value={schedule.bedtime}
                        onChange={(e) => onChange({ ...schedule, bedtime: e.target.value })}
                        className="bg-void border border-gray-700 text-white font-mono text-sm p-2 focus:border-safe focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase">
                        <Sun size={10} /> Wake Time
                    </label>
                    <input
                        type="time"
                        value={schedule.wakeTime}
                        onChange={(e) => onChange({ ...schedule, wakeTime: e.target.value })}
                        className="bg-void border border-gray-700 text-white font-mono text-sm p-2 focus:border-safe focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-500">
                        Sleep: <span className="text-white font-bold">{sleepHours.toFixed(1)}h</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                        Study: <span className="text-safe font-bold">{studyHours.toFixed(1)}h</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
