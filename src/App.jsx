import { useState, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import { Sun, Moon, Crown } from "lucide-react";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 dark:from-gray-900 dark:to-black flex flex-col p-4">
      {/* Top Bar: App name and Toggle Button */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-white dark:text-gray-200">
          <Crown className="h-6 w-6 text-yellow-300" />
          <h1 className="text-2xl font-semibold tracking-wide select-none">Sukūn</h1>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle Dark Mode"
          className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center"
        >
          {darkMode ? (
            <Sun className="h-6 w-6 text-yellow-400" />
          ) : (
            <Moon className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Audio Player component centered */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <AudioPlayer />
      </div>
    </div>
  );
}

export default App;
