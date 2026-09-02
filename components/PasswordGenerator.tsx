import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Copy, RefreshCw, Check, Zap, Settings2, Sparkles, Shield, KeyRound, 
  Hash, Cpu, Type, Quote, Space, Sliders, CheckCircle2, AlertTriangle,
  Lock, Flame, Layers
} from 'lucide-react';
import { PasswordGeneratorOptions } from '../types';
import { copyToClipboardWithAutoClear } from '../services/cryptoService';

interface PasswordGeneratorProps {
  onSelect?: (password: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

type GeneratorMode = 'random' | 'passphrase' | 'pin';

// Curated Cryptographic Wordlist for Diceware Passphrases
const PASSPHRASE_WORDS = [
  'nexus', 'quantum', 'cipher', 'shadow', 'protocol', 'sentinel', 'phoenix', 
  'matrix', 'stealth', 'falcon', 'vortex', 'titan', 'plasma', 'glitch', 
  'cyber', 'aurora', 'signal', 'enigma', 'hyper', 'orbit', 'zenith', 
  'vector', 'chronos', 'pulsar', 'nebula', 'arcane', 'draco', 'solaris', 
  'binary', 'synapse', 'phantom', 'beacon', 'bastion', 'omega', 'relic', 
  'valkyrie', 'cobalt', 'obsidian', 'horizon', 'prism', 'specter', 'havoc', 
  'ironclad', 'hydra', 'apex', 'tempest', 'valiant', 'frost', 'abyss', 
  'sentient', 'cortex', 'echo', 'stellar', 'void', 'kinetic', 'radiant',
  'ghost', 'seraph', 'archon', 'krypton', 'cipher', 'daemon', 'entropy',
  'forge', 'mirage', 'neon', 'oracle', 'rogue', 'samurai', 'vanguard'
];

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSelect, onToast }) => {
  const [mode, setMode] = useState<GeneratorMode>('random');
  
  // Random Mode Options
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 20,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    useQuotes: true,           // ' " `
    useSpaces: true,           // Space ' '
    useExtendedSymbols: true,  // {} [] \ | ; : < > , . ? / ~
    excludeAmbiguous: false,   // 0 O o 1 l I |
    wordCount: 4,
    separator: ' '
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Character sets
  const charsets = useMemo(() => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let nums = '0123456789';
    let basicSyms = '!@#$%^&*()-_+=';
    let quotes = '\'"`';
    let spaces = ' ';
    let extSyms = '{}[]\\|;:<>.,?/~';

    if (options.excludeAmbiguous) {
      const ambiguous = /[0Oo1lI|]/g;
      upper = upper.replace(ambiguous, '');
      lower = lower.replace(ambiguous, '');
      nums = nums.replace(ambiguous, '');
      extSyms = extSyms.replace(ambiguous, '');
    }

    return { upper, lower, nums, basicSyms, quotes, spaces, extSyms };
  }, [options.excludeAmbiguous]);

  // NIST-style Entropy & Crack Time Calculator
  const stats = useMemo(() => {
    if (!generatedPassword) return { entropy: 0, crackTime: 'Instant', label: 'EMPTY', color: 'text-slate-500' };

    let poolSize = 0;
    if (mode === 'random') {
      if (options.useUppercase) poolSize += charsets.upper.length;
      if (options.useLowercase) poolSize += charsets.lower.length;
      if (options.useNumbers) poolSize += charsets.nums.length;
      if (options.useSymbols) poolSize += charsets.basicSyms.length;
      if (options.useQuotes) poolSize += charsets.quotes.length;
      if (options.useSpaces) poolSize += charsets.spaces.length;
      if (options.useExtendedSymbols) poolSize += charsets.extSyms.length;
    } else if (mode === 'passphrase') {
      poolSize = PASSPHRASE_WORDS.length;
    } else if (mode === 'pin') {
      poolSize = 10;
    }

    if (poolSize === 0) return { entropy: 0, crackTime: 'Instant', label: 'NONE', color: 'text-slate-500' };

    const entropy = mode === 'passphrase' 
      ? Math.round((options.wordCount || 4) * Math.log2(poolSize))
      : Math.round(generatedPassword.length * Math.log2(poolSize));

    let crackTime = '< 1 Second';
    let label = 'VULNERABLE';
    let color = 'text-rose-400 border-rose-500/30 bg-rose-500/10';

    if (entropy >= 128) {
      crackTime = '10+ Quadrillion Years (Quantum Resistant)';
      label = 'QUANTUM SECURE';
      color = 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-pulse';
    } else if (entropy >= 85) {
      crackTime = '8.5 Trillion Years';
      label = 'WARFARE GRADE';
      color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    } else if (entropy >= 60) {
      crackTime = '3,400 Years';
      label = 'HIGH DEFENSE';
      color = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    } else if (entropy >= 45) {
      crackTime = '4 Months';
      label = 'MODERATE';
      color = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    }

    // Counts
    const charCounts = {
      upper: (generatedPassword.match(/[A-Z]/g) || []).length,
      lower: (generatedPassword.match(/[a-z]/g) || []).length,
      num: (generatedPassword.match(/[0-9]/g) || []).length,
      quotes: (generatedPassword.match(/['"`]/g) || []).length,
      spaces: (generatedPassword.match(/ /g) || []).length,
      symbols: (generatedPassword.match(/[^A-Za-z0-9 '"`]/g) || []).length,
      total: generatedPassword.length
    };

    return { entropy, crackTime, label, color, charCounts };
  }, [generatedPassword, mode, options, charsets]);

  // Main Generator Routine
  const generate = useCallback(() => {
    let result = '';

    if (mode === 'pin') {
      const pinLength = Math.max(4, Math.min(16, options.length || 6));
      const rands = new Uint32Array(pinLength);
      window.crypto.getRandomValues(rands);
      for (let i = 0; i < pinLength; i++) {
        result += charsets.nums[rands[i] % charsets.nums.length];
      }
      setGeneratedPassword(result);
      setIsCopied(false);
      return;
    }

    if (mode === 'passphrase') {
      const count = options.wordCount || 4;
      const sep = options.separator !== undefined ? options.separator : ' ';
      const rands = new Uint32Array(count);
      window.crypto.getRandomValues(rands);

      const chosenWords: string[] = [];
      for (let i = 0; i < count; i++) {
        let w = PASSPHRASE_WORDS[rands[i] % PASSPHRASE_WORDS.length];
        if (options.useUppercase && i % 2 === 0) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        chosenWords.push(w);
      }

      if (options.useNumbers) {
        const numRand = new Uint32Array(1);
        window.crypto.getRandomValues(numRand);
        chosenWords.push((numRand[0] % 99).toString().padStart(2, '0'));
      }

      if (options.useQuotes) {
        chosenWords[0] = `'${chosenWords[0]}'`;
      }

      result = chosenWords.join(sep);
      setGeneratedPassword(result);
      setIsCopied(false);
      return;
    }

    // Mode: RANDOM (CSPRNG with Extended Matrix)
    let fullPool = '';
    const guaranteedPools: string[] = [];

    if (options.useUppercase && charsets.upper) {
      fullPool += charsets.upper;
      guaranteedPools.push(charsets.upper);
    }
    if (options.useLowercase && charsets.lower) {
      fullPool += charsets.lower;
      guaranteedPools.push(charsets.lower);
    }
    if (options.useNumbers && charsets.nums) {
      fullPool += charsets.nums;
      guaranteedPools.push(charsets.nums);
    }
    if (options.useSymbols && charsets.basicSyms) {
      fullPool += charsets.basicSyms;
      guaranteedPools.push(charsets.basicSyms);
    }
    if (options.useQuotes && charsets.quotes) {
      fullPool += charsets.quotes;
      guaranteedPools.push(charsets.quotes);
    }
    if (options.useSpaces && charsets.spaces) {
      fullPool += charsets.spaces;
      guaranteedPools.push(charsets.spaces);
    }
    if (options.useExtendedSymbols && charsets.extSyms) {
      fullPool += charsets.extSyms;
      guaranteedPools.push(charsets.extSyms);
    }

    if (!fullPool) {
      setGeneratedPassword('');
      return;
    }

    const targetLength = options.length || 20;
    const rands = new Uint32Array(targetLength);
    window.crypto.getRandomValues(rands);

    const chars: string[] = [];
    for (let i = 0; i < targetLength; i++) {
      chars.push(fullPool[rands[i] % fullPool.length]);
    }

    // Guarantee inclusion of at least one char from each enabled pool
    if (targetLength >= guaranteedPools.length) {
      const poolRands = new Uint32Array(guaranteedPools.length * 2);
      window.crypto.getRandomValues(poolRands);

      guaranteedPools.forEach((pool, idx) => {
        const replacePos = poolRands[idx * 2] % targetLength;
        const charPos = poolRands[idx * 2 + 1] % pool.length;
        chars[replacePos] = pool[charPos];
      });
    }

    result = chars.join('');
    setGeneratedPassword(result);
    setIsCopied(false);
  }, [mode, options, charsets]);

  useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    const success = await copyToClipboardWithAutoClear(generatedPassword, 30);
    if (success) {
      setIsCopied(true);
      if (onToast) onToast('Cipher copied to clipboard (auto-clears in 30s)', 'success');
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  // Syntax highlighting renderer for password characters
  const renderColoredPassword = (pwd: string) => {
    return pwd.split('').map((char, index) => {
      if (char === ' ') {
        return (
          <span 
            key={index} 
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono select-all shadow-[0_0_8px_rgba(6,182,212,0.3)]"
            title="Space Character"
          >
            ␣
          </span>
        );
      }
      if (char === "'" || char === '"' || char === '`') {
        return (
          <span 
            key={index} 
            className="text-amber-300 font-bold px-0.5 bg-amber-400/10 rounded border border-amber-400/20 inline-block hover:scale-125 transition-transform"
            title={`Quote (${char})`}
          >
            {char}
          </span>
        );
      }
      if (/[0-9]/.test(char)) {
        return (
          <span key={index} className="text-orange-400 font-semibold inline-block hover:scale-125 transition-transform">
            {char}
          </span>
        );
      }
      if (/[A-Z]/.test(char)) {
        return (
          <span key={index} className="text-cyan-300 font-semibold inline-block hover:scale-125 transition-transform">
            {char}
          </span>
        );
      }
      if (/[^A-Za-z0-9]/.test(char)) {
        return (
          <span key={index} className="text-pink-400 font-bold inline-block hover:scale-125 transition-transform">
            {char}
          </span>
        );
      }
      return (
        <span key={index} className="text-slate-200 inline-block hover:scale-125 transition-transform">
          {char}
        </span>
      );
    });
  };

  return (
    <div className="bg-slate-900/90 border border-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden font-mono select-none">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80 blur-sm pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-widest flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <KeyRound size={20} />
            </div>
            <span>KEY FORGE // CIPHER ENGINE</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">// CSPRNG MULTI-VECTOR CRYPTOGRAPHIC FORGE</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${stats.color}`}>
            {stats.label} ({stats.entropy} BITS)
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { id: 'random', label: 'Quantum Matrix', desc: 'Custom characters & symbols', icon: Cpu },
          { id: 'passphrase', label: 'Diceware Passphrase', desc: 'Memorable words with spaces', icon: Type },
          { id: 'pin', label: 'Numeric PIN', desc: '4-16 digit code', icon: Hash },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id as GeneratorMode)}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
              mode === m.id
                ? 'bg-indigo-600/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <m.icon size={16} className={mode === m.id ? 'text-cyan-400' : 'text-slate-500'} />
              {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>}
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide">{m.label}</div>
              <div className="text-[9px] text-slate-500 truncate mt-0.5">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Password Display Screen */}
      <div className="relative mb-6">
        <div className="bg-black/70 border border-white/10 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.25)] min-h-[110px] flex flex-col justify-center items-center">
          {/* Subtle Grid Lines Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          <div className="text-lg sm:text-xl md:text-2xl break-all tracking-wider relative z-10 selection:bg-cyan-500/40 select-all leading-relaxed max-w-full">
            {generatedPassword ? renderColoredPassword(generatedPassword) : <span className="text-slate-600">Select character sets</span>}
          </div>

          {/* Entropy Gauge Line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                stats.entropy >= 120 ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : 
                stats.entropy >= 80 ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 
                stats.entropy >= 50 ? 'bg-cyan-500 shadow-[0_0_12px_#06b6d4]' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (stats.entropy / 128) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Action Floating Buttons */}
        <div className="absolute right-3 top-3 flex gap-2 z-20">
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 border border-white/10 flex items-center justify-center group"
            title="Copy to Clipboard"
          >
            {isCopied ? <Check size={16} className="text-white" /> : <Copy size={16} className="group-hover:scale-110 transition-transform" />}
          </button>
          <button
            type="button"
            onClick={generate}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl shadow-lg transition-all active:scale-95 border border-white/10 group"
            title="Regenerate"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Real-time Character Breakdown Badges */}
      {stats.charCounts && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6 text-[10px] text-center">
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-slate-500 block">LENGTH</span>
            <span className="text-white font-bold">{stats.charCounts.total}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-cyan-400 block">UPPER</span>
            <span className="text-white font-bold">{stats.charCounts.upper}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-orange-400 block">NUMBERS</span>
            <span className="text-white font-bold">{stats.charCounts.num}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-pink-400 block">SYMBOLS</span>
            <span className="text-white font-bold">{stats.charCounts.symbols}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-amber-400 block">QUOTES</span>
            <span className="text-white font-bold">{stats.charCounts.quotes}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-2 rounded-xl">
            <span className="text-cyan-300 block">SPACES</span>
            <span className="text-white font-bold">{stats.charCounts.spaces}</span>
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className="space-y-6 bg-white/[0.02] rounded-2xl p-6 border border-white/5">
        
        {/* Sliders (Length or Word Count) */}
        {mode === 'random' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 font-bold text-xs flex items-center gap-2">
                <Settings2 size={14} className="text-cyan-400" /> TOTAL CIPHER LENGTH
              </label>
              <span className="text-lg text-cyan-400 font-bold bg-cyan-500/10 px-3 py-0.5 rounded-lg border border-cyan-500/20">
                {options.length} CHARACTERS
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) => setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        )}

        {mode === 'passphrase' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 font-bold text-xs flex items-center gap-2">
                <Type size={14} className="text-cyan-400" /> PASSPHRASE WORD COUNT
              </label>
              <span className="text-lg text-cyan-400 font-bold bg-cyan-500/10 px-3 py-0.5 rounded-lg border border-cyan-500/20">
                {options.wordCount || 4} WORDS
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="8"
              value={options.wordCount || 4}
              onChange={(e) => setOptions((prev) => ({ ...prev, wordCount: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-2 font-bold">Word Separator</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: ' ', label: '␣ Space', name: 'Space' },
                  { id: '-', label: 'Hyphen (-)', name: 'Dash' },
                  { id: '_', label: 'Underscore (_)', name: 'Under' },
                  { id: '.', label: 'Dot (.)', name: 'Period' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, separator: s.id }))}
                    className={`p-2 rounded-xl border text-xs text-center transition-all ${
                      options.separator === s.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'pin' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 font-bold text-xs flex items-center gap-2">
                <Hash size={14} className="text-cyan-400" /> PIN CODE DIGITS
              </label>
              <span className="text-lg text-cyan-400 font-bold bg-cyan-500/10 px-3 py-0.5 rounded-lg border border-cyan-500/20">
                {options.length} DIGITS
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              value={options.length}
              onChange={(e) => setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        )}

        {/* Character Matrix Toggles for Random Mode */}
        {mode === 'random' && (
          <div>
            <label className="text-slate-400 font-bold text-xs block mb-3">CHARACTER VECTOR MATRIX</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'useUppercase', label: 'A-Z', name: 'Uppercase', desc: 'ABC...' },
                { key: 'useLowercase', label: 'a-z', name: 'Lowercase', desc: 'abc...' },
                { key: 'useNumbers', label: '0-9', name: 'Numbers', desc: '123...' },
                { key: 'useSymbols', label: '!@#', name: 'Basic Symbols', desc: '!@#$%...' },
                { key: 'useQuotes', label: '\' " `', name: 'Quotes & Backticks', desc: 'Single/Double' },
                { key: 'useSpaces', label: '␣ Space', name: 'Include Spaces', desc: 'Whitespace' },
                { key: 'useExtendedSymbols', label: '{ } [ ] \\', name: 'Complex Symbols', desc: 'Brackets, Slashes' },
                { key: 'excludeAmbiguous', label: 'Ø Filter', name: 'Avoid Ambiguous', desc: 'No 0/O, 1/l/I' },
              ].map((opt) => {
                const isChecked = options[opt.key as keyof PasswordGeneratorOptions] as boolean;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setOptions((prev) => ({
                        ...prev,
                        [opt.key]: !isChecked,
                      }));
                    }}
                    className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-200 flex flex-col items-start justify-between gap-1 text-left ${
                      isChecked
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]'
                        : 'bg-black/30 border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-xs font-bold ${isChecked ? 'text-cyan-300' : 'text-slate-600'}`}>
                        {opt.label}
                      </span>
                      {isChecked && (
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(6,182,212,1)] animate-pulse"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-200">{opt.name}</div>
                      <div className="text-[8px] text-slate-500">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          type="button"
          onClick={generate}
          className="w-full bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xl shadow-cyan-900/20 active:scale-[0.99] border border-white/10 flex items-center justify-center gap-2 tracking-widest text-xs font-mono"
        >
          <Zap size={16} className={isCopied ? 'text-emerald-300' : 'text-amber-300'} fill="currentColor" />
          FORGE NEW CIPHER
        </button>
      </div>

      {onSelect && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onSelect(generatedPassword)}
            className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-transparent hover:border-emerald-400 pb-0.5"
          >
            <Check size={14} /> INSERT CIPHER INTO FORM
          </button>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;