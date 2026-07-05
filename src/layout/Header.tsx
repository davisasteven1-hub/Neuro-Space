import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Activity } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/timetable": "Timetable",
  "/assignments": "Assignments",
  "/exams": "Exams",
  "/notes": "Notes",
  "/projects": "Projects",
  "/gpa": "GPA",
  "/ai": "AI Assistant",
  "/settings": "Settings",
};

const Header = () => {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentPage = PAGE_LABELS[location.pathname] ?? "Unknown Module";

  return (
    <header className="h-16 border-b-2 border-[#1a1a1a] bg-void/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 font-mono">

      {/* ---------- Left: System identity ---------- */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-bold">
            System Status
          </span>
          <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-white leading-tight truncate">
            COGNITIVE OPERATIONS CENTER
          </h2>
          <p className="hidden sm:block text-[10px] text-gray-600 tracking-wide">
            NEURAL SYSTEMS READY.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-safe/40 bg-safe/10 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-safe font-bold">
            Online
          </span>
        </div>
      </div>

      {/* ---------- Center: current page + live monitoring ---------- */}
      <div className="hidden md:flex flex-col items-center px-3">
        <span className="text-[9px] uppercase tracking-[0.3em] text-gray-600">
          Current Module
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-200">
          {currentPage}
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-gray-800 bg-surface shrink-0">
        <Activity size={12} className="text-safe animate-pulse" />
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
          Live Monitoring
        </span>
      </div>

      {/* ---------- Right: user + clock ---------- */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] uppercase tracking-widest text-gray-500">
            Welcome Master
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-white">
            LIGHT
          </p>
        </div>

        <div className="flex flex-col items-end px-3 py-1.5 border border-gray-800 bg-surface">
          <span className="text-[9px] uppercase tracking-widest text-gray-500">
            {now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="text-xs font-bold font-mono text-safe">
            {now.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;