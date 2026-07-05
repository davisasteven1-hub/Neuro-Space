import React, { useState } from "react";
import { Target, Pencil, Check } from "lucide-react";

interface CreditTrackerProps {
  creditsRequired: number;
  unitsPassed: number;
  totalUnitsAttempted: number;
  onChangeRequired: (units: number) => void;
}

const CreditTracker: React.FC<CreditTrackerProps> = ({
  creditsRequired,
  unitsPassed,
  totalUnitsAttempted,
  onChangeRequired,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(creditsRequired));

  const remaining = Math.max(0, creditsRequired - unitsPassed);
  const pct = creditsRequired > 0 ? Math.min(100, Math.round((unitsPassed / creditsRequired) * 100)) : 0;

  const commit = () => {
    const n = Number(draft);
    if (n > 0) onChangeRequired(n);
    setEditing(false);
  };

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-gray-500" />
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
            Credits Tracker
          </span>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-16 bg-void border border-gray-800 px-2 py-1 text-xs font-mono text-gray-200 outline-none focus:border-gray-600"
            />
            <button onClick={commit} className="w-7 h-7 flex items-center justify-center border border-gray-700 text-gray-400 hover:border-safe hover:text-safe">
              <Check size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(String(creditsRequired));
              setEditing(true);
            }}
            className="w-7 h-7 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe"
            title="Edit required credits"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div>
          <p className="text-xl font-bold text-white font-mono">{creditsRequired}</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">Required</p>
        </div>
        <div>
          <p className="text-xl font-bold text-safe font-mono">{unitsPassed}</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">Completed</p>
        </div>
        <div>
          <p className="text-xl font-bold text-caution font-mono">{remaining}</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mt-1">Remaining</p>
        </div>
      </div>

      <div className="h-2.5 w-full bg-gray-900 border border-gray-800 overflow-hidden">
        <div
          className="h-full bg-safe transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-gray-600 font-mono">{pct}% toward graduation</span>
        <span className="text-[9px] text-gray-600 font-mono">{totalUnitsAttempted} units attempted total</span>
      </div>
    </div>
  );
};

export default CreditTracker;
