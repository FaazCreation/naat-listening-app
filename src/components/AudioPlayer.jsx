import React, { useState, useRef, useEffect } from "react";

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

export default function AudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());

  const audioRef = useRef(null);
  const progressRef = useRef(null);

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

  const onTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const onSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
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
      audio.play();
    }
  }, [currentIndex]);

  useEffect(() => {
    const storedVolume = localStorage.getItem("volume");
    if (storedVolume !== null) {
      const vol = parseFloat(storedVolume);
      setVolume(vol);
      audioRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("volume", volume);
  }, [volume]);

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
        setVolume((v) => {
          const newV = Math.min(1, v + 0.1);
          audioRef.current.volume = newV;
          return newV;
        });
      } else if (e.code === "ArrowDown") {
        setVolume((v) => {
          const newV = Math.max(0, v - 0.1);
          audioRef.current.volume = newV;
          return newV;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume]);

  const handleToggleFavorite = (index) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAddToPlaylist = (index) => {
    alert(`Add "${naatList[index].title}" to your playlist!`);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-6 px-4 md:px-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Panel */}
          <div className="w-full md:w-1/2">
            <h1 className="text-2xl font-bold mb-1">Sukun</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">Voice of Faith</p>

            <div className="w-40 h-40 mx-auto md:mx-0 rounded-full overflow-hidden shadow mb-6">
              <img
                src={naatList[currentIndex].cover}
                alt={naatList[currentIndex].title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center md:text-left mb-4">
              <h2 className="text-xl font-semibold">{naatList[currentIndex].title}</h2>
              <p className="text-gray-500 dark:text-gray-400">{naatList[currentIndex].artist}</p>
            </div>

            <audio
              ref={audioRef}
              src={naatList[currentIndex].src}
              muted={isMuted}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              loop={isLoop}
            />

            <div
              className="h-3 bg-gray-300 dark:bg-gray-700 rounded cursor-pointer mb-2"
              ref={progressRef}
              onClick={onSeek}
            >
              <div
                className="h-3 bg-purple-600 rounded"
                style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-4">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex justify-center md:justify-start space-x-4 mb-4">
              <button
                onClick={prevTrack}
                className="p-3 rounded-full bg-purple-100 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-gray-600 transition"
                aria-label="Previous Track"
              >
                &#9664;
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg transform hover:scale-105"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <span className="text-2xl select-none">{isPlaying ? "❚❚" : "▶"}</span>
              </button>
              <button
                onClick={nextTrack}
                className="p-3 rounded-full bg-purple-100 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-gray-600 transition"
                aria-label="Next Track"
              >
                &#9654;
              </button>
            </div>

            <div className="flex justify-center md:justify-start space-x-3 mb-4">
              <button
                onClick={toggleLoop}
                className={`px-4 py-2 rounded-full ${
                  isLoop ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-700 dark:text-white"
                } transition`}
              >
                Loop {isLoop ? "On" : "Off"}
              </button>
              <button
                onClick={toggleShuffle}
                className={`px-4 py-2 rounded-full ${
                  isShuffle ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700 dark:text-white"
                } transition`}
              >
                Shuffle {isShuffle ? "On" : "Off"}
              </button>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-4">
              <button
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  audioRef.current.muted = newMuted;
                }}
                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  audioRef.current.volume = newVolume;
                  setIsMuted(newVolume === 0);
                }}
                className="w-32"
                aria-label="Volume"
              />
            </div>
          </div>

          {/* Playlist Right Panel */}
          <div className="w-full md:w-1/2 overflow-y-auto max-h-80 rounded-lg border border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 shadow-inner">
            <h3 className="text-lg font-semibold mb-4">Playlist</h3>
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {naatList.map((naat, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPlaying(true);
                  }}
                  className={`cursor-pointer flex items-center justify-between gap-3 p-2 rounded ${
                    index === currentIndex
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <img
                      src={naat.cover}
                      alt={naat.title}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{naat.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {naat.artist}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Add to Playlist button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(index);
                      }}
                      title="Add to Playlist"
                      className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                      aria-label="Add to Playlist"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-purple-600 dark:text-purple-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(index);
                      }}
                      title={favorites.has(index) ? "Remove from Favorites" : "Add to Favorites"}
                      className={`p-1 rounded transition ${
                        favorites.has(index)
                          ? "text-red-500 hover:text-red-600"
                          : "text-gray-400 hover:text-red-500 dark:hover:text-red-600"
                      }`}
                      aria-label="Favorite"
                    >
                      {favorites.has(index) ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 fill-current"
                          viewBox="0 0 24 24"
                          stroke="none"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
