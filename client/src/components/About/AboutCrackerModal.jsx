import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Skull } from 'lucide-react';

const ASCII_ART = String.raw`
    __  ___           _      __          __  
   /  |/  /          (_)____/ /   ____ _/ /_ 
  / /|_/ /__  __ ___  / ___/ /   / __ \`/ __ \ 
 / /  / / / / / (__  ) /__/ /___/ /_/ / /_/ /
/_/  /_/\__,_/_/____/\___/_____/\__,_/_.___/ 
`;

export default function AboutCrackerModal({ isOpen, onClose }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#050505] border border-[#00ffcc] overflow-hidden shadow-[0_0_20px_rgba(0,255,204,0.15)] animate-scale-in"
      >
        {/* CRT Scanline effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 6px 100%',
          zIndex: 10
        }}/>
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#00ffcc]/10 border-b border-[#00ffcc]/50 p-2">
          <div className="flex items-center gap-2 pl-1">
            <Skull size={14} className="text-[#00ffcc]" />
            <span className="text-[#00ffcc] font-mono font-bold text-[10px] uppercase tracking-[0.3em]">MUSICLAB v2.0.1</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#00ffcc] hover:text-white hover:bg-[#00ffcc]/20 p-1 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 relative">
          <div className={`text-[#00ffcc] font-mono whitespace-pre text-center text-[8px] md:text-sm leading-tight mb-8 drop-shadow-[0_0_5px_rgba(0,255,204,0.5)] ${glitch ? 'translate-x-[2px] -translate-y-[2px] text-[#ff00cc] drop-shadow-[0_0_5px_rgba(255,0,204,0.8)]' : ''}`}>
            {ASCII_ART}
          </div>

          <div className="space-y-6 font-mono text-center relative z-20">
            <div>
              <p className="text-[#00ffcc]/70 text-xs mb-2 tracking-[0.2em]">PROUDLY PRESENTS</p>
              <h2 className="text-3xl text-white font-bold tracking-[0.2em] mb-1 drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]">MUSICLAB</h2>
              <p className="text-[#00ffcc] text-[10px] md:text-xs tracking-widest">WEB-BASED MUSIC PRODUCTION ENVIRONMENT</p>
            </div>

            <div className="border border-[#00ffcc]/30 p-5 bg-black/50 inline-block mx-auto text-left w-full max-w-md shadow-[inset_0_0_15px_rgba(0,255,204,0.05)]">
              <div className="text-[#00ffcc] text-xs space-y-3">
                <p className="flex"><span className="text-[#00ffcc]/50 w-28">RELEASE DATE :</span> <span>{new Date().toISOString().split('T')[0]}</span></p>
                <p className="flex"><span className="text-[#00ffcc]/50 w-28">AUTHOR       :</span> <span>ZUBENELAKRAB</span></p>
                <p className="flex"><span className="text-[#00ffcc]/50 w-28">PROTECTION   :</span> <span>NONE (OPEN SOURCE)</span></p>
                <p className="flex"><span className="text-[#00ffcc]/50 w-28">PLATFORM     :</span> <span>WEB BROWSER</span></p>
              </div>
            </div>

            <div className="pt-6 pb-12 md:pb-16">
              <a 
                href="https://github.com/zubenelakrab/MusicLab" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-black hover:shadow-[0_0_15px_rgba(0,255,204,0.6)] transition-all font-bold tracking-[0.2em] uppercase text-xs group"
              >
                <span>GET THE SOURCE CODE</span>
                <ExternalLink size={14} className="group-hover:animate-bounce" />
              </a>
            </div>
            
            {/* Scrolling Marquee */}
            <div className="mt-8 overflow-hidden bg-[#00ffcc]/5 py-2 border-y border-[#00ffcc]/20 absolute bottom-0 left-0 right-0">
              <div className="whitespace-nowrap animate-[marquee_15s_linear_infinite]">
                <span className="text-[#00ffcc]/70 text-[10px] font-bold tracking-[0.2em]">
                  *** GREETINGS TO ALL THE OPEN SOURCE COMMUNITIES *** RESPECT TO TIDALCYCLES & STRUDEL CREATORS *** KEEP MAKING NOISE *** NO WAR ONLY MUSIC *** IF YOU LIKE THIS SOFTWARE, STAR IT ON GITHUB *** 
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}