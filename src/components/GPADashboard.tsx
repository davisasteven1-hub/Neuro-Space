import React from "react";
import { GraduationCap, Layers, BookOpenCheck, TrendingUp } from "lucide-react";
import { DegreeClass } from "../types/gpa";
import { getAcademicStanding, getStandingColor } from "../utils/degreeClassification";
import DegreeBadge from "./DegreeBadge";
import { MAX_GPA } from "../constants/gradingSystem";

interface GPADashboardProps {
  currentGPA: number;
  cgpa: number;
  creditsCompleted: number;
  currentLevel: string;
  degreeClass: DegreeClass;
  semestersCompleted: number;
  creditsRequired: number;
}

const GPARing: React.FC<{ value: number }> = ({ value }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / MAX_GPA));
  const offset = circumference * (1 - pct);
  const color = value >= 4.5 ? "#00FF9D" : value >= 3.5 ? "#22D3EE" : value >= 2.4 ? "#FFD700" : value >= 1.5 ? "#FB923C" : "#FF0000";

  return (
    <svg viewBox="0 0 130 130" className="w-32 h-32 -rotate-90">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="#1f1f23" strokeWidth="10" />
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
      />
      <text
        x="65"
        y="65"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(90 65 65)"
        fill={color}
        fontSize="24"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {value.toFixed(2)}
      </text>
    </svg>
  );
};

const StatBlock: React.FC<{ icon: React.ReactNode; label: string; value: string | number; accent?: string }> = ({
  icon,
  label,
  value,
  accent = "text-white",
}) => (
  <div className="border border-gray-800 bg-black/30 p-4 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-gray-500">
      {icon}
      <span className="text-[10px] uppercase tracking-widest font-mono">{label}</span>
    </div>
    <span className={`text-2xl font-bold font-mono ${accent}`}>{value}</span>
  </div>
);

const GPADashboard: React.FC<GPADashboardProps> = ({
  currentGPA,
  cgpa,
  creditsCompleted,
  currentLevel,
  degreeClass,
  semestersCompleted,
  creditsRequired,
}) => {
  const standing = getAcademicStanding(cgpa);
  const standingColor = getStandingColor(cgpa);
  const creditsRemaining = Math.max(0, creditsRequired - creditsCompleted);

  return (
    <section className="relative">
      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />

      <div className="border-2 border-safe bg-surface p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-3xl bg-safe" />

        <div className="flex items-center gap-2 mb-6 relative z-10">
          <GraduationCap size={16} className="text-safe" />
          <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-mono font-bold">
            GPA Overview
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <GPARing value={cgpa} />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Current CGPA</span>
            <DegreeBadge degreeClass={degreeClass} size="sm" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
            <StatBlock
              icon={<TrendingUp size={12} />}
              label="Current GPA"
              value={currentGPA.toFixed(2)}
              accent="text-safe"
            />
            <StatBlock
              icon={<Layers size={12} />}
              label="Current Level"
              value={currentLevel || "—"}
            />
            <StatBlock
              icon={<BookOpenCheck size={12} />}
              label="Academic Standing"
              value={standing}
              accent={standingColor}
            />
            <StatBlock icon={<Layers size={12} />} label="Credits Completed" value={creditsCompleted} />
            <StatBlock icon={<Layers size={12} />} label="Credits Remaining" value={creditsRemaining} />
            <StatBlock icon={<Layers size={12} />} label="Semesters Logged" value={semestersCompleted} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GPADashboard;
