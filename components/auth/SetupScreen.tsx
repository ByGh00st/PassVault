import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertTriangle, AlertCircle, Keyboard, Shuffle, Shield } from 'lucide-react';
import StrengthMeter from '../StrengthMeter';
import { VirtualKeypad } from '../common/VirtualKeypad';

interface SetupScreenProps {
  onSetup: (password: string, panic?: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetup }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [panicPassword, setPanicPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Anti-Keylogger Virtual Keypad
  const [showVirtualKeypad, setShowVirtualKeypad] = useState(false);
  const [activeInput, setActiveInput] = useState<'password' | 'confirm' | 'panic'>('password');
  const [autoShuffle, setAutoShuffle] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { 
      setError('Master Key must contain at least 8 characters.'); 
      return; 
    }
    if (password !== confirm) { 
      setError('Password confirmation mismatch.'); 
      return; 
    }
    if (panicPassword && panicPassword === password) { 
      setError('Panic Reset Code cannot match Master Key.'); 
      return; 
    }
    onSetup(password, panicPassword);
  };

  const handleKeypadPress = (ch: string) => {
    if (activeInput === 'password') setPassword(prev => prev + ch);
    else if (activeInput === 'confirm') setConfirm(prev => prev + ch);
    else if (activeInput === 'panic') setPanicPassword(prev => prev + ch);
  };

  const handleKeypadBackspace = () => {
    if (activeInput === 'password') setPassword(prev => prev.slice(0, -1));
    else if (activeInput === 'confirm') setConfirm(prev => prev.slice(0, -1));
    else if (activeInput === 'panic') setPanicPassword(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    if (activeInput === 'password') setPassword('');
    else if (activeInput === 'confirm') setConfirm('');
    else if (activeInput === 'panic') setPanicPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4 select-none font-mono">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl animate-scale-in space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20 border border-white/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-widest">PASSVAULT SETUP</h1>
          <p className="text-slate-400 text-xs mt-1">// ZERO-KNOWLEDGE MASTER CIPHER INITIALIZATION</p>
        </div>

        {/* ANTI-KEYLOGGER CONTROL BAR */}
        <div className="bg-black/50 border border-cyan-500/20 p-2.5 rounded-2xl flex items-center justify-between text-[10px]">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Shield size={12} /> ANTI-KEYLOGGER
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoShuffle(!autoShuffle)}
              className={`px-2 py-1 rounded-lg border transition-all ${
                autoShuffle ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500' : 'bg-white/5 text-slate-400 border-white/5'
              }`}
            >
              Shuffle: {autoShuffle ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => setShowVirtualKeypad(!showVirtualKeypad)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold transition-all ${
                showVirtualKeypad ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500' : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Keyboard size={12} />
              <span>{showVirtualKeypad ? 'Pad: Open' : 'Sanal Pad'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Master Decryption Key</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  onFocus={() => setActiveInput('password')}
                  className={`w-full bg-black/50 border rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm ${
                    activeInput === 'password' && showVirtualKeypad ? 'border-cyan-500 ring-1 ring-cyan-500/30' : 'border-white/10 focus:border-indigo-500'
                  }`}
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                  placeholder="Enter master password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Confirm Master Key</label>
              <input 
                type={showPassword ? "text" : "password"} 
                onFocus={() => setActiveInput('confirm')}
                className={`w-full bg-black/50 border rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-700 text-sm ${
                  activeInput === 'confirm' && showVirtualKeypad ? 'border-cyan-500 ring-1 ring-cyan-500/30' : 'border-white/10 focus:border-indigo-500'
                }`}
                value={confirm} 
                onChange={(e) => { setConfirm(e.target.value); setError(''); }} 
                placeholder="Confirm master password" 
              />
            </div>

            <StrengthMeter password={password} />
          </div>

          {/* VIRTUAL KEYPAD DRAWER */}
          {showVirtualKeypad && (
            <VirtualKeypad 
              autoShuffle={autoShuffle}
              onKeyPress={handleKeypadPress}
              onBackspace={handleKeypadBackspace}
              onClear={handleKeypadClear}
              onClose={() => setShowVirtualKeypad(false)}
            />
          )}

          <div className="pt-2 border-t border-white/5">
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 space-y-2">
              <label className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} /> PANIC PURGE CODE (OPTIONAL)
              </label>
              <input 
                type="password" 
                onFocus={() => setActiveInput('panic')}
                className={`w-full bg-black/50 border rounded-lg px-3.5 py-2.5 text-rose-100 text-xs outline-none placeholder:text-rose-500/40 ${
                  activeInput === 'panic' && showVirtualKeypad ? 'border-cyan-500' : 'border-rose-500/30 focus:border-rose-500'
                }`}
                value={panicPassword} 
                onChange={(e) => setPanicPassword(e.target.value)} 
                placeholder="Duress wipe passphrase" 
              />
              <p className="text-[10px] text-slate-500">Entering this code at unlock permanently destroys all stored credentials.</p>
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2 animate-shake">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/25 active:scale-[0.98] text-xs tracking-widest mt-2"
          >
            INITIALIZE ENCRYPTED VAULT
          </button>
        </form>
      </div>
    </div>
  );
};
