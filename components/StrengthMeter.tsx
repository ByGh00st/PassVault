import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface StrengthMeterProps {
  password?: string;
}

const StrengthMeter: React.FC<StrengthMeterProps> = ({ password = '' }) => {
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 14) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return Math.min(score, 5); // Max 5
  }, [password]);

  const getColor = (s: number) => {
    switch(s) {
      case 0: return 'bg-slate-800';
      case 1: return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
      case 2: return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
      case 3: return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
      case 4: return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
      case 5: return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      default: return 'bg-slate-800';
    }
  };

  const getLabel = (s: number) => {
    switch(s) {
      case 0: return { text: 'NO CIPHER', color: 'text-slate-600' };
      case 1: return { text: 'COMPROMISED (CRITICAL)', color: 'text-rose-400' };
      case 2: return { text: 'VULNERABLE', color: 'text-orange-400' };
      case 3: return { text: 'MODERATE DEFENSE', color: 'text-amber-400' };
      case 4: return { text: 'STRONG CIPHER', color: 'text-blue-400' };
      case 5: return { text: 'QUANTUM-FORTIFIED', color: 'text-emerald-400' };
      default: return { text: '', color: 'text-slate-600' };
    }
  };

  const current = getLabel(strength);

  return (
    <div className="w-full mt-2 space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-slate-500 flex items-center gap-1">
          <Shield size={10} /> ENTROPY STATUS
        </span>
        <span className={`font-bold ${current.color}`}>{current.text}</span>
      </div>
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-all duration-300 ${
              strength >= level ? getColor(strength) : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StrengthMeter;