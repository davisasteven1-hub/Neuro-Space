import React from "react";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Insight } from "../types/gpa";

interface AcademicInsightsProps {
  insights: Insight[];
}

const ICONS: Record<Insight["type"], React.ReactNode> = {
  success: <TrendingUp size={14} className="text-safe" />,
  warning: <AlertTriangle size={14} className="text-panic" />,
  info: <Info size={14} className="text-cyan-300" />,
};

const BORDER: Record<Insight["type"], string> = {
  success: "border-safe",
  warning: "border-panic",
  info: "border-cyan-400",
};

const AcademicInsights: React.FC<AcademicInsightsProps> = ({ insights }) => {
  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-gray-500" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
          Academic Insights
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 p-3 bg-black/30 border-l-4 ${BORDER[insight.type]} border-t border-r border-b border-gray-800`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[insight.type]}</span>
            <p className="text-xs font-mono text-gray-300 leading-relaxed">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicInsights;
