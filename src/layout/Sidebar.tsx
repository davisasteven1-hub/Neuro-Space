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

const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-[#0b0f19] border-r border-gray-800 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">
        🧠 NeuroSpace
      </h1>

      <nav className="space-y-3">

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <LayoutDashboard size={20}/>
          Dashboard
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <CalendarDays size={20}/>
          Timetable
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <ClipboardList size={20}/>
          Assignments
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <BookOpen size={20}/>
          Exams
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <FileText size={20}/>
          Notes
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <FolderKanban size={20}/>
          Projects
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <GraduationCap size={20}/>
          GPA
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <Bot size={20}/>
          AI
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <Settings size={20}/>
          Settings
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;