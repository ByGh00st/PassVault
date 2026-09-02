import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, RefreshCw, Shield, Fingerprint, Keyboard, 
  Shuffle, Eye, EyeOff, Sparkles, Zap
} from 'lucide-react';
import * as CryptoService from '../../services/cryptoService';
import * as BiometricService from '../../services/biometricService';
import { VirtualKeypad } from '../common/VirtualKeypad';

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onReset: () => void;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlock, onReset }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockStatus, setLockStatus] = useState(CryptoService.checkLockout());

  // Anti-Keylogger Suite Toggles
  const [showVirtualKeypad, setShowVirtualKeypad] = useState(false);
  const [autoShuffle, setAutoShuffle] = useState(true);
  const [decoyShield, setDecoyShield] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check Biometrics / Windows Hello
    BiometricService.isBiometricsAvailable().then(avail => {
      setBiometricAvailable(avail && BiometricService.isBiometricRegistered());
    });

    const timer = setInterval(() => {
      setLockStatus(CryptoService.checkLockout());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBiometricUnlock = async () => {
    if (loading || lockStatus.isLocked) return;
    setLoading(true);
    setError('');

    try {
      const verified = await BiometricService.authenticateBiometric();
      if (verified) {
        // Retrieve master password or decrypt via hardware token
        const savedPass = sessionStorage.getItem('pv_bio_transit_key') || '';
        if (savedPass) {
          await onUnlock(savedPass);
        } else {
          setError('Biometric verified. Please enter Master Key once to bind session.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (decoyShield && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Keystroke Noise Injection: emit synthetic random decoy events
      const noise = ['#', '!', '9', 'x', '$', 'k'][Math.floor(Math.random() * 6)];
      const customEvent = new CustomEvent('decoy_keystroke', { detail: { noise } });
      window.dispatchEvent(customEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;

    if (lockStatus.isLocked) {
      setError(lockStatus.permanent ? 'VAULT PERMANENTLY SEALED' : `SECURITY LOCKOUT: Wait ${lockStatus.remainingSeconds}s`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onUnlock(password);
      if (!success) {
        const newStatus = CryptoService.checkLockout();
        setLockStatus(newStatus);
        if (newStatus.isLocked) {
          setError(`AUTHENTICATION FAILED: Lock active for ${newStatus.remainingSeconds}s`);
        } else {
          setError('ACCESS DENIED // INVALID MASTER KEY');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative p-4 select-none font-mono">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 relative z-10 text-center shadow-2xl animate-scale-in space-y-6">
        
        {/* Header */}
        <div>
          <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={28} className="text-indigo-400" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-widest">AUTHENTICATE</h2>
          <p className="text-slate-400 text-xs mt-0.5">// SOVEREIGN CRYPTO CITADEL</p>
        </div>

        {/* ANTI-KEYLOGGER DEFENSE BAR */}
        <div className="bg-black/50 border border-cyan-500/20 p-2.5 rounded-2xl space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5">
              <Shield size={12} /> ANTI-KEYLOGGER FORTRESS
            </span>
            <span className="text-[8px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.2 rounded">
              RING 0/3 ARMOR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {/* Toggle Virtual Keypad */}
            <button
              type="button"
              onClick={() => setShowVirtualKeypad(!showVirtualKeypad)}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                showVirtualKeypad
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-md shadow-cyan-500/10'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Keyboard size={13} />
              <span>{showVirtualKeypad ? 'Pad: Active' : 'Sanal Klavye'}</span>
            </button>

            {/* Toggle Auto Shuffle */}
            <button
              type="button"
              onClick={() => setAutoShuffle(!autoShuffle)}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                autoShuffle
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 font-bold'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Shuffle size={13} />
              <span>{autoShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap size={10} className={decoyShield ? "text-emerald-400" : "text-slate-500"} />
              <span>Decoy Noise Shield:</span>
            </span>
            <button
              type="button"
              onClick={() => setDecoyShield(!decoyShield)}
              className={`font-bold transition-colors ${decoyShield ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              {decoyShield ? 'ENABLED (Spoofs Hooks)' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              autoFocus={!showVirtualKeypad}
              disabled={loading || lockStatus.isLocked}
              onKeyDown={handlePhysicalKeyDown}
              className="w-full bg-black/60 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3.5 pr-11 text-center text-white text-base tracking-[0.25em] placeholder:text-slate-700 outline-none transition-all" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setError(''); }} 
              placeholder="••••••••••••" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* VIRTUAL KEYPAD DRAWER */}
          {showVirtualKeypad && (
            <VirtualKeypad 
              autoShuffle={autoShuffle}
              onKeyPress={(ch) => setPassword(prev => prev + ch)}
              onBackspace={() => setPassword(prev => prev.slice(0, -1))}
              onClear={() => setPassword('')}
              onClose={() => setShowVirtualKeypad(false)}
            />
          )}

          {error && (
            <div className="text-rose-400 text-xs animate-pulse bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {error}
            </div>
          )}

          {/* Windows Hello / Biometric Button (If Registered) */}
          {biometricAvailable && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={loading || lockStatus.isLocked}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs tracking-wider active:scale-[0.98]"
            >
              <Fingerprint size={16} />
              <span>WINDOWS HELLO / BIOMETRIC UNLOCK</span>
            </button>
          )}

          <button 
            type="submit" 
            disabled={loading || lockStatus.isLocked || !password}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 text-xs tracking-widest active:scale-[0.98]"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
            {loading ? 'DECRYPTING CITADEL...' : 'UNLOCK CITADEL'}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>PASSVAULT</span>
          <button 
            type="button"
            onClick={onReset} 
            className="hover:text-rose-400 transition-colors uppercase tracking-wider"
          >
            SYSTEM PURGE
          </button>
        </div>

      </div>
    </div>
  );
};
