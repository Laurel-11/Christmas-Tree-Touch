import React, { useState } from 'react';
import Scene from './components/Scene';

const App: React.FC = () => {
  const [isTreeMode, setIsTreeMode] = useState(true);
  const [showUI, setShowUI] = useState(true);

  const toggleMode = () => {
    setIsTreeMode(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene isTreeMode={isTreeMode} onSceneClick={toggleMode} />
      </div>

      {/* UI Overlay */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${showUI ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Title */}
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

        {/* Instructions */}
        <div className="absolute bottom-10 w-full text-center">
          <p className="font-sans text-yellow-100/40 text-[10px] md:text-xs tracking-widest uppercase animate-pulse">
            {isTreeMode ? "Click to disperse" : "Click to restore"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        <button 
          onClick={() => setShowUI(!showUI)}
          className="bg-black/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-500 px-4 py-2 text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all duration-300 rounded-sm"
        >
          {showUI ? 'Hide UI' : 'Show UI'}
        </button>
      </div>
    </div>
  );
};

export default App;