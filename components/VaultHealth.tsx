import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, Repeat } from 'lucide-react';
import { VaultItem } from '../types';

interface VaultHealthProps {
  items: VaultItem[];
}

const VaultHealth: React.FC<VaultHealthProps> = ({ items }) => {
  const stats = useMemo(() => {
    let weakCount = 0;
    let reusedCount = 0;
    let totalScore = 0;
    const passwordMap = new Map<string, number>();

    const logins = items.filter(i => i.category === 'Login' || i.category === 'Card');

    logins.forEach(item => {
      const pwd = item.password || '';
      
      // Calculate Strength
      let score = 0;
      if (pwd.length > 8) score += 1;
      if (pwd.length > 12) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
      
      if (score < 3) weakCount++;
      totalScore += score;

      // Track Reuse
      if (pwd.length > 0) {
          passwordMap.set(pwd, (passwordMap.get(pwd) || 0) + 1);
      }
    });

    passwordMap.forEach((count) => {
        if (count > 1) reusedCount += count;
    });

    const averageScore = logins.length > 0 ? (totalScore / (logins.length * 5)) * 100 : 100;

    return { weakCount, reusedCount, averageScore: Math.round(averageScore), total: logins.length };
  }, [items]);

  const getHealthColor = (score: number) => {
      if (score >= 90) return 'text-emerald-400';
      if (score >= 70) return 'text-blue-400';
      if (score >= 50) return 'text-amber-400';
      return 'text-rose-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up">
        {/* Overall Score */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${stats.averageScore >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Vault Health</p>
                <h3 className={`text-3xl font-bold ${getHealthColor(stats.averageScore)}`}>{stats.averageScore}%</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${stats.averageScore >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {stats.averageScore >= 70 ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
        </div>

        {/* Weak Passwords */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
             <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500 opacity-10 transition-transform group-hover:scale-150"></div>
            <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Weak Items</p>
                <h3 className="text-3xl font-bold text-amber-400">{stats.weakCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-white/5 flex items-center justify-center text-amber-400">
                <AlertTriangle size={24} />
            </div>
        </div>

        {/* Reused Passwords */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary opacity-10 transition-transform group-hover:scale-150"></div>
            <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Reused</p>
                <h3 className="text-3xl font-bold text-primary">{stats.reusedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-white/5 flex items-center justify-center text-primary">
                <Repeat size={24} />
            </div>
        </div>
        
        {stats.weakCount === 0 && stats.reusedCount === 0 && stats.total > 0 && (
            <div className="col-span-1 md:col-span-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-400" />
                <span className="text-emerald-200 text-sm">Excellent work! Your vault is highly secure. No weak or reused passwords detected.</span>
            </div>
        )}
         {stats.total === 0 && (
            <div className="col-span-1 md:col-span-3 bg-surfaceLight/50 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <span className="text-slate-400 text-sm">Add items to your vault to see security analysis.</span>
            </div>
        )}
    </div>
  );
};

export default VaultHealth;