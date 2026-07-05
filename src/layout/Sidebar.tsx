import { useEffect, useRef, useState } from "react";
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
  Camera,
  User,
} from "lucide-react";
import { NavLink } from "react-router-dom";

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

const PROFILE_PIC_STORAGE_KEY = "neurospace_profile_picture";
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — keeps localStorage happy

const loadProfilePicture = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PROFILE_PIC_STORAGE_KEY);
  } catch {
    return null;
  }
};

const Sidebar = () => {
  const [profilePicture, setProfilePicture] = useState<string | null>(() => loadProfilePicture());
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (profilePicture) {
        window.localStorage.setItem(PROFILE_PIC_STORAGE_KEY, profilePicture);
      } else {
        window.localStorage.removeItem(PROFILE_PIC_STORAGE_KEY);
      }
    } catch {
      // storage full or unavailable — fail silently
    }
  }, [profilePicture]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("Image too large (4MB limit).");
      e.target.value = "";
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(String(reader.result));
    };
    reader.onerror = () => {
      setUploadError("Failed to read image.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePicture = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfilePicture(null);
  };

  return (
    <aside className="w-64 min-h-screen bg-void border-r-2 border-[#1a1a1a] text-white flex flex-col font-mono">
      {/* ---------- Brand / System block ---------- */}
      <div className="p-6 border-b border-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-safe rounded-full animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-safe font-bold">
            Online
          </span>
        </div>

        {/* ---------- Profile picture upload ---------- */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleAvatarClick}
            title={profilePicture ? "Change profile picture" : "Upload profile picture"}
            className="group relative w-14 h-14 shrink-0 border-2 border-gray-800 hover:border-safe/60 bg-surface overflow-hidden transition-colors"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={22} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={16} className="text-safe" />
            </div>
          </button>

          <div className="flex flex-col gap-1 min-w-0">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors text-left w-fit"
            >
              {profilePicture ? "Change photo" : "Upload photo"}
            </button>
            {profilePicture && (
              <button
                type="button"
                onClick={handleRemovePicture}
                className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-panic transition-colors text-left w-fit"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploadError && (
          <p className="text-[9px] uppercase tracking-widest text-panic font-bold mb-3">
            {uploadError}
          </p>
        )}

        <h1 className="text-xl font-bold tracking-widest uppercase text-white leading-tight">
          Neuro<span className="text-safe">_</span>Space
        </h1>
        <p className="text-[9px] uppercase tracking-[0.25em] text-gray-500 mt-1">
          COGNITIVE OPERATIONS CENTER
        </p>

        <div className="mt-4 flex items-center gap-2 px-2 py-1.5 border border-gray-800 bg-surface w-fit">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
            Student Mode
          </span>
        </div>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 flex flex-col gap-1 p-4">
        {links.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 border transition-all duration-200 ${
                isActive
                  ? "border-safe/40 bg-safe/10 text-safe"
                  : "border-transparent text-gray-500 hover:border-gray-700 hover:text-gray-200 hover:bg-surface"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${
                    isActive
                      ? "bg-safe shadow-[0_0_8px_rgba(0,255,157,0.6)]"
                      : "bg-transparent group-hover:bg-gray-700"
                  }`}
                />
                <Icon
                  size={16}
                  className={isActive ? "text-safe" : "text-gray-500 group-hover:text-gray-300 transition-colors"}
                />
                <span
                  className={`text-[11px] uppercase tracking-widest font-bold ${
                    isActive ? "text-safe" : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ---------- Footer status ---------- */}
      <div className="p-4 border-t border-gray-900">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-gray-600">
          <span>v2.0</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-safe rounded-full animate-pulse" /> Synced
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;