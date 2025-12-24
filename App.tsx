import React, { useState, useRef, useCallback } from 'react';
import Scene from './components/Scene';

// --- CONFIGURATION ---
// 这指定了程序去哪里找图片。
// 这里的 "/" 代表网站的根目录（public 文件夹）
const PHOTO_URL = "/surprise.jpg";

const App: React.FC = () => {
  const [isTreeMode, setIsTreeMode] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);

  // Refs for Long Press Logic
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const ignoreClickRef = useRef(false);

  // --- HANDLERS ---

  // 1. Double Click (Desktop)
  const handleDoubleClick = () => {
    setShowPhoto(true);
  };

  // 2. Long Press (Mobile)
  const handleTouchStart = () => {
    isLongPressRef.current = false;
    ignoreClickRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      ignoreClickRef.current = true;
      setShowPhoto(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 3. Tree Interaction
  const toggleMode = useCallback(() => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    setIsTreeMode(prev => !prev);
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden select-none"
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene isTreeMode={isTreeMode} onSceneClick={toggleMode} />
      </div>

      {/* UI Overlay */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${showUI && !showPhoto ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute top-12 w-full text-center px-4">
          <h1 className="font-['Great_Vibes'] text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 drop-shadow-[0_0_25px_rgba(253,224,71,0.6)] tracking-wide">
            Merry Christmas
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2 opacity-80">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-yellow-500"></div>
             <p className="font-['Cinzel'] text-yellow-500 text-xs md:text-sm tracking-[0.4em] uppercase">
                Luxury Holiday Experience
             </p>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-yellow-500"></div>
          </div>
        </div>

        <div className="absolute bottom-10 w-full text-center pointer-events-auto">
          <p className="font-sans text-yellow-100/40 text-[10px] md:text-xs tracking-widest uppercase animate-pulse mb-2">
            {isTreeMode ? "Click to disperse" : "Click to restore"}
          </p>
          <p className="font-sans text-yellow-500/30 text-[9px] uppercase tracking-wider">
            Double Click / Long Press for Surprise
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-4 pointer-events-auto">
        <button 
          onClick={() => setShowUI(!showUI)}
          className={`bg-black/40 backdrop-blur-sm border border-yellow-500/30 text-yellow-500 px-4 py-2 text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all duration-300 rounded-sm ${showPhoto ? 'hidden' : ''}`}
        >
          {showUI ? 'Hide UI' : 'Show UI'}
        </button>
      </div>

      {/* PHOTO OVERLAY */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-700 ${showPhoto ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setShowPhoto(false)}
      >
        <div 
          className={`relative max-w-[90vw] max-h-[85vh] p-1 md:p-2 bg-gradient-to-br from-yellow-600/40 via-yellow-900/20 to-yellow-600/40 rounded-lg shadow-[0_0_100px_rgba(234,179,8,0.15)] transition-transform duration-700 ${showPhoto ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-400 rounded-br-lg"></div>

          <div className="relative overflow-hidden rounded border border-yellow-500/20 bg-black flex justify-center items-center">
             <img 
               src={PHOTO_URL} 
               alt="Christmas Surprise" 
               className="max-w-full max-h-[75vh] object-contain block"
               draggable={false}
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
          </div>

          <button 
            onClick={() => setShowPhoto(false)}
            className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-yellow-400 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default App;