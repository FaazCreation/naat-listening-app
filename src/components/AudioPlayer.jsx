import React, { useState, useRef, useEffect } from "react";
import { SkipBack, SkipForward, Repeat, Shuffle, Trash2, Home, ListMusic, Heart } from "lucide-react";
import axios from "axios";

const naatList = [
  {
    title: "Meri Baat Ban Gayi Hai",
    artist: "Al Haaj Hafiz Muhammad Tahir Qadri",
    src: "/audio/meri-baat-ban-gayee-hai.mp3",
    cover: "/covers/cover1.jpg",
  },
  {
    title: "Naat 2",
    artist: "Artist B",
    src: "/audio/maula-ya-salli-wa-sallim.mp3",
    cover: "/covers/cover2.jpg",
  },
  {
    title: "Naat 3",
    artist: "Artist C",
    src: "/audio/assubhu-bada.mp3",
    cover: "/covers/cover3.jpg",
  },
];

// Simple Toast component
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded shadow-lg z-50">
      {message}
    </div>
  );
}

export default function AudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  // favorites is a Set of indexes (numbers)
 const [favorites, setFavorites] = useState(() => {
  try {
    const stored = localStorage.getItem("favorites");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
});

const [playlist, setPlaylist] = useState(() => {
  try {
    const stored = localStorage.getItem("playlist");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

  // view can be: home, playlist, favorites
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const nextTrack = () => {
    if (isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * naatList.length);
      } while (randomIndex === currentIndex);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((i) => (i + 1) % naatList.length);
    }
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentIndex((i) => (i - 1 + naatList.length) % naatList.length);
    setIsPlaying(true);
  };

  const toggleLoop = () => setIsLoop(!isLoop);
  const toggleShuffle = () => setIsShuffle(!isShuffle);

  const onTimeUpdate = () => setProgress(audioRef.current.currentTime);
  const onLoadedMetadata = () => setDuration(audioRef.current.duration);

  const onSeek = (e) => {
  const rect = progressRef.current.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const newTime = (clickX / rect.width) * duration;
  audioRef.current.currentTime = newTime;
  setProgress(newTime);

  if (audioRef.current.paused && isPlaying) {
    audioRef.current.play().catch(err => console.warn("Auto play failed after seek", err));
  }
};


  const onEnded = () => {
    if (isLoop) {
      audioRef.current.play();
    } else {
      nextTrack();
    }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;
  audio.pause();
  audio.load();
  if (isPlaying) {
    audio.play().catch((e) => console.error("Playback error:", e));
  }
}, [currentIndex]);

  useEffect(() => {
    const storedVolume = localStorage.getItem("volume");
    if (storedVolume !== null) {
      const vol = parseFloat(storedVolume);
      setVolume(vol);
      if (audioRef.current) {
        audioRef.current.volume = vol;
        setIsMuted(vol === 0);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("volume", volume);
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
  const savedIndex = localStorage.getItem("currentIndex");
  if (savedIndex !== null) setCurrentIndex(Number(savedIndex));
  }, []);



  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        nextTrack();
      } else if (e.code === "ArrowLeft") {
        prevTrack();
      } else if (e.code === "ArrowUp") {
        setVolume((v) => Math.min(1, v + 0.1));
      } else if (e.code === "ArrowDown") {
        setVolume((v) => Math.max(0, v - 0.1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume]);

  // Functions to add/remove favorites and playlist

  const handleToggleFavorite = (index) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        showToast("❌ Removed from Favorites");
      } else {
        newSet.add(index);
        showToast("❤️ Added to Favorites");
      }
      return newSet;
    });
  };

  const handleAddToPlaylist = (index) => {
    const track = naatList[index];
    if (!playlist.some((item) => item.src === track.src)) {
      setPlaylist([...playlist, track]);
      showToast("✅ Added to Playlist");
    } else {
      showToast("⚠️ Already in Playlist");
    }
  };

  const handleRemoveFavorite = (index) => {
    setFavorites((prev) => {
      const updated = new Set(prev);
      updated.delete(index);
      showToast("❌ Removed from Favorites");
      return updated;
    });
  };

  const handleRemoveFromPlaylist = (src) => {
    setPlaylist((prev) => {
      const updated = prev.filter((item) => item.src !== src);
      showToast("❌ Removed from Playlist");
      return updated;
    });
  };

  // Save favorites and playlist to backend (optional)
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("playlist", JSON.stringify(playlist));
  }, [playlist]);



  // For debugging:
  // useEffect(() => { console.log("Favorites:", [...favorites]); }, [favorites]);
  // useEffect(() => { console.log("Playlist:", playlist); }, [playlist]);

  // Layout and responsive logic:
  // On mobile: only show player card + bottom nav buttons
  // On desktop: show full playlist/favorites/home list next to player

  // Detect mobile with window width (simple)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // For mobile view, when view !== "home" show list full screen,
  // else only show player card.

  return (
    <>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white pb-20 px-1 pt-1 min-h-screen flex flex-col">
        {/* Player + main content container */}
        <div className="flex flex-1 flex-col md:flex-row gap-4">
          {/* Left: Player card */}
          {!(isMobile && view === "naat") && (
            <div className="md:w-1/3 bg-purple-100 dark:bg-purple-900 rounded-lg p-4 flex flex-col items-center">
              <img
                src={naatList[currentIndex].cover}
                alt={naatList[currentIndex].title}
                className="rounded-lg mb-4 w-full object-cover max-h-64"
              />
              <h2 className="text-xl font-bold">{naatList[currentIndex].title}</h2>
              <p className="text-sm opacity-70">{naatList[currentIndex].artist}</p>

              <audio
                ref={audioRef}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
              >
                <source src={naatList[currentIndex].src} type="audio/mp3" />
              </audio>

              {/* Progress bar */}
              <div
                ref={progressRef}
                className="w-full h-2 bg-purple-300 rounded my-4 cursor-pointer"
                onClick={onSeek}
              >
                <div
                  className="h-2 bg-purple-700 rounded"
                  style={{ width: `${(progress / duration) * 100 || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-xs opacity-70 font-mono">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex gap-3 my-3 text-purple-700 dark:text-purple-300 items-center">
                <button
                  aria-label="Shuffle"
                  onClick={toggleShuffle}
                  className={`p-2 rounded ${isShuffle ? "bg-purple-700 text-white" : "hover:bg-purple-300 dark:hover:bg-purple-800"}`}
                >
                  <Shuffle size={20} />
                </button>
                <button
                  aria-label="Previous"
                  onClick={prevTrack}
                  className="p-2 rounded hover:bg-purple-300 dark:hover:bg-purple-800"
                >
                  <SkipBack size={24} />
                </button>
                <button
                  aria-label="Play/Pause"
                  onClick={togglePlay}
                  className="p-3 rounded-full bg-purple-700 text-white shadow-lg hover:brightness-90"
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  )}
                </button>
                <button
                  aria-label="Next"
                  onClick={nextTrack}
                  className="p-2 rounded hover:bg-purple-300 dark:hover:bg-purple-800"
                >
                  <SkipForward size={24} />
                </button>
                <button
                  aria-label="Loop"
                  onClick={toggleLoop}
                  className={`p-2 rounded ${isLoop ? "bg-purple-700 text-white" : "hover:bg-purple-300 dark:hover:bg-purple-800"}`}
                >
                  <Repeat size={20} />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 w-full">
                <button
                  aria-label="Mute/Unmute"
                  onClick={() => {
                    if (isMuted) {
                      setVolume(0.5);
                      setIsMuted(false);
                      if (audioRef.current) audioRef.current.volume = 0.5;
                    } else {
                      setVolume(0);
                      setIsMuted(true);
                      if (audioRef.current) audioRef.current.volume = 0;
                    }
                  }}
                  className="p-2 rounded hover:bg-purple-300 dark:hover:bg-purple-800"
                >
                  {isMuted || volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M16.5 12l5-5m0 10l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 9v6H5l-4 4V5l4 4h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M5 9v6h4l5 5V4L9 9H5z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                    if (audioRef.current) audioRef.current.volume = val;
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}


          {/* ✅ Right: List views (hidden on mobile when view === "home") */}
          {(!isMobile || view !== "home") && (
            <div className="md:w-2/3 overflow-auto max-h-[calc(100vh-5rem)]">
              {/* Home view: all naatList */}
              {view === "home" && (
                <>
                  <h3 className="font-semibold mb-2">All Naats {loading && "(loading...)"}</h3>
                  <ul>
                    {naatList.map((track, i) => (
                      <li
                        key={i}
                        className={`flex justify-between items-center p-2 border-b rounded cursor-pointer ${currentIndex === i ? "bg-purple-200 dark:bg-purple-700" : "hover:bg-gray-200 dark:hover:bg-gray-800"
                          }`}
                      >

                        <div
                          onClick={() => {
                            setCurrentIndex(i);
                            setIsPlaying(true);
                          }}
                          className="flex gap-4 items-center flex-1"
                        >
                          <img src={track.cover} alt={track.title} className="w-12 h-12 rounded object-cover" />
                          <div>
                            <h4 className="font-semibold">{track.title}</h4>
                            <p className="text-xs opacity-70">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            aria-label="Add to Playlist"
                            onClick={() => handleAddToPlaylist(i)}
                            className={`p-2 rounded hover:bg-purple-200 dark:hover:bg-purple-800 ${playlist.some((item) => item.src === track.src)
                                ? "bg-purple-600 text-white"
                                : "text-purple-600 dark:text-purple-300"
                              }`}
                          >
                            <ListMusic size={18} />
                          </button>
                          <button
                            aria-label="Toggle Favorite"
                            onClick={() => handleToggleFavorite(i)}
                            className={`p-2 rounded hover:bg-red-200 dark:hover:bg-red-800 ${favorites.has(i) ? "bg-red-500 text-white" : "bg-transparent"
                              }`}
                          >
                            <Heart size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Playlist view */}
              {view === "playlist" && (
                <>
                  <h3 className="font-semibold mb-2">
                    My Playlist {loading && "(loading...)"}
                    {playlist.length === 0 && <span className="ml-2 opacity-70">No tracks added yet.</span>}
                  </h3>
                  {playlist.length > 0 && (
                    <ul>
                      {playlist.map((track, i) => (
                        <li
                          key={track.src}
                          className="flex justify-between items-center p-2 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                        >
                          <div
                            onClick={() => {
                              const foundIndex = naatList.findIndex((t) => t.src === track.src);
                              if (foundIndex !== -1) setCurrentIndex(foundIndex);
                              else setCurrentIndex(0);
                              setIsPlaying(true);
                            }}
                            className="flex gap-4 items-center flex-1 cursor-pointer"
                          >
                            <img src={track.cover} alt={track.title} className="w-12 h-12 rounded object-cover" />
                            <div>
                              <h4 className="font-semibold">{track.title}</h4>
                              <p className="text-xs opacity-70">{track.artist}</p>
                            </div>
                          </div>
                          <button
                            aria-label="Remove from Playlist"
                            onClick={() => handleRemoveFromPlaylist(track.src)}
                            className="p-2 rounded hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {/* Favorites view */}
              {view === "favorites" && (
                <>
                  <h3 className="font-semibold mb-2">
                    Favorites {loading && "(loading...)"}
                    {favorites.size === 0 && <span className="ml-2 opacity-70">No favorites added yet.</span>}
                  </h3>
                  {favorites.size > 0 && (
                    <ul>
                      {[...favorites].map((index) => {
                        if (!naatList[index]) return null;
                        const fav = naatList[index];
                        return (
                          <li
                            key={index}
                            className="flex justify-between items-center p-2 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                          >
                            <div
                              onClick={() => {
                                setCurrentIndex(index);
                                setIsPlaying(true);
                              }}
                              className="flex gap-4 items-center flex-1 cursor-pointer"
                            >
                              <img src={fav.cover} alt={fav.title} className="w-12 h-12 rounded object-cover" />
                              <div>
                                <h4 className="font-semibold">{fav.title}</h4>
                                <p className="text-xs opacity-70">{fav.artist}</p>
                              </div>
                            </div>
                            <button
                              aria-label="Remove from Favorites"
                              onClick={() => handleRemoveFavorite(index)}
                              className="p-2 rounded hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                            >
                              <Trash2 size={18} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
              {view === "naat" && (
                <>
                  <h3 className="font-semibold mb-2">All Naats</h3>
                  <ul>
                    {naatList.map((track, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center p-2 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded"
                      >
                        <div
                          onClick={() => {
                            setCurrentIndex(i);
                            setIsPlaying(true);
                          }}
                          className="flex gap-4 items-center flex-1"
                        >
                          <img src={track.cover} alt={track.title} className="w-12 h-12 rounded object-cover" />
                          <div>
                            <h4 className="font-semibold">{track.title}</h4>
                            <p className="text-xs opacity-70">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            aria-label="Add to Playlist"
                            onClick={() => handleAddToPlaylist(i)}
                            className={`p-2 rounded hover:bg-purple-200 dark:hover:bg-purple-800 ${playlist.some((item) => item.src === track.src)
                                ? "bg-purple-600 text-white"
                                : "text-purple-600 dark:text-purple-300"
                              }`}
                          >
                            <ListMusic size={18} />
                          </button>
                          <button
                            aria-label="Toggle Favorite"
                            onClick={() => handleToggleFavorite(i)}
                            className={`p-2 rounded hover:bg-red-200 dark:hover:bg-red-800 ${favorites.has(i) ? "bg-red-500 text-white" : "bg-transparent"
                              }`}
                          >
                            <Heart size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

        </div>
        {/* Desktop Nav Buttons (visible only on md and up) */}
        <div className="hidden md:flex gap-4 justify-start items-center mt-6">
          <button
            onClick={() => setView("home")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === "home"
                ? "bg-purple-700 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            }`}
          >
            <Home className="inline-block mr-2" size={18} />
            Home
          </button>
          <button
            onClick={() => setView("naat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "naat"
                ? "bg-purple-700 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-800"
              }`}
          >
            <ListMusic className="inline-block mr-2" size={18} />
            Naat
          </button>
          <button
            onClick={() => setView("playlist")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === "playlist"
                ? "bg-purple-700 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            }`}
          >
            <ListMusic className="inline-block mr-2" size={18} />
            Playlist
          </button>
          <button
            onClick={() => setView("favorites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === "favorites"
                ? "bg-purple-700 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            }`}
          >
            <Heart className="inline-block mr-2" size={18} />
            Favorites
          </button>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 flex justify-around py-3 md:hidden">
          <button
            className={`flex flex-col items-center text-sm outline-none border-none hover:outline-none focus:ring-0 ${view === "home" ? "text-purple-700" : "opacity-50"
              }`}
            onClick={() => setView("home")}
            aria-label="Home"
          >
            <Home size={24} />
            Home
          </button>

          <button
            className={`flex flex-col items-center text-sm outline-none border-none hover:outline-none focus:ring-0 ${view === "naat" ? "text-purple-700" : "opacity-50"
              }`}
            onClick={() => setView("naat")}
            aria-label="Naat"
          >
            <ListMusic size={24} />
            Naat
          </button>
          <button
            className={`flex flex-col items-center text-sm outline-none border-none hover:outline-none focus:ring-0 ${view === "playlist" ? "text-purple-700" : "opacity-50"
              }`}
            onClick={() => setView("playlist")}
            aria-label="Playlist"
          >
            <ListMusic size={24} />
            Playlist
          </button>
          <button
            className={`flex flex-col items-center text-sm outline-none border-none hover:outline-none focus:ring-0 ${view === "favorites" ? "text-purple-700" : "opacity-50"
              }`}
            onClick={() => setView("favorites")}
            aria-label="Favorites"
          >
            <Heart size={24} />
            Favorites
          </button>
        </div>
      </div>
    </>
  );
}
