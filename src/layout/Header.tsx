const Header = () => {
  return (
    <header className="h-16 border-b border-gray-800 bg-[#0b0f19] flex items-center justify-between px-8 text-white">

      <div>
        <h2 className="text-xl font-bold">
          Academic Operating System
        </h2>

        <p className="text-sm text-gray-400">
          Stay organized. Stay ahead.
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-400">
          Welcome back
        </p>

        <p className="font-semibold">
          David
        </p>
      </div>

    </header>
  );
};

export default Header;