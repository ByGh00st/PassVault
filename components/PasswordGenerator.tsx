import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Check, Zap, Settings2, Sparkles, AlertCircle } from 'lucide-react';
import { PasswordGeneratorOptions } from '../types';

interface PasswordGeneratorProps {
  onSelect?: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSelect }) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
  });
  const [isCopied, setIsCopied] = useState(false);
  const [strength, setStrength] = useState(0);

  // Calculate strength internally for visual effects
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length > 8) score += 1;
    if (pwd.length > 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 5);
  };

  const generate = useCallback(() => {
    const charset = [
      options.useUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
      options.useLowercase ? 'abcdefghijklmnopqrstuvwxyz' : '',
      options.useNumbers ? '0123456789' : '',
      options.useSymbols ? '!@#$%^&*()_+~`|}{[]:;?><,./-=' : ''
    ].join('');

    if (!charset) return;

    let password = '';
    const cryptoObj = window.crypto;
    const randomValues = new Uint32Array(options.length);
    cryptoObj.getRandomValues(randomValues);

    for (let i = 0; i < options.length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    setGeneratedPassword(password);
    setStrength(calculateStrength(password));
    setIsCopied(false);
  }, [options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Helper to colorize password characters (Syntax Highlighting for Passwords)
  const renderColoredPassword = (pwd: string) => {
      return pwd.split('').map((char, index) => {
          let colorClass = 'text-white';
          if (/[0-9]/.test(char)) colorClass = 'text-orange-400';
          else if (/[^A-Za-z0-9]/.test(char)) colorClass = 'text-pink-400 font-bold';
          else if (/[A-Z]/.test(char)) colorClass = 'text-cyan-300';
          
          return <span key={index} className={`${colorClass} transition-colors duration-300`}>{char}</span>;
      });
  };

  const getStrengthColor = (s: number) => {
      if (s <= 2) return 'bg-rose-500 shadow-rose-500/50';
      if (s === 3) return 'bg-amber-500 shadow-amber-500/50';
      return 'bg-emerald-500 shadow-emerald-500/50';
  };

  const getStrengthLabel = (s: number) => {
      if (s <= 2) return 'WEAK';
      if (s === 3) return 'MEDIUM';
      return 'SECURE';
  };

  return (
    <div className="bg-black/40 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 blur-sm"></div>
      
      <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <span className="tracking-widest">GENERATOR</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1">GHOST PROTOCOL ENCRYPTION ENGINE</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${strength >= 4 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}>
              {getStrengthLabel(strength)}
          </div>
      </div>

      {/* Password Display Screen */}
      <div className="relative mb-8 group/display">
        <div className="bg-black/50 border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]">
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full animate-scanline pointer-events-none opacity-20"></div>

            <div className="font-mono text-2xl md:text-3xl break-all tracking-wider relative z-10 selection:bg-indigo-500/30">
                {renderColoredPassword(generatedPassword)}
            </div>
            
            {/* Strength Bar Indicator inside Display */}
            <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out" 
                 style={{ width: `${(strength / 5) * 100}%` }}
            >
                <div className={`w-full h-full ${getStrengthColor(strength)} shadow-lg`}></div>
            </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute -right-3 -top-3 flex gap-2">
            <button
            onClick={copyToClipboard}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 border border-white/10 flex items-center justify-center group/btn"
            title="Copy to Clipboard"
            >
            {isCopied ? <Check size={18} className="text-white" /> : <Copy size={18} className="group-hover/btn:scale-110 transition-transform" />}
            </button>
            <button
            onClick={generate}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl shadow-lg transition-all active:scale-95 border border-white/10 group/refresh"
            title="Regenerate"
            >
            <RefreshCw size={18} className="group-hover/refresh:rotate-180 transition-transform duration-500" />
            </button>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-8 bg-white/5 rounded-2xl p-6 border border-white/5">
        
        {/* Length Slider */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm items-end">
            <label className="text-slate-400 font-bold tracking-wider text-xs flex items-center gap-2">
                <Settings2 size={14}/> KEY LENGTH
            </label>
            <span className="text-2xl font-mono text-indigo-400 font-bold">{options.length}</span>
          </div>
          <div className="relative h-6 flex items-center">
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
              />
              {/* Custom Track */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative z-10">
                  <div 
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                    style={{ width: `${((options.length - 8) / (64 - 8)) * 100}%` }}
                  ></div>
              </div>
              {/* Custom Thumb handle visual (optional, positioned via JS or just rely on CSS for simplicity, sticking to track for now) */}
              <div 
                className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-indigo-500 z-10 pointer-events-none transition-all duration-75"
                style={{ left: `calc(${((options.length - 8) / (64 - 8)) * 100}% - 10px)` }}
              ></div>
          </div>
        </div>

        {/* Toggles - Chips Style */}
        <div>
            <label className="text-slate-400 font-bold tracking-wider text-xs block mb-3">CHARACTER SETS</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { id: 'useUppercase', label: 'ABC', name: 'Uppercase' },
                    { id: 'useLowercase', label: 'abc', name: 'Lowercase' },
                    { id: 'useNumbers', label: '123', name: 'Numbers' },
                    { id: 'useSymbols', label: '@#$', name: 'Symbols' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => {
                            // Prevent unchecking the last remaining option
                            const activeCount = Object.values(options).filter(v => v === true).length;
                            // @ts-ignore
                            if (activeCount === 1 && options[opt.id]) return;
                            
                            // @ts-ignore
                            setOptions({ ...options, [opt.id]: !options[opt.id] });
                        }}
                        // @ts-ignore
                        className={`relative group overflow-hidden rounded-xl border p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                            // @ts-ignore
                            options[opt.id] 
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' 
                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/10'
                        }`}
                    >
                        <span className={`text-xs font-bold font-mono ${
                            // @ts-ignore
                            options[opt.id] ? 'text-indigo-300' : 'text-slate-600'
                        }`}>{opt.label}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold">{opt.name}</span>
                        
                        {/* Active Indicator Dot */}
                        {/* @ts-ignore */}
                        {options[opt.id] && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(129,140,248,1)] animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Action Button */}
        <button
            onClick={generate}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl shadow-indigo-900/20 active:scale-[0.99] border border-white/10 group overflow-hidden relative"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
            <div className="relative flex items-center justify-center gap-2 tracking-widest text-sm">
                <Zap size={18} className={isCopied ? "text-emerald-300" : "text-yellow-300"} fill="currentColor" />
                GENERATE NEW KEY
            </div>
        </button>
      </div>
      
      {onSelect && (
        <div className="mt-4 text-center">
            <button 
            onClick={() => onSelect(generatedPassword)}
            className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-transparent hover:border-emerald-400 pb-0.5"
            >
            <Check size={12} /> Use this password for entry
            </button>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;