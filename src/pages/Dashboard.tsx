const Dashboard = () => {
  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold">🧠 NeuroSpace</h1>

      <p className="mt-2 text-gray-400">
        Welcome to your Academic Operating System.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

        <div className="border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">📚 Upcoming Exam</h2>
          <p className="mt-3 text-gray-400">
            Your exam countdown will appear here.
          </p>
        </div>

        <div className="border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">📝 Assignments</h2>
          <p className="mt-3 text-gray-400">
            No assignments yet.
          </p>
        </div>

        <div className="border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">📅 Timetable</h2>
          <p className="mt-3 text-gray-400">
            No classes today.
          </p>
        </div>

        <div className="border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">📊 GPA</h2>
          <p className="mt-3 text-gray-400">
            GPA Calculator coming soon.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;