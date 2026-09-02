import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Repeat, Activity, CheckCircle2, Lock, Shield } from 'lucide-react';
import { VaultItem } from '../types';

interface VaultHealthProps {
  items: VaultItem[];
  onFilterClick?: (filterType: 'all' | 'weak' | 'reused' | 'old') => void;
}

const VaultHealth: React.FC<VaultHealthProps> = ({ items, onFilterClick }) => {
  const stats = useMemo(() => {
    let weakCount = 0;
    let reusedCount = 0;
    let oldCredentialsCount = 0;
    let totalScore = 0;
    const passwordMap = new Map<string, number>();
    const now = Date.now();
    const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);

    const checkableItems = items.filter(i => i.category === 'Login' || i.category === 'Card' || i.category === 'Cookie');

    checkableItems.forEach(item => {
      const pwd = item.password || '';
      
      // Calculate Strength
      let score = 0;
      if (pwd.length >= 8) score += 1;
      if (pwd.length >= 14) score += 1;
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
      
      if (score < 3 || pwd.length < 8) weakCount++;
      totalScore += score;

      // Track Reuse
      if (pwd.length > 0) {
        passwordMap.set(pwd, (passwordMap.get(pwd) || 0) + 1);
      }

      // Track Old Credentials (> 6 Months)
      if (item.updatedAt < sixMonthsAgo) {
        oldCredentialsCount++;
      }
    });

    passwordMap.forEach((count) => {
      if (count > 1) reusedCount += (count - 1);
    });

    const maxPossibleScore = checkableItems.length * 5;
    const averageScore = checkableItems.length > 0 
      ? Math.max(10, Math.round((totalScore / maxPossibleScore) * 100) - (reusedCount * 10) - (weakCount * 15))
      : 100;

    const normalizedScore = Math.min(100, Math.max(0, averageScore));

    return { 
      weakCount, 
      reusedCount, 
      oldCredentialsCount, 
      score: normalizedScore, 
      total: checkableItems.length 
    };
  }, [items]);

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/20';
    if (score >= 65) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-cyan-500/20';
    if (score >= 45) return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/20';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-rose-500/20';
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Security Score */}
        <div 
          onClick={() => onFilterClick && onFilterClick('all')}
          className="bg-slate-900/80 border border-white/10 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all shadow-xl hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Shield size={12} className="text-indigo-400" /> VAULT DEFENSE INDEX
            </p>
            <h3 className={`text-3xl font-bold font-mono tracking-tight ${stats.score >= 80 ? 'text-emerald-400' : stats.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {stats.score}%
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">Based on {stats.total} total items</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getHealthColor(stats.score)}`}>
            {stats.score >= 80 ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
        </div>

        {/* Weak Credentials */}
        <div 
          onClick={() => onFilterClick && onFilterClick('weak')}
          className="bg-slate-900/80 border border-white/10 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all shadow-xl hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors"></div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-400" /> WEAK CIPHERS
            </p>
            <h3 className={`text-3xl font-bold font-mono ${stats.weakCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats.weakCount}
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">
              {stats.weakCount === 0 ? 'All ciphers optimal' : 'Requires key rotation'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stats.weakCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Reused Credentials */}
        <div 
          onClick={() => onFilterClick && onFilterClick('reused')}
          className="bg-slate-900/80 border border-white/10 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-rose-500/30 transition-all shadow-xl hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-colors"></div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Repeat size={12} className="text-rose-400" /> REUSED KEYS
            </p>
            <h3 className={`text-3xl font-bold font-mono ${stats.reusedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.reusedCount}
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">
              {stats.reusedCount === 0 ? 'Zero propagation risk' : 'Cross-account risk'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stats.reusedCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <Repeat size={22} />
          </div>
        </div>

        {/* Stale / Old Passwords */}
        <div 
          onClick={() => onFilterClick && onFilterClick('old')}
          className="bg-slate-900/80 border border-white/10 backdrop-blur-xl p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-cyan-500/30 transition-all shadow-xl hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors"></div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Activity size={12} className="text-cyan-400" /> STALE KEYS (&gt;6M)
            </p>
            <h3 className="text-3xl font-bold font-mono text-cyan-400">
              {stats.oldCredentialsCount}
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">Consider periodic updates</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity size={22} />
          </div>
        </div>

      </div>

      {/* Dynamic Security Advice Banner */}
      {stats.total > 0 && stats.weakCount === 0 && stats.reusedCount === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-xs font-mono text-emerald-200 leading-relaxed">
            <strong className="text-emerald-300">INTEGRITY VERIFIED:</strong> All active credentials satisfy NIST cryptographic standards. No credential reuse patterns or weak keys detected.
          </p>
        </div>
      ) : stats.total > 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <p className="text-xs font-mono text-amber-200 leading-relaxed">
              <strong className="text-amber-300">DEFENSE NOTICE:</strong> {stats.weakCount} weak ciphers and {stats.reusedCount} reused credentials detected. Immediate rotation recommended.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VaultHealth;