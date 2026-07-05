import React from "react";
import { LineChart } from "lucide-react";
import { Semester } from "../types/gpa";
import { calculateSemesterHistory } from "../utils/gpaCalculator";
import { MAX_GPA } from "../constants/gradingSystem";

interface SemesterGraphProps {
  semesters: Semester[];
}

const WIDTH = 600;
const HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

const SemesterGraph: React.FC<SemesterGraphProps> = ({ semesters }) => {
  const history = calculateSemesterHistory(semesters);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    history.length <= 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (i / (history.length - 1)) * plotW;
  const yFor = (val: number) => PAD_TOP + plotH - (val / MAX_GPA) * plotH;

  const gpaPoints = history.map((h, i) => `${xFor(i)},${yFor(h.gpa)}`).join(" ");
  const cgpaPoints = history.map((h, i) => `${xFor(i)},${yFor(h.cgpa)}`).join(" ");

  const gridLines = [0, 1, 2, 3, 4, 5];

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <LineChart size={14} className="text-gray-500" />
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
            Semester Performance
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-wider text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-safe" /> GPA</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> CGPA</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-gray-800 p-8 text-center text-gray-600 font-mono text-xs uppercase">
          Add semesters to see your performance trend.
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {gridLines.map((g) => (
            <g key={g}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yFor(g)}
                y2={yFor(g)}
                stroke="#1f1f23"
                strokeWidth="1"
              />
              <text x={PAD_LEFT - 8} y={yFor(g) + 3} textAnchor="end" fontSize="9" fill="#6b7280" fontFamily="monospace">
                {g.toFixed(1)}
              </text>
            </g>
          ))}

          <polyline points={cgpaPoints} fill="none" stroke="#22D3EE" strokeWidth="2" />
          <polyline points={gpaPoints} fill="none" stroke="#00FF9D" strokeWidth="2" />

          {history.map((h, i) => (
            <g key={h.id}>
              <circle cx={xFor(i)} cy={yFor(h.gpa)} r="3.5" fill="#00FF9D" />
              <circle cx={xFor(i)} cy={yFor(h.cgpa)} r="3.5" fill="#22D3EE" />
              <text
                x={xFor(i)}
                y={HEIGHT - PAD_BOTTOM + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
                fontFamily="monospace"
              >
                {h.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

export default SemesterGraph;
