import React from "react";
import { Award } from "lucide-react";
import { DegreeClass } from "../types/gpa";
import { DEGREE_CLASS_THEME } from "../utils/degreeClassification";

interface DegreeBadgeProps {
  degreeClass: DegreeClass;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-[10px] px-2 py-1",
  md: "text-xs px-3 py-1.5",
  lg: "text-lg px-6 py-3",
};

const DegreeBadge: React.FC<DegreeBadgeProps> = ({ degreeClass, size = "md" }) => {
  const theme = DEGREE_CLASS_THEME[degreeClass];

  return (
    <div
      className={`inline-flex items-center gap-2 border-2 ${theme.border} ${theme.text} font-bold uppercase tracking-widest font-mono ${SIZE_CLASSES[size]} relative overflow-hidden`}
    >
      <div className={`absolute inset-0 opacity-10 ${theme.bg}`} />
      <Award size={size === "lg" ? 20 : size === "md" ? 14 : 11} className="relative z-10" />
      <span className="relative z-10">{degreeClass}</span>
    </div>
  );
};

export default DegreeBadge;
