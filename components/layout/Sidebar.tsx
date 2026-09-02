import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, Shield, KeyRound, Settings, LogOut 
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'security' | 'generator' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'security' | 'generator' | 'settings') => void;
  userProfile: UserProfile;
  onLogout: () => void;
  onNavigateTab: (tab: 'dashboard' | 'security' | 'generator' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  userProfile,
  onLogout,
  onNavigateTab
}) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'security', icon: Shield, label: 'Sentinel AI' },
    { id: 'generator', icon: KeyRound, label: 'Key Forge' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <aside className="w-18 lg:w-64 border-r border-white/5 flex flex-col z-20 bg-black/40 backdrop-blur-md shrink-0 select-none">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
          <ShieldCheck className="text-white" size={20} />
        </div>
        <div className="hidden lg:block min-w-0 font-mono">
          <h1 className="font-bold text-sm text-white tracking-widest">PASSVAULT</h1>
          <span className="text-[9px] text-cyan-400 tracking-wider">// SECURE VAULT</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 font-mono">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigateTab(tab.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group active:scale-95 ${
              activeTab === tab.id 
                ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/40 shadow-lg shadow-indigo-500/10' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'} />
            <span className="hidden lg:block text-xs tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/30 font-mono">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {userProfile.customAvatar ? (
              <img src={userProfile.customAvatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full animate-pulse"></div>
          </div>
          <div className="hidden lg:block min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{userProfile.displayName}</p>
            <p className="text-[9px] text-emerald-400">ENCRYPTED</p>
          </div>
          <button 
            type="button"
            onClick={onLogout} 
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Lock Vault"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
