import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SleepSchedule } from '../types';

interface SleepSettingsProps {
  schedule: SleepSchedule;
  onChange: (schedule: SleepSchedule) => void;
  onClose: () => void;
}

const inputClass =
  'bg-void border border-gray-700 px-2 py-1.5 text-sm font-mono text-gray-200 outline-none focus:border-safe w-full';

export const SleepSettings: React.FC<SleepSettingsProps> = ({ schedule, onChange, onClose }) => {
  const [bedtime, setBedtime] = useState(schedule.bedtime);
  const [wakeTime, setWakeTime] = useState(schedule.wakeTime);

  const save = () => {
    onChange({ bedtime, wakeTime });
    onClose();
  };

  return (
    <div className="border-2 border-gray-700 bg-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-widest font-mono text-gray-300 font-bold">Sleep Schedule</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-gray-500 font-mono">Bedtime</label>
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-gray-500 font-mono">Wake Time</label>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className={inputClass} />
        </div>
      </div>
      <button
        onClick={save}
        className="mt-1 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe font-mono text-[10px] uppercase tracking-widest"
      >
        Save Schedule
      </button>
    </div>
  );
};