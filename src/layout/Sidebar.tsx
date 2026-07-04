import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BookOpen,
  FileText,
  FolderKanban,
  GraduationCap,
  Bot,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const links = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Timetable", icon: CalendarDays, path: "/timetable" },
    { name: "Assignments", icon: ClipboardList, path: "/assignments" },
    { name: "Exams", icon: BookOpen, path: "/exams" },
    { name: "Notes", icon: FileText, path: "/notes" },
    { name: "Projects", icon: FolderKanban, path: "/projects" },
    { name: "GPA", icon: GraduationCap, path: "/gpa" },
    { name: "AI", icon: Bot, path: "/ai" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#0b0f19] border-r border-gray-800 text-white p-6">

      <h1 className="text-3xl font-extrabold mb-10 tracking-wide">
        🧠 NeuroSpace
      </h1>

      <nav className="space-y-2">

        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500 text-black font-bold"
                    : "hover:bg-gray-800 hover:text-cyan-400"
                }`
              }
            >
              <Icon size={20} />
              {link.name}
            </NavLink>
          );
        })}

      </nav>
    </aside>
  );
};

export default Sidebar;