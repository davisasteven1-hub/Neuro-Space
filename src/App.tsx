import { Routes, Route } from "react-router-dom";

import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

import Dashboard from "./pages/Dashboard";
import Exams from "./pages/Exams";

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-white">
    <h1 className="text-4xl font-bold">{title}</h1>

    <p className="mt-4 text-gray-400">
      This page is under construction.
    </p>
  </div>
);

function App() {
  return (
    <div className="flex bg-[#09090B] min-h-screen">

      <Sidebar />

      <div className="flex-1">

        <Header />

        <main className="pt-20 px-6">

          <Routes>

            <Route path="/" element={<Dashboard />} />

            <Route path="/exams" element={<Exams />} />

            <Route
              path="/timetable"
              element={<Placeholder title="Timetable" />}
            />

            <Route
              path="/assignments"
              element={<Placeholder title="Assignments" />}
            />

            <Route
              path="/notes"
              element={<Placeholder title="Notes" />}
            />

            <Route
              path="/projects"
              element={<Placeholder title="Projects" />}
            />

            <Route
              path="/gpa"
              element={<Placeholder title="GPA Calculator" />}
            />

            <Route
              path="/ai"
              element={<Placeholder title="AI Assistant" />}
            />

            <Route
              path="/settings"
              element={<Placeholder title="Settings" />}
            />

          </Routes>

        </main>

      </div>

    </div>
  );
}

export default App;