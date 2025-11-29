import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lock, Unlock, Plus, Search, LogOut, Copy, Eye, EyeOff, Trash2, Key, ShieldCheck, Monitor, CreditCard, StickyNote, ClipboardCopy, Sparkles, RefreshCw, Settings, User, Check, Shield, AlertTriangle, ChevronRight, Edit3, LayoutDashboard, Download, UploadCloud, AlertCircle, Cookie, FolderOpen, ArrowLeft, Palette, Image as ImageIcon, Trash, Wifi, Cpu, Calendar, CreditCard as CardIcon, X, HardDrive, Timer, Sliders, Layers, Terminal, Camera, FolderPlus, Zap, Clock, History, Filter, Globe, Youtube, Chrome, Github, ShoppingBag, Twitter, Facebook, Instagram, Linkedin, Mail, FileText } from 'lucide-react';
import { VaultItem, AppState, EncryptedVault, HistoryEntry, UserProfile, ThemeConfig } from './types';
import * as CryptoService from './services/cryptoService';
import PasswordGenerator from './components/PasswordGenerator';
import SecurityAssistant from './components/SecurityAssistant';
import StrengthMeter from './components/StrengthMeter';
import VaultHealth from './components/VaultHealth';

// --- Constants ---
const STORAGE_KEY = 'passvault_data';
const SETTINGS_KEY = 'passvault_settings';
const PROFILE_KEY = 'passvault_profile';
const FOLDERS_KEY = 'passvault_folders';
const SYS_RECOVERY_HASH = 'pv_sys_recovery_v1'; 

// Service Presets for Quick Add
const SERVICE_PRESETS = [
    { id: 'google', name: 'Google', url: 'https://google.com', icon: Chrome, color: '#DB4437' },
    { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: Youtube, color: '#FF0000' },
    { id: 'github', name: 'GitHub', url: 'https://github.com', icon: Github, color: '#ffffff' },
    { id: 'amazon', name: 'Amazon', url: 'https://amazon.com', icon: ShoppingBag, color: '#FF9900' },
    { id: 'twitter', name: 'X / Twitter', url: 'https://twitter.com', icon: Twitter, color: '#1DA1F2' },
    { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', icon: Facebook, color: '#4267B2' },
    { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', icon: Instagram, color: '#E1306C' },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', icon: Linkedin, color: '#0077b5' },
    { id: 'gmail', name: 'Gmail', url: 'https://gmail.com', icon: Mail, color: '#D44638' },
];

// Default Folders
const DEFAULT_FOLDERS = ['Personal', 'Work', 'Finance', 'Social', 'Dev', 'Other'];

const DEFAULT_THEME_CONFIG: ThemeConfig = {
    cardColor: '#1e293b',
    chatColor: '#6366f1',
    bgOpacity: 0.9,
    glowIntensity: 10,
    blurAmount: 5
};

// --- Helper Functions ---
const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
        return parts.join(' ');
    } else {
        return v;
    }
};

const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
        return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
};

const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'min', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
};

// Safe URL Hostname Extractor to prevent crashes
const getSafeHostname = (url: string) => {
    try {
        if (!url) return '';
        // If it doesn't start with http, assume https for parsing
        const urlToCheck = url.startsWith('http') ? url : `https://${url}`;
        return new URL(urlToCheck).hostname;
    } catch (e) {
        // If URL parsing completely fails, return the original string truncated
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
    }
};

// 3D FLIP CARD COMPONENT (Interaction Updated: Note opens modal, others flip)
const VaultCard = ({ item, themeConfig, onEdit, onDelete, onCopy, onView }: { item: VaultItem, themeConfig: ThemeConfig, onEdit: (i: VaultItem) => void, onDelete: (id: string) => void, onCopy: (txt: string) => void, onView: (i: VaultItem) => void }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const isCard = item.category === 'Card';

    // Owner-based Styling Logic
    let borderColor = 'border-white/10';
    let shadowColor = 'shadow-black/50';
    let neonClass = '';
    
    // Performance: Use simple linear gradients
    let cardBgGradient = `linear-gradient(145deg, ${themeConfig.cardColor}, #020617)`; 

    if (isCard) {
        borderColor = 'border-purple-500/30';
        neonClass = 'text-purple-400';
    } else if (item.category === 'Note') {
        borderColor = 'border-yellow-500/30';
        shadowColor = 'shadow-yellow-500/20';
        neonClass = 'text-yellow-400';
        cardBgGradient = `linear-gradient(145deg, #2a1b06, #0f0a00)`; 
    } else if (item.category === 'Login') {
        borderColor = 'border-cyan-500/30';
        neonClass = 'text-cyan-400';
    } else if (item.category === 'Cookie') {
        borderColor = 'border-orange-500/30';
        neonClass = 'text-orange-400';
    }

    const cardStyle = {
        boxShadow: `0 4px 15px -3px ${shadowColor.replace('shadow-', '').replace('/50', '/20')}`,
        borderColor: borderColor.replace('border-', '')
    };

    // Age Calculation for UI Warning
    const ageInDays = (Date.now() - item.updatedAt) / (1000 * 60 * 60 * 24);
    let ageColor = 'text-slate-500';
    if (ageInDays > 365) ageColor = 'text-rose-400';

    return (
        // Outer Wrapper
        <div 
            className="h-56 w-full cursor-pointer transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] perspective-1000"
            onClick={() => {
                if (item.category === 'Note') {
                    onView(item); // Open Modal for Notes
                } else {
                    setIsFlipped(!isFlipped); // Flip for others
                }
            }}
        >
            {/* Rotating Inner Container */}
            <div className={`relative w-full h-full transition-transform duration-300 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* --- FRONT FACE --- */}
                <div 
                    className="absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col justify-between border overflow-hidden bg-slate-900"
                    style={{ ...cardStyle, background: cardBgGradient }}
                >
                        {/* Edit/Delete Overlay (Front) - Stop propagation */}
                        <div className="absolute top-4 right-4 flex gap-2 z-50">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                            className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors" 
                            title="Edit"
                        >
                            <Edit3 size={14} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                            className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-rose-500/80 text-white/80 hover:text-white transition-colors" 
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* HEADER */}
                    <div className="flex justify-between items-start relative z-10">
                        {isCard ? (
                                <div className="flex items-center gap-3">
                                <Cpu size={36} className={`${neonClass || 'text-white/80'} opacity-90`} strokeWidth={1.5} />
                                <Wifi size={24} className="text-white/30 rotate-90" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2.5 rounded-xl bg-black/20 border border-white/10 ${neonClass}`}>
                                    {item.category === 'Login' && <Monitor size={22} />}
                                    {item.category === 'Note' && <StickyNote size={22} />}
                                    {item.category === 'Cookie' && <Cookie size={22} />}
                                </div>
                                <div>
                                    <span className={`text-[10px] font-bold tracking-widest block leading-none mb-1 opacity-70 ${neonClass}`}>{item.category.toUpperCase()}</span>
                                    <div className="h-1 w-8 bg-white/20 rounded-full"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MIDDLE CONTENT - Vertically Centered */}
                    <div className="relative z-10 pl-1 mt-auto mb-auto">
                        {isCard ? (
                                <p className="font-ocr text-xl md:text-2xl text-white tracking-[0.15em] select-text mt-4" onClick={(e) => e.stopPropagation()}>
                                {item.username || '0000 0000 0000 0000'}
                                </p>
                        ) : (
                            <div className="space-y-2 pr-12">
                                <h3 className={`text-2xl font-bold tracking-tight leading-none truncate ${item.category === 'Note' ? 'text-yellow-200' : 'text-white'}`} title={item.name}>
                                    {item.name}
                                </h3>
                                <p className="text-sm text-slate-400 font-mono truncate max-w-full">
                                    {item.category === 'Note' ? 'Secure Note' : (item.username || 'No Username')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="relative z-10">
                        {isCard ? (
                                <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] text-white/60 uppercase tracking-widest mb-0.5 ml-1">Card Holder</p>
                                    <p className="font-ocr text-sm text-white uppercase tracking-wider truncate max-w-[150px]">{item.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] text-white/60 uppercase tracking-widest mb-0.5">Expires</p>
                                    <p className="font-ocr text-sm text-white">{item.website || 'MM/YY'}</p>
                                </div>
                            </div>
                        ) : (
                                <div className="w-full pt-4 border-t border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    {item.category === 'Note' ? <FileText size={10} /> : <Globe size={10} />}
                                    <span className="text-[10px] font-mono truncate max-w-[120px]">
                                        {item.category === 'Note' ? 'Encrypted Content' : (item.website ? getSafeHostname(item.website) : 'local-vault')}
                                    </span>
                                </div>
                                {item.category !== 'Note' && (
                                        <div className={`text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 ${item.password ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {item.password ? '●●●●●●●●' : 'NO PASS'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- BACK FACE (Only accessible for Non-Notes via Flip) --- */}
                <div 
                    className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border flex flex-col bg-slate-900 overflow-hidden`}
                    style={{ ...cardStyle, borderColor: borderColor.replace('border-', '') }}
                >
                    {/* Back Header */}
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            DECRYPTED DATA
                        </span>
                        <div className="flex gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                                title="Full Edit"
                            >
                                <Edit3 size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }} 
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                                title="Close"
                            >
                                <X size={12}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col justify-center gap-3 overflow-hidden">
                        {/* LOGIN & CARD VIEW */}
                        <div className="space-y-4">
                            {/* Username / Card Number Row */}
                            <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                    {isCard ? <CreditCard size={10}/> : <User size={10}/>} 
                                    {isCard ? 'Card Number' : (item.category === 'Cookie' ? 'Key' : 'Username')}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/40 px-3 py-2.5 rounded-lg border border-white/5 font-mono text-xs text-white truncate select-all">
                                        {item.username || '-'}
                                    </div>
                                    <button 
                                        onClick={() => onCopy(item.username)} 
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                        title="Copy"
                                    >
                                        <Copy size={14}/>
                                    </button>
                                </div>
                            </div>

                            {/* Password / CVV Row */}
                            <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                    {isCard ? <Lock size={10}/> : <Key size={10}/>} 
                                    {isCard ? 'CVV' : (item.category === 'Cookie' ? 'Value' : 'Password')}
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/40 px-3 py-2.5 rounded-lg border border-white/5 font-mono text-xs text-white truncate select-all flex items-center justify-between">
                                        <span className={showPass ? "" : "tracking-widest"}>
                                            {showPass ? item.password : '●●●●●●●●'}
                                        </span>
                                        <button 
                                            onClick={() => setShowPass(!showPass)}
                                            className="text-slate-500 hover:text-white ml-2 p-1"
                                        >
                                            {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => onCopy(item.password || '')} 
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                        title="Copy"
                                    >
                                        <Copy size={14}/>
                                    </button>
                                </div>
                            </div>

                            {/* Additional Info for Cards */}
                            {isCard && (
                                    <div className="space-y-1" onClick={e => e.stopPropagation()}>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1"><Key size={10}/> PIN</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-black/40 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs text-white truncate text-center">
                                            {showPass ? (item.notes || '----') : '****'}
                                        </div>
                                    </div>
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Hint */}
                    <div className="p-2 border-t border-white/5 bg-black/20 text-center">
                         <span className="text-[9px] text-slate-600 uppercase tracking-wider font-mono">
                            Click outside boxes to close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] animate-scale-in`}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2"><Terminal size={18}/> {title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full hover:bg-white/10 active:scale-95">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

const SetupScreen: React.FC<{ onSetup: (password: string, panic?: string) => void }> = ({ onSetup }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [panicPassword, setPanicPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 8) { setError('Master Password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (panicPassword && panicPassword === password) { setError('Recovery password cannot be same as Master Password.'); return; }
      onSetup(password, panicPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
             {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>
            
            <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-1 relative z-10 mx-4 shadow-2xl animate-scale-in">
                <div className="rounded-[22px] p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-widest">GHOST PROTOCOL</h1>
                        <p className="text-slate-400 text-center mt-2 text-sm font-mono">Secure Vault Initialization</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider ml-1">Master Password</label>
                            <div className="relative group">
                                 <input type={showPassword ? "text" : "password"} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passphrase" />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                             <input type={showPassword ? "text" : "password"} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm" />
                             <StrengthMeter password={password} />
                        </div>
                        
                        <div className="pt-6 border-t border-white/10 mt-6">
                            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                                <label className="text-xs text-rose-400 uppercase font-bold flex items-center gap-2 mb-2">
                                    <AlertTriangle size={14} /> Panic Code
                                </label>
                                <input type="password" className="w-full bg-black/40 border border-rose-500/30 rounded-lg px-4 py-3 text-rose-100 focus:ring-2 focus:ring-rose-500/30 outline-none placeholder:text-rose-500/30 font-mono" value={panicPassword} onChange={(e) => setPanicPassword(e.target.value)} placeholder="Optional Reset Code" />
                            </div>
                        </div>

                        {error && <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
                        
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2 active:scale-[0.98]">
                            Encrypt System
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
};

const UnlockScreen: React.FC<{ onUnlock: (password: string) => Promise<boolean>, onReset?: () => void }> = ({ onUnlock, onReset }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTimeout(async () => {
          if (!(await onUnlock(password))) setError('Access Denied');
          setLoading(false);
        }, 800); 
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-sm w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative z-10 text-center shadow-2xl animate-scale-in">
                 <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
                    <Lock size={32} className="text-indigo-400" />
                 </div>
                 
                 <h2 className="text-xl font-bold text-white mb-2 tracking-widest">AUTHENTICATE</h2>
                 <p className="text-slate-400 text-xs mb-8 font-mono">Enter decryption key</p>
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input 
                            type="password" 
                            autoFocus 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-white text-lg tracking-[0.5em] placeholder:text-slate-800 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••" 
                        />
                    </div>
                    
                    {error && <div className="text-rose-400 text-xs font-mono animate-pulse">{error}</div>}
                    
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Unlock size={20} />}
                        {loading ? 'DECRYPTING...' : 'UNLOCK'}
                    </button>
                 </form>
                 
                 <div className="mt-8 pt-6 border-t border-white/5">
                     <button onClick={onReset} className="text-[10px] text-slate-600 hover:text-rose-400 transition-colors uppercase tracking-wider">System Reset</button>
                 </div>
            </div>
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [encryptedData, setEncryptedData] = useState<EncryptedVault | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ displayName: 'Ghost', avatarId: '1' });
  const [apiKey, setApiKey] = useState<string>('');
  const [isAuxMode, setIsAuxMode] = useState(false);
  
  // Folders State
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  
  // Customization State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  
  // Settings
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(15);
  const [customBackground, setCustomBackground] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'generator' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [viewingNote, setViewingNote] = useState<VaultItem | null>(null); // New state for Note Viewer
  
  // Initialize new Item data safely
  const [newItemData, setNewItemData] = useState<Partial<VaultItem>>({ category: 'Login', folder: 'Personal' });
  const [newFolderName, setNewFolderName] = useState('');
  
  // Dashboard Navigation State (Folder vs List)
  const [dashboardView, setDashboardView] = useState<'folders' | 'list'>('folders');
  const [selectedCategory, setSelectedCategory] = useState<VaultItem['category'] | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEncryptedData(JSON.parse(stored));
        setAppState(AppState.LOCKED);
      } catch (e) { setAppState(AppState.SETUP); }
    } else { setAppState(AppState.SETUP); }

    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
        try { 
            const parsed = JSON.parse(storedSettings);
            setAutoLockMinutes(parsed.autoLockMinutes || 15); 
            if(parsed.customBackground) setCustomBackground(parsed.customBackground);
            if(parsed.themeConfig) setThemeConfig(parsed.themeConfig);
        } catch {}
    }
    const storedProfile = localStorage.getItem(PROFILE_KEY);
    if (storedProfile) {
        try { setUserProfile(JSON.parse(storedProfile)); } catch {}
    }
    const storedFolders = localStorage.getItem(FOLDERS_KEY);
    if(storedFolders) {
        try { setFolders(JSON.parse(storedFolders)); } catch {}
    }
  }, []);

  // Theme Application & Background Image Logic
  useEffect(() => {
    const root = document.body;
    root.style.setProperty('--color-primary', themeConfig.cardColor);
    
    if (customBackground) {
        root.style.backgroundImage = `url(${customBackground})`;
        root.style.backgroundSize = 'cover';
        root.style.backgroundPosition = 'center';
        root.style.backgroundAttachment = 'fixed';
    } else {
        root.style.backgroundImage = 'none';
        root.style.backgroundColor = '#020617'; // Slate 950
    }
  }, [customBackground, themeConfig]);

  const updateSettings = (newSettings: any) => {
      const settings = { autoLockMinutes, customBackground, themeConfig: { ...themeConfig, ...newSettings } };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  };

  const handleAutoLockChange = (minutes: number) => {
      setAutoLockMinutes(minutes);
      const currentSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      const newSettings = { ...currentSettings, autoLockMinutes: minutes };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const updateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  };

  const addFolder = () => {
      if(!newFolderName.trim()) return;
      const updated = [...folders, newFolderName.trim()];
      setFolders(updated);
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
      setNewFolderName('');
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { alert("Max 5MB."); return; }
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setCustomBackground(base64);
              const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
              localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, customBackground: base64 }));
          };
          reader.readAsDataURL(file);
      }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { alert("Max 2MB for avatar."); return; }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            updateProfile({ ...userProfile, customAvatar: base64 });
        };
        reader.readAsDataURL(file);
    }
  };

  const saveVault = async (items: VaultItem[], password: string, currentApiKey: string, existingSalt?: string) => {
    if (isAuxMode) return; 
    try {
      // Updated: Now using field-level encryption service
      // The service returns the EncryptedVault object, which we stringify for storage
      const encryptedVault = await CryptoService.encryptVault(items, currentApiKey, password, existingSalt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedVault));
      
      setEncryptedData(encryptedVault);
      setVaultItems(items);
      setApiKey(currentApiKey);
    } catch (e) { 
        console.error(e);
        alert("Write Error: Failed to encrypt/save data."); 
    }
  };

  const handleSetup = async (password: string, panic?: string) => {
    setMasterPassword(password);
    if (panic) {
        const hash = await CryptoService.hashString(panic);
        localStorage.setItem(SYS_RECOVERY_HASH, hash); 
    }
    await saveVault([], password, '');
    setAppState(AppState.UNLOCKED);
  };

  const handleUnlock = async (password: string): Promise<boolean> => {
    const storedRecoveryHash = localStorage.getItem(SYS_RECOVERY_HASH);
    if (storedRecoveryHash) {
        const inputHash = await CryptoService.hashString(password);
        if (inputHash === storedRecoveryHash) {
            localStorage.clear(); 
            sessionStorage.clear();
            setIsAuxMode(true);
            setVaultItems([]); 
            setApiKey('');
            setUserProfile({ displayName: 'User', avatarId: '1' });
            setAppState(AppState.UNLOCKED);
            return true;
        }
    }

    if (!encryptedData) return false;
    try {
      // Updated: Decrypt vault using field-level aware service
      const { items, apiKey: decryptedApiKey } = await CryptoService.decryptVault(encryptedData, password);
      
      setMasterPassword(password);
      setVaultItems(items);
      setApiKey(decryptedApiKey);
      setAppState(AppState.UNLOCKED);
      return true;
    } catch (e) { return false; }
  };

  const handleLogout = useCallback(() => {
    setMasterPassword('');
    setVaultItems([]);
    setApiKey('');
    setAppState(AppState.LOCKED);
    setDashboardView('folders'); 
    setIsAuxMode(false);
    setFilterFolder(null);
    setSearchQuery(''); 
  }, []);

  const handleReset = () => {
    if (window.confirm("WARNING: This will permanently delete all your passwords and data. This action cannot be undone. Are you sure?")) {
      localStorage.clear();
      sessionStorage.clear();
      setEncryptedData(null);
      setAppState(AppState.SETUP);
      window.location.reload(); // Force reload to ensure clean state
    }
  };

  const handleExportVault = () => {
      if (isAuxMode) return;
      const dataStr = localStorage.getItem(STORAGE_KEY);
      if(!dataStr) return;
      
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `passvault_ghost_backup_${new Date().toISOString().slice(0,10)}.pv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const parsed = JSON.parse(content);

              // Check if it's a valid PassVault Encrypted Backup
              // Supports both new format (salt + integrity) and legacy (salt + iv + data)
              if (parsed.salt && ((parsed.iv && parsed.data) || (parsed.items && parsed.integrity))) {
                  if (confirm("WARNING: Importing will OVERWRITE your current vault data. This cannot be undone. Continue?")) {
                      // Save to storage
                      localStorage.setItem(STORAGE_KEY, content);
                      
                      // Update State Immediateley
                      setEncryptedData(parsed);
                      setVaultItems([]); 
                      setMasterPassword(''); 
                      setApiKey(''); 
                      setAppState(AppState.LOCKED);
                      
                      alert("Vault restored successfully. Please unlock with the backup's Master Password.");
                  }
              } else {
                  alert("Import Failed: Invalid file format.\n\nOnly .pv (PassVault) backup files are supported.");
              }
          } catch (err) {
              console.error(err);
              alert("Import Failed: The file is corrupted or not a valid JSON.");
          }
      };
      reader.readAsText(file);
      
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
  };

  const handleAddItem = async () => {
    if (isAuxMode) { setIsAddModalOpen(false); return; }
    if (!newItemData.name && newItemData.category !== 'Cookie') return; 
    if(newItemData.category === 'Cookie' && !newItemData.name) newItemData.name = "Imported Cookie";
    
    const now = Date.now();
    const item: VaultItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      name: newItemData.name!,
      username: newItemData.username || '',
      password: newItemData.password || '',
      website: newItemData.website || '',
      notes: newItemData.notes || '',
      category: (newItemData.category as any) || 'Login',
      folder: newItemData.folder || 'Personal',
      color: newItemData.color,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
      history: []
    };

    const newItems = editingItem ? vaultItems.map(i => i.id === item.id ? item : i) : [...vaultItems, item];
    await saveVault(newItems, masterPassword, apiKey, encryptedData?.salt);
    setEditingItem(null);
    setNewItemData({ category: selectedCategory || 'Login', folder: 'Personal' });
    setIsAddModalOpen(false);
  };

  const handleDelete = async (id: string) => {
      if(isAuxMode) { 
        setVaultItems(prev => prev.filter(i => i.id !== id));
        if (editingItem?.id === id) { setIsAddModalOpen(false); setEditingItem(null); }
        return; 
      }
      if(confirm("Are you sure you want to permanently delete this item?")) {
          const newItems = vaultItems.filter(i => i.id !== id);
          await saveVault(newItems, masterPassword, apiKey, encryptedData?.salt);
          if (editingItem?.id === id) { setIsAddModalOpen(false); setEditingItem(null); }
      }
  }

  // --- Cookie Import Logic ---
  const handleImportCookiesFromClipboard = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if(!text) { alert("Clipboard is empty."); return; }
        
        let imported = 0;
        let newItems: VaultItem[] = [];
        const now = Date.now();

        // Try JSON format
        try {
            const json = JSON.parse(text);
            if(Array.isArray(json)) {
                json.forEach((c: any) => {
                    if(c.domain && c.name && c.value) {
                         newItems.push({
                             id: crypto.randomUUID(),
                             category: 'Cookie',
                             name: c.domain, // Domain as Name
                             username: c.name, // Key as Username
                             password: c.value, // Value as Password
                             notes: JSON.stringify(c),
                             folder: 'Other',
                             createdAt: now, updatedAt: now
                         });
                         imported++;
                    }
                });
            }
        } catch(e) {
            // Try Netscape format (basic parsing)
            const lines = text.split('\n');
            lines.forEach(line => {
                if(line.startsWith('#') || !line.trim()) return;
                const parts = line.split('\t');
                if(parts.length >= 6) {
                    newItems.push({
                         id: crypto.randomUUID(),
                         category: 'Cookie',
                         name: parts[0], // Domain
                         username: parts[5], // Name
                         password: parts[6], // Value
                         notes: 'Imported from Netscape format',
                         folder: 'Other',
                         createdAt: now, updatedAt: now
                    });
                    imported++;
                }
            });
        }

        if(imported > 0) {
            const updatedVault = [...vaultItems, ...newItems];
            await saveVault(updatedVault, masterPassword, apiKey, encryptedData?.salt);
            alert(`Successfully imported ${imported} cookies.`);
        } else {
            alert("No valid cookies found in clipboard. Support JSON or Netscape format.");
        }

    } catch (err) {
        alert("Failed to read clipboard. Please allow clipboard permissions.");
    }
  };

  const filteredItems = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      return vaultItems.filter(item => {
          let matchesSearch = true;
          if (query) {
             matchesSearch = item.name.toLowerCase().includes(query) || item.username.toLowerCase().includes(query);
          }
          const matchesFolder = filterFolder ? item.folder === filterFolder : true;
          if (dashboardView === 'list' && selectedCategory) {
              return matchesSearch && item.category === selectedCategory && matchesFolder;
          }
          return matchesSearch && matchesFolder;
      });
  }, [vaultItems, searchQuery, filterFolder, dashboardView, selectedCategory]);

  // --- Auto-lock Logic ---
  useEffect(() => {
    if (appState !== AppState.UNLOCKED) return;

    let lastActivity = Date.now();
    
    const onActivity = () => {
        lastActivity = Date.now();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
        // Use capture for scroll to ensure we catch all scroll events
        window.addEventListener(event, onActivity, { capture: true });
    });

    // Check for inactivity every second
    const intervalId = setInterval(() => {
        const now = Date.now();
        if (now - lastActivity > autoLockMinutes * 60 * 1000) {
            handleLogout();
        }
    }, 1000); 

    return () => {
        clearInterval(intervalId);
        activityEvents.forEach(event => {
            window.removeEventListener(event, onActivity, { capture: true });
        });
    };
  }, [appState, autoLockMinutes, handleLogout]);

  // --- Sub-Render Functions for Modal ---
  
  const renderServicePresets = () => {
      if (newItemData.category !== 'Login') return null;
      return (
          <div className="mb-4">
              <label className="text-[10px] text-slate-500 uppercase font-mono mb-2 block">Quick Service Select</label>
              <div className="grid grid-cols-5 gap-3">
                  {SERVICE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setNewItemData({ ...newItemData, name: preset.name, website: preset.url })}
                        className="flex flex-col items-center gap-1 group"
                        title={preset.name}
                      >
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 transition-all" style={{ color: preset.color }}>
                              <preset.icon size={20} />
                          </div>
                          <span className="text-[9px] text-slate-500 group-hover:text-white transition-colors">{preset.name}</span>
                      </button>
                  ))}
              </div>
          </div>
      );
  };

  const renderNoteInputs = () => (
      <div className="space-y-4">
           <div className="space-y-1">
              <label className="text-[10px] text-amber-500 uppercase font-mono pl-1">Note Title</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-amber-200 focus:border-amber-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                  placeholder="e.g. WiFi Passwords, Backup Codes"
                  value={newItemData.name || ''} 
                  onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
              />
          </div>
           <div className="space-y-1 flex-1">
              <label className="text-[10px] text-amber-500 uppercase font-mono pl-1">Secure Content</label>
              <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm min-h-[200px] resize-none leading-relaxed" 
                  placeholder="Type your sensitive information here..."
                  value={newItemData.notes || ''} 
                  onChange={e => setNewItemData({...newItemData, notes: e.target.value})} 
              />
          </div>
      </div>
  );

  const renderLoginInputs = () => (
      <div className="space-y-4">
           {renderServicePresets()}
           
           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Service Name</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                  placeholder="e.g. Netflix"
                  value={newItemData.name || ''} 
                  onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
              />
          </div>

          <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Username / Email</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                  value={newItemData.username || ''} 
                  onChange={e => setNewItemData({...newItemData, username: e.target.value})} 
              />
          </div>

           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Password</label>
              <div className="relative">
                  <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                      value={newItemData.password || ''} 
                      onChange={e => setNewItemData({...newItemData, password: e.target.value})} 
                  />
                  <button onClick={() => setNewItemData({...newItemData, password: crypto.randomUUID().slice(0,18)})} className="absolute right-3 top-3 text-indigo-500 hover:text-white"><RefreshCw size={18}/></button>
              </div>
          </div>
          
           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Website URL (Optional)</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-xs" 
                  placeholder="https://..."
                  value={newItemData.website || ''} 
                  onChange={e => setNewItemData({...newItemData, website: e.target.value})} 
              />
          </div>

           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Notes (Optional)</label>
              <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-400 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-xs min-h-[60px]" 
                  value={newItemData.notes || ''} 
                  onChange={e => setNewItemData({...newItemData, notes: e.target.value})} 
              />
          </div>
      </div>
  );

  const renderCardInputs = () => (
      <div className="space-y-4">
           {/* Bank Name */}
           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Bank / Card Name</label>
              <div className="relative">
                  <Monitor className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                      placeholder="e.g. Chase Sapphire"
                      value={newItemData.name || ''} 
                      onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
                  />
              </div>
          </div>

          {/* Card Number (Formatted) */}
          <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Card Number (16 Digits)</label>
              <div className="relative">
                  <CardIcon className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input 
                      type="text" 
                      maxLength={19}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm tracking-wider" 
                      placeholder="0000 0000 0000 0000"
                      value={newItemData.username || ''} 
                      onChange={e => setNewItemData({...newItemData, username: formatCardNumber(e.target.value)})} 
                  />
              </div>
          </div>

          <div className="flex gap-4">
              {/* Expiry */}
              <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Expiry (MM/YY)</label>
                  <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 text-slate-500" size={16} />
                      <input 
                          type="text" 
                          maxLength={5}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                          placeholder="MM/YY"
                          value={newItemData.website || ''} 
                          onChange={e => setNewItemData({...newItemData, website: formatExpiry(e.target.value)})} 
                      />
                  </div>
              </div>

              {/* CVV */}
              <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">CVV / CVC</label>
                  <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                      <input 
                          type="text" 
                          maxLength={4}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                          placeholder="123"
                          value={newItemData.password || ''} 
                          onChange={e => setNewItemData({...newItemData, password: e.target.value.replace(/\D/g,'')})} 
                      />
                  </div>
              </div>
          </div>

          {/* NEW PIN FIELD (Mapped to NOTES) */}
          <div className="space-y-1 flex-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Card PIN (4 Digits)</label>
              <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-slate-500" size={16} />
                  <input 
                      type="text" 
                      maxLength={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                      placeholder="0000"
                      value={newItemData.notes || ''} 
                      onChange={e => setNewItemData({...newItemData, notes: e.target.value.replace(/\D/g,'')})} 
                  />
              </div>
          </div>
      </div>
  );

  const renderCookieInputs = () => (
      <div className="space-y-4">
           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Domain</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                  value={newItemData.name || ''} 
                  onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
              />
          </div>
          <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Key Name</label>
              <input 
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm" 
                  value={newItemData.username || ''} 
                  onChange={e => setNewItemData({...newItemData, username: e.target.value})} 
              />
          </div>
           <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-mono pl-1">Value</label>
              <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm min-h-[100px]" 
                  value={newItemData.password || ''} 
                  onChange={e => setNewItemData({...newItemData, password: e.target.value})} 
              />
          </div>
      </div>
  );


  if (appState === AppState.SETUP) return <SetupScreen onSetup={handleSetup} />;
  if (appState === AppState.LOCKED) return <UnlockScreen onUnlock={handleUnlock} onReset={handleReset} />;

  // Main Container Style for Dynamic Background
  const mainContainerStyle = {
      backgroundColor: `rgba(2, 6, 23, ${themeConfig.bgOpacity})`,
      backdropFilter: `blur(${themeConfig.blurAmount}px)`
  };

  return (
    <div className="flex h-screen text-slate-200 font-sans overflow-hidden" style={mainContainerStyle}>
       
       {/* Sidebar */}
       <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col z-20 bg-black/40 backdrop-blur-md">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white" size={18} />
             </div>
             <div className="hidden lg:block">
                <h1 className="font-bold text-base text-white tracking-widest">GHOST</h1>
                <span className="text-[9px] text-slate-500 font-mono tracking-wider">PROTOCOL v2.0</span>
             </div>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1">
             {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'security', icon: Shield, label: 'Security AI' },
                { id: 'generator', icon: Key, label: 'Generator' },
                { id: 'settings', icon: Settings, label: 'Settings' },
             ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setDashboardView('folders'); setFilterFolder(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group active:scale-95 ${
                        activeTab === tab.id 
                        ? 'bg-white/10 text-white font-medium border-l-2 border-indigo-500' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-400' : ''} />
                    <span className="hidden lg:block text-sm tracking-wide">{tab.label}</span>
                </button>
             ))}
          </nav>

          <div className="p-4 border-t border-white/5 bg-black/20">
             <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    {userProfile.customAvatar ? (
                        <img src={userProfile.customAvatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                            {userProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full animate-pulse"></div>
                </div>
                <div className="hidden lg:block min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{userProfile.displayName}</p>
                    <p className="text-[9px] text-emerald-400 font-mono">ENCRYPTED</p>
                </div>
                <button onClick={handleLogout} className="hidden lg:block ml-auto text-slate-500 hover:text-white transition-colors"><LogOut size={16} /></button>
             </div>
          </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 relative overflow-hidden flex flex-col">
          
          {activeTab === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10 animate-fade-in">
               <header className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                        {dashboardView === 'list' 
                            ? (filterFolder ? filterFolder.toUpperCase() + ' FOLDER' : (selectedCategory ? selectedCategory.toUpperCase() + 'S' : 'ALL ITEMS')) 
                            : 'COMMAND CENTER'
                        }
                    </h2>
                    <p className="text-slate-400 text-xs font-mono">
                        {dashboardView === 'list' ? `// ACCESSING ${filteredItems.length} SECURE RECORDS` : '// SELECT DATA CLASSIFICATION'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                       {/* Cookie Import Button */}
                       {dashboardView === 'list' && selectedCategory === 'Cookie' && (
                          <button onClick={handleImportCookiesFromClipboard} className="flex items-center gap-2 text-amber-400 hover:text-white text-xs font-mono bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all hover:bg-amber-500/20">
                              <Zap size={14} /> AUTO IMPORT
                          </button>
                       )}
                       
                       {dashboardView === 'list' && (
                          <button onClick={() => { setDashboardView('folders'); setSelectedCategory(null); setFilterFolder(null); setSearchQuery(''); }} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono bg-white/5 border border-white/10 px-4 py-2 rounded-lg transition-all hover:bg-white/10">
                              <ArrowLeft size={14} /> RETURN
                          </button>
                      )}
                  </div>
               </header>

               {/* Folder View */}
               {dashboardView === 'folders' && (
                   <div className="space-y-8 animate-scale-in">
                        {/* Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { id: 'Login', icon: Monitor, label: 'Logins', desc: 'Credentials', color: 'text-cyan-400' },
                                { id: 'Card', icon: CreditCard, label: 'Cards', desc: 'Financial', color: 'text-purple-400' },
                                { id: 'Note', icon: StickyNote, label: 'Notes', desc: 'Secure Memos', color: 'text-yellow-400' },
                                { id: 'Cookie', icon: Cookie, label: 'Cookies', desc: 'Session Data', color: 'text-orange-400' },
                            ].map(cat => (
                                <button 
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id as any); setDashboardView('list'); }}
                                        className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 group text-left"
                                >
                                    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                        <cat.icon size={64} />
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-black/40 border border-white/10 ${cat.color} mb-2`}>
                                        <cat.icon size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white tracking-wider">{cat.label}</div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase">{cat.desc}</div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center w-full">
                                        <span className="text-xl font-bold text-white font-mono">
                                            {vaultItems.filter(i => i.category === cat.id).length}
                                        </span>
                                        <div className="bg-white/5 p-1 rounded-full group-hover:bg-white/20 transition-colors text-slate-500">
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Add Folder Section */}
                        <div>
                             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FolderOpen size={16}/> CUSTOM FOLDERS</h3>
                             <div className="flex flex-wrap gap-4 items-end">
                                 {/* New Folder Input */}
                                 <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-3 w-full md:w-auto">
                                     <div className="relative flex-1">
                                          <input 
                                              type="text" 
                                              value={newFolderName}
                                              onChange={(e) => setNewFolderName(e.target.value)}
                                              placeholder="New Folder Name"
                                              className="bg-transparent border-none outline-none text-white text-sm font-mono placeholder-slate-600 w-full min-w-[150px]"
                                          />
                                     </div>
                                     <button onClick={addFolder} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                                         <Plus size={16} />
                                     </button>
                                 </div>

                                 {/* Existing Folders - NOW CLICKABLE */}
                                 {folders.map(folder => (
                                     <div 
                                        key={folder} 
                                        onClick={() => { setFilterFolder(folder); setDashboardView('list'); }}
                                        className="bg-white/5 border border-white/5 rounded-xl p-4 min-w-[140px] flex flex-col justify-between h-full hover:bg-white/10 transition-colors group cursor-pointer active:scale-95"
                                     >
                                         <div className="flex items-center gap-2 mb-2">
                                             <FolderPlus size={16} className="text-slate-400" />
                                             <span className="text-xs font-bold text-white truncate">{folder}</span>
                                         </div>
                                         <span className="text-[10px] text-slate-500 font-mono">{vaultItems.filter(i => i.folder === folder).length} items</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                   </div>
               )}

               {/* List View */}
               {dashboardView === 'list' && (
                   <div key={selectedCategory || 'list'} className="space-y-6 animate-slide-up">
                        
                        {/* CATEGORY FILTER TABS */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-2">
                            <button 
                                onClick={() => setSelectedCategory(null)} 
                                className={`px-4 py-2 rounded-full text-xs font-bold font-mono transition-all border whitespace-nowrap ${!selectedCategory ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                ALL
                            </button>
                            {['Login', 'Card', 'Note', 'Cookie'].map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => setSelectedCategory(type as any)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold font-mono transition-all border whitespace-nowrap flex items-center gap-2 ${selectedCategory === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {type === 'Login' && <Monitor size={12}/>}
                                    {type === 'Card' && <CreditCard size={12}/>}
                                    {type === 'Note' && <StickyNote size={12}/>}
                                    {type === 'Cookie' && <Cookie size={12}/>}
                                    {type.toUpperCase()}S
                                </button>
                            ))}
                        </div>

                        {/* Search & Action Bar */}
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-3">
                                {/* Search Input */}
                                <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2 shadow-inner focus-within:border-indigo-500/50 transition-colors">
                                    <Search className="text-slate-500 ml-3" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="SEARCH DATABASE..."
                                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 text-sm py-2 font-mono"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                {/* Folder Select Dropdown */}
                                <div className="relative min-w-[150px]">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <Filter size={14} />
                                    </div>
                                    <select
                                        value={filterFolder || ''}
                                        onChange={(e) => setFilterFolder(e.target.value || null)}
                                        className="w-full h-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-white text-xs font-mono appearance-none focus:border-indigo-500/50 outline-none cursor-pointer"
                                    >
                                        <option value="">ALL FOLDERS</option>
                                        {folders.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <ChevronRight size={12} className="rotate-90" />
                                    </div>
                                </div>

                                <button onClick={() => { setEditingItem(null); setNewItemData({category: selectedCategory || 'Login', folder: 'Personal'}); setIsAddModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold font-mono rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 shrink-0">
                                    <Plus size={14} /> NEW ENTRY
                                </button>
                            </div>
                            
                            {/* Active Filters Indicators (Chips) */}
                            {(selectedCategory || filterFolder || searchQuery) && (
                                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                                    <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Active Filters:</span>
                                    
                                    {selectedCategory && (
                                        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono hover:bg-indigo-500/20 transition-colors group">
                                            <span>TYPE: {selectedCategory.toUpperCase()}</span>
                                            <X size={12} className="group-hover:text-white" />
                                        </button>
                                    )}

                                    {filterFolder && (
                                        <button onClick={() => setFilterFolder(null)} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono hover:bg-emerald-500/20 transition-colors group">
                                            <span>FOLDER: {filterFolder.toUpperCase()}</span>
                                            <X size={12} className="group-hover:text-white" />
                                        </button>
                                    )}

                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono hover:bg-amber-500/20 transition-colors group">
                                            <span>QUERY: "{searchQuery}"</span>
                                            <X size={12} className="group-hover:text-white" />
                                        </button>
                                    )}
                                     
                                    <button onClick={() => {setSelectedCategory(null); setFilterFolder(null); setSearchQuery('');}} className="text-[10px] text-slate-500 hover:text-white underline ml-2">
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 3D CARDS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {filteredItems.map((item, index) => (
                                <div key={item.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                                    <VaultCard 
                                        item={item} 
                                        themeConfig={themeConfig}
                                        onEdit={(i) => { setEditingItem(i); setNewItemData(i); setIsAddModalOpen(true); }}
                                        onDelete={handleDelete}
                                        onCopy={(txt) => { navigator.clipboard.writeText(txt); }}
                                        onView={(i) => setViewingNote(i)}
                                    />
                                </div>
                            ))}
                        </div>
                   </div>
               )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex-1 p-4 lg:p-8 flex flex-col h-full relative z-10 animate-fade-in overflow-y-auto">
               <VaultHealth items={vaultItems} />
               <div className="flex-1 min-h-[400px]">
                  <SecurityAssistant 
                    className="h-full" 
                    userProfile={userProfile} 
                    apiKey={apiKey} 
                    items={vaultItems}
                    themeConfig={themeConfig}
                  />
               </div>
            </div>
          )}

          {activeTab === 'generator' && (
            <div className="flex-1 p-4 lg:p-8 flex items-center justify-center relative z-10 animate-fade-in">
                <div className="w-full max-w-2xl">
                    <PasswordGenerator />
                </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 animate-fade-in">
                <div className="max-w-2xl mx-auto space-y-6">
                   <h2 className="text-xl font-bold text-white mb-6 tracking-widest flex items-center gap-2"><Settings size={20}/> SYSTEM CONFIG</h2>
                   
                   {/* PROFILE SETTINGS - NEW */}
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><User size={16} className="text-cyan-400" /> IDENTITY CONFIG</h3>
                            <span className="text-[10px] text-slate-500 font-mono">LOCAL OVERRIDE</span>
                        </div>

                        <div className="space-y-6">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-mono uppercase">Codename</label>
                                <input 
                                    type="text" 
                                    value={userProfile.displayName} 
                                    onChange={(e) => updateProfile({...userProfile, displayName: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none font-mono text-sm tracking-wider"
                                />
                            </div>

                            {/* Avatar Selection */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-mono uppercase">Visual Signature</label>
                                <div className="flex flex-wrap items-center gap-3">
                                    {['1','2','3','4','5'].map(id => (
                                        <button
                                            key={id}
                                            onClick={() => updateProfile({...userProfile, avatarId: id, customAvatar: undefined})}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${userProfile.avatarId === id && !userProfile.customAvatar ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        >
                                           <div className={`w-8 h-8 rounded-full ${
                                                id === '1' ? 'bg-blue-500' :
                                                id === '2' ? 'bg-purple-500' :
                                                id === '3' ? 'bg-emerald-500' :
                                                id === '4' ? 'bg-orange-500' : 'bg-pink-500'
                                           }`}></div>
                                        </button>
                                    ))}
                                    
                                    <div className="w-px h-8 bg-white/10 mx-2"></div>

                                    {/* Upload Button */}
                                    <label className="cursor-pointer group">
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 ${userProfile.customAvatar ? 'border-cyan-500' : 'border-white/10'}`}>
                                            {userProfile.customAvatar ? (
                                                <img src={userProfile.customAvatar} className="w-8 h-8 rounded-full object-cover" alt="Custom" />
                                            ) : (
                                                <Camera size={16} className="text-slate-400 group-hover:text-white" />
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                    </label>
                                    
                                    {userProfile.customAvatar && (
                                         <button onClick={() => updateProfile({...userProfile, customAvatar: undefined})} className="text-[10px] text-rose-400 hover:text-white underline">Clear</button>
                                    )}
                                </div>
                            </div>
                        </div>
                   </section>

                   {/* SECURITY TIMEOUT SETTINGS */}
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Timer size={16} className="text-orange-400" /> SECURITY TIMEOUT</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-slate-400 font-mono uppercase">Auto-lock Duration</label>
                                <span className="text-white font-mono text-sm">{autoLockMinutes} Minutes</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="60" 
                                value={autoLockMinutes} 
                                onChange={(e) => handleAutoLockChange(parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <p className="text-[10px] text-slate-500 font-mono">Vault will automatically lock after {autoLockMinutes} minutes of inactivity (no mouse, keyboard or scroll events).</p>
                        </div>
                   </section>

                   {/* LIVE THEME EDITOR */}
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sliders size={16} className="text-indigo-400" /> INTERFACE CUSTOMIZATION</h3>
                            <span className="text-[10px] text-slate-500 font-mono">LIVE PREVIEW</span>
                        </div>

                        <div className="space-y-6">
                            {/* Card Color Picker */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-mono uppercase">Card Base Color</label>
                                <div className="flex gap-2">
                                    {['#1e293b', '#0f172a', '#171717', '#312e81', '#1e1b4b'].map(color => (
                                        <button 
                                            key={color}
                                            onClick={() => {
                                                const newConf = { ...themeConfig, cardColor: color };
                                                setThemeConfig(newConf);
                                                updateSettings(newConf);
                                            }}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${themeConfig.cardColor === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input 
                                        type="color" 
                                        value={themeConfig.cardColor}
                                        onChange={(e) => {
                                            const newConf = { ...themeConfig, cardColor: e.target.value };
                                            setThemeConfig(newConf);
                                            updateSettings(newConf);
                                        }}
                                        className="w-8 h-8 bg-transparent border-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Glow Intensity */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-mono uppercase flex justify-between">
                                    <span>Glow Intensity</span>
                                    <span>{themeConfig.glowIntensity}px</span>
                                </label>
                                <input 
                                    type="range" min="0" max="30" step="1"
                                    value={themeConfig.glowIntensity}
                                    onChange={(e) => {
                                        const newConf = { ...themeConfig, glowIntensity: parseInt(e.target.value) };
                                        setThemeConfig(newConf);
                                        updateSettings(newConf);
                                    }}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            {/* Background Opacity & Blur */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-mono uppercase flex justify-between">
                                        <span>BG Opacity</span>
                                        <span>{Math.round(themeConfig.bgOpacity * 100)}%</span>
                                    </label>
                                    <input 
                                        type="range" min="0.1" max="1" step="0.05"
                                        value={themeConfig.bgOpacity}
                                        onChange={(e) => {
                                            const newConf = { ...themeConfig, bgOpacity: parseFloat(e.target.value) };
                                            setThemeConfig(newConf);
                                            updateSettings(newConf);
                                        }}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-mono uppercase flex justify-between">
                                        <span>Blur Amount</span>
                                        <span>{themeConfig.blurAmount}px</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="20" step="1"
                                        value={themeConfig.blurAmount}
                                        onChange={(e) => {
                                            const newConf = { ...themeConfig, blurAmount: parseInt(e.target.value) };
                                            setThemeConfig(newConf);
                                            updateSettings(newConf);
                                        }}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                   </section>

                   {/* Custom Wallpaper Upload */}
                    <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon size={16} className="text-cyan-400" /> BACKGROUND LINK</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <label htmlFor="bg-upload" className="flex-1 cursor-pointer">
                                <div className="bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg p-3 text-center transition-all group">
                                    <span className="text-xs text-slate-400 group-hover:text-white font-mono">UPLOAD IMAGE SOURCE</span>
                                </div>
                                <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                            </label>
                            {customBackground && (
                                <button onClick={() => {setCustomBackground(null); localStorage.setItem(SETTINGS_KEY, JSON.stringify({autoLockMinutes, customBackground: null, themeConfig}));}} className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition-all">
                                    <Trash size={16} />
                                </button>
                            )}
                        </div>
                    </section>

                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-400" /> NEURAL LINK API KEY</h3>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => {setApiKey(e.target.value); saveVault(vaultItems, masterPassword, e.target.value, encryptedData?.salt);}} 
                                placeholder="GEMINI-API-KEY" 
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-sm tracking-wider"
                            />
                        </div>
                   </section>

                   {/* Backup & Restore Section - RESTORED */}
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><HardDrive size={16} className="text-emerald-400" /> DATA ARCHIVE</h3>
                        <p className="text-[10px] text-slate-400 mb-4 font-mono">
                            ENCRYPTED BACKUPS REQUIRE CURRENT MASTER KEY FOR RESTORATION.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleExportVault} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 group">
                                <Download size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-white font-mono">EXPORT VAULT</span>
                            </button>
                            <div className="relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 group">
                                <UploadCloud size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-white font-mono">IMPORT VAULT</span>
                                <input type="file" onChange={handleImportVault} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pv,application/json" />
                            </div>
                        </div>
                   </section>

                   {/* Danger Zone - RESTORED */}
                   <section className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2"><AlertCircle size={16}/> DANGER ZONE</h3>
                      <button onClick={handleReset} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold font-mono py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95">
                          <Trash2 size={16} /> SYSTEM PURGE (WIPE DATA)
                      </button>
                   </section>

                </div>
             </div>
          )}
       </main>

       {/* Add/Edit Modal */}
       <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingItem ? 'EDIT RECORD' : `NEW ${newItemData.category?.toUpperCase()}`}>
          <div className="space-y-6">
              {/* Category Selector */}
              <div>
                  <label className="text-[10px] text-slate-500 uppercase font-mono mb-2 block">Data Classification</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {folders.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setNewItemData({...newItemData, folder: cat})}
                            className={`px-3 py-1.5 rounded text-[10px] font-mono border transition-all whitespace-nowrap ${
                                newItemData.folder === cat 
                                ? 'bg-indigo-600 text-white border-indigo-500' 
                                : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
              </div>

              {/* DYNAMIC INPUTS BASED ON CATEGORY */}
              {newItemData.category === 'Card' && renderCardInputs()}
              {newItemData.category === 'Note' && renderNoteInputs()}
              {newItemData.category === 'Login' && renderLoginInputs()}
              {newItemData.category === 'Cookie' && renderCookieInputs()}

              <div className="flex gap-3">
                  {editingItem && (
                      <button 
                          onClick={() => handleDelete(editingItem.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-3.5 rounded-xl transition-all active:scale-[0.98]"
                          title="Delete Item"
                      >
                          <Trash2 size={20} />
                      </button>
                  )}
                  <button onClick={handleAddItem} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                      {editingItem ? 'UPDATE & ENCRYPT' : 'ENCRYPT & SAVE'}
                  </button>
              </div>
          </div>
       </Modal>

        {/* Note Reader Modal - Dedicated View for Notes */}
        {viewingNote && (
            <Modal isOpen={!!viewingNote} onClose={() => setViewingNote(null)} title={viewingNote.name} maxWidth="max-w-2xl">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono border-b border-white/5 pb-2">
                        <Clock size={12} />
                        <span>Last Updated: {new Date(viewingNote.updatedAt).toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <FolderPlus size={12} />
                        <span>{viewingNote.folder}</span>
                    </div>
                    
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[300px] max-h-[60vh] overflow-y-auto custom-scrollbar select-text shadow-inner">
                        {viewingNote.notes || "No content available."}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={() => navigator.clipboard.writeText(viewingNote.notes || '')} 
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all border border-white/5 hover:border-white/20"
                        >
                            <Copy size={14} /> COPY TEXT
                        </button>
                        <button 
                            onClick={() => { setEditingItem(viewingNote); setViewingNote(null); setIsAddModalOpen(true); }} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Edit3 size={14} /> EDIT NOTE
                        </button>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
};

export default App;