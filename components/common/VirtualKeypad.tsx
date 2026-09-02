import React, { useState, useEffect, useMemo } from 'react';
import { Shuffle, Delete, ArrowBigUp, Space, X, Shield, Lock, Sparkles } from 'lucide-react';

interface VirtualKeypadProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose: () => void;
  autoShuffle?: boolean;
}

type PadTab = 'scrambled' | 'pin' | 'alpha' | 'symbols';

export const VirtualKeypad: React.FC<VirtualKeypadProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onClose,
  autoShuffle = true,
}) => {
  const [activeTab, setActiveTab] = useState<PadTab>('scrambled');
  const [isCaps, setIsCaps] = useState<boolean>(false);
  const [shuffleTrigger, setShuffleTrigger] = useState<number>(0);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Base key pools
  const numPool = useMemo(() => ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], []);
  const alphaLower = useMemo(() => 'abcdefghijklmnopqrstuvwxyz'.split(''), []);
  const alphaUpper = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);
  const symbolPool = useMemo(() => ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '{', '}', '[', ']', '|', ';', ':', "'", '"', '<', '>', ',', '.', '?', '/', '~', '`'], []);

  // Compute active key list
  const activeKeys = useMemo(() => {
    if (activeTab === 'pin') {
      return autoShuffle ? shuffleArray(numPool) : numPool;
    }
    if (activeTab === 'alpha') {
      const pool = isCaps ? alphaUpper : alphaLower;
      return autoShuffle ? shuffleArray(pool) : pool;
    }
    if (activeTab === 'symbols') {
      return autoShuffle ? shuffleArray(symbolPool) : symbolPool;
    }
    // 'scrambled' mode - Full Mixed Matrix
    const combined = [...numPool, ...(isCaps ? alphaUpper : alphaLower), ...symbolPool.slice(0, 14)];
    return shuffleArray(combined);
  }, [activeTab, isCaps, shuffleTrigger, autoShuffle, numPool, alphaLower, alphaUpper, symbolPool]);

  const handleKeyClick = (key: string) => {
    onKeyPress(key);
    if (autoShuffle) {
      setShuffleTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-2xl shadow-2xl shadow-cyan-950/50 space-y-3 font-mono select-none animate-scale-up z-50">
      
      {/* Header & Modes */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-widest">SCRAMBLED VIRTUAL MATRIX</span>
          <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
            ANTI-KEYLOGGER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShuffleTrigger(prev => prev + 1)}
            title="Manual Shuffle Keys"
            className="p-1.5 bg-white/5 hover:bg-cyan-500/20 text-cyan-400 rounded-lg border border-white/10 transition-all active:scale-95 flex items-center gap-1 text-[10px]"
          >
            <Shuffle size={12} />
            <span>Shuffle</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg border border-white/10 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-[10px]">
        {[
          { id: 'scrambled' as PadTab, label: '🔀 Scrambled' },
          { id: 'pin' as PadTab, label: '🔢 PIN (0-9)' },
          { id: 'alpha' as PadTab, label: '🔤 Alphabet' },
          { id: 'symbols' as PadTab, label: '⚡ Symbols' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Key Grid */}
      <div className={`grid gap-1.5 ${
        activeTab === 'pin' ? 'grid-cols-5' : 'grid-cols-6 sm:grid-cols-7'
      }`}>
        {activeKeys.map((k, idx) => (
          <button
            key={`${k}-${idx}-${shuffleTrigger}`}
            type="button"
            onClick={() => handleKeyClick(k)}
            className="h-10 bg-slate-800/80 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-white font-bold text-sm rounded-xl border border-white/10 transition-all active:scale-90 flex items-center justify-center shadow-md active:bg-cyan-500/30 group"
          >
            <span className="group-hover:scale-110 transition-transform">{k}</span>
          </button>
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
        {(activeTab === 'alpha' || activeTab === 'scrambled') && (
          <button
            type="button"
            onClick={() => setIsCaps(!isCaps)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isCaps 
                ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <ArrowBigUp size={14} />
            <span>CAPS</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleKeyClick(' ')}
          className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Space size={14} />
          <span>Space (␣)</span>
        </button>

        <button
          type="button"
          onClick={onBackspace}
          className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Delete size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          Clear
        </button>
      </div>

    </div>
  );
};
