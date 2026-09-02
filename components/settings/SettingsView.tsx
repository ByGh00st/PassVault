import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Camera, Timer, Sliders, HardDrive, Download, 
  UploadCloud, AlertCircle, Trash2, Trash, Sparkles, Layers, Eye,
  Monitor, Globe, ChevronRight, Shield, ClipboardCheck, Flame, Zap, ShieldAlert,
  Fingerprint, KeyRound, CheckCircle2
} from 'lucide-react';
import { UserProfile, ThemeConfig } from '../../types';
import { GLASS_PRESETS } from '../../utils/constants';
import * as BiometricService from '../../services/biometricService';

interface SettingsViewProps {
  userProfile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoLockMinutes: number;
  handleAutoLockChange: (minutes: number) => void;
  themeConfig: ThemeConfig;
  updateSettings: (newSettings: Partial<ThemeConfig>) => void;
  customBackground: string | null;
  handleBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBackground: () => void;
  onExportVault: (format?: 'pvdb' | 'pv') => void;
  handleImportVault: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenResetModal: () => void;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = (hex || '#1e293b').replace('#', '');
  let r = 30, g = 41, b = 59;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  updateProfile,
  handleAvatarUpload,
  autoLockMinutes,
  handleAutoLockChange,
  themeConfig,
  updateSettings,
  customBackground,
  handleBackgroundUpload,
  onClearBackground,
  onExportVault,
  handleImportVault,
  onOpenResetModal
}) => {
  const cardOpacity = themeConfig.cardOpacity ?? 0.65;
  const cardBlur = themeConfig.cardBlur ?? 16;
  const cardBorderOpacity = themeConfig.cardBorderOpacity ?? 0.25;
  const glowRadius = themeConfig.glowIntensity ?? 15;

  const [isBioRegistered, setIsBioRegistered] = useState(BiometricService.isBiometricRegistered());
  const [isBioSupported, setIsBioSupported] = useState(false);

  useEffect(() => {
    BiometricService.isBiometricsAvailable().then(setIsBioSupported);
  }, []);

  const handleToggleBiometrics = async () => {
    if (isBioRegistered) {
      BiometricService.removeBiometric();
      setIsBioRegistered(false);
    } else {
      try {
        const success = await BiometricService.registerBiometric(userProfile.displayName);
        if (success) {
          setIsBioRegistered(true);
        }
      } catch (e: any) {
        alert(e?.message || "Windows Hello / Biometric setup was cancelled.");
      }
    }
  };

  const previewFaceStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(themeConfig.cardColor || '#1e293b', cardOpacity),
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
    border: `1px solid rgba(255, 255, 255, ${cardBorderOpacity})`,
    boxShadow: `0 8px 32px -8px rgba(99, 102, 241, 0.25), 0 0 ${glowRadius}px -4px rgba(99, 102, 241, 0.3)`,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10 animate-fade-in font-mono select-none">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
              <Settings size={20} className="text-indigo-400" /> SYSTEM CONFIGURATION
            </h2>
            <p className="text-xs text-slate-500 mt-1">// LOCAL VAULT HARDENING, GLASSMORPHISM & DISPLAY CUSTOMIZATION</p>
          </div>
        </div>
        
        {/* PROFILE SETTINGS */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <User size={16} className="text-cyan-400" /> IDENTITY PROFILE
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1.5">Codename</label>
              <input 
                type="text" 
                value={userProfile.displayName} 
                onChange={(e) => updateProfile({ ...userProfile, displayName: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-2">Avatar Signature</label>
              <div className="flex flex-wrap items-center gap-3">
                {['1', '2', '3', '4', '5'].map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateProfile({ ...userProfile, avatarId: id, customAvatar: undefined })}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                      userProfile.avatarId === id && !userProfile.customAvatar 
                        ? 'border-white scale-110 shadow-lg' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${
                      id === '1' ? 'bg-indigo-600' :
                      id === '2' ? 'bg-purple-600' :
                      id === '3' ? 'bg-emerald-600' :
                      id === '4' ? 'bg-amber-600' : 'bg-pink-600'
                    }`}></div>
                  </button>
                ))}
                
                <div className="w-px h-6 bg-white/10 mx-1"></div>

                <label className="cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 ${userProfile.customAvatar ? 'border-cyan-500' : 'border-white/10'}`}>
                    {userProfile.customAvatar ? (
                      <img src={userProfile.customAvatar} className="w-7 h-7 rounded-lg object-cover" alt="Custom" />
                    ) : (
                      <Camera size={16} className="text-slate-400 hover:text-white" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                
                {userProfile.customAvatar && (
                  <button 
                    type="button"
                    onClick={() => updateProfile({ ...userProfile, customAvatar: undefined })} 
                    className="text-[10px] text-rose-400 hover:underline ml-2"
                  >
                    Clear Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* GLASSMORPHISM & CARD TRANSPARENCY MATRIX */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" /> CARD GLASSMORPHISM & TRANSPARENCY
            </h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-bold">
              {Math.round(cardOpacity * 100)}% OPACITY // {cardBlur}PX BLUR
            </span>
          </div>

          {/* Quick Glass Presets */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-2 font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" /> Quick Glass Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GLASS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    updateSettings({
                      cardOpacity: preset.cardOpacity,
                      cardBlur: preset.cardBlur,
                      cardBorderOpacity: preset.cardBorderOpacity,
                      glowIntensity: preset.glowIntensity,
                      cardColor: preset.cardColor,
                      glassPreset: preset.id as any
                    });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all group ${
                    themeConfig.glassPreset === preset.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{preset.name}</div>
                  <div className="text-[8px] text-slate-500 line-clamp-2 leading-tight">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Interactive Card Preview */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase block font-bold flex items-center gap-1.5">
              <Eye size={12} className="text-indigo-400" /> Real-time Interactive Card Preview
            </label>
            
            <div className="relative p-6 rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/60 flex items-center justify-center min-h-[160px]">
              {/* Background ambient pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf815_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

              {/* The Live Glass Card */}
              <div 
                className="w-full max-w-sm rounded-2xl p-4 transition-all duration-300 relative z-10 space-y-3"
                style={previewFaceStyle}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                      <Monitor size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">ProtonMail Sovereign</span>
                      <span className="text-[9px] text-slate-400">ghost@proton.me</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    LOGIN
                  </span>
                </div>

                <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Password Cipher</span>
                  <span className="text-white font-mono font-bold tracking-widest">•••• •••• ••••</span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1"><Globe size={10} /> proton.me</span>
                  <span className="text-indigo-400 flex items-center gap-0.5">VIEW CIPHER <ChevronRight size={10} /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Glass Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Card Opacity */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-bold text-white">CARD TRANSPARENCY</span>
                <span className="text-cyan-400 font-bold">{Math.round(cardOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="1" 
                step="0.05"
                value={cardOpacity}
                onChange={(e) => updateSettings({ cardOpacity: parseFloat(e.target.value), glassPreset: 'custom' })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-slate-500">Lower values create crystal clear see-through cards.</p>
            </div>

            {/* Card Blur */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-bold text-white">FROSTED GLASS BLUR</span>
                <span className="text-cyan-400 font-bold">{cardBlur}PX</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                step="1"
                value={cardBlur}
                onChange={(e) => updateSettings({ cardBlur: parseInt(e.target.value), glassPreset: 'custom' })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-slate-500">Smooth backdrop optical dispersion.</p>
            </div>

            {/* Glow Intensity */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-bold text-white">NEON BORDER GLOW</span>
                <span className="text-indigo-400 font-bold">{glowRadius}PX</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="35" 
                step="1"
                value={glowRadius}
                onChange={(e) => updateSettings({ glowIntensity: parseInt(e.target.value), glassPreset: 'custom' })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[8px] text-slate-500">Card border aura and ambient drop shadow.</p>
            </div>

            {/* Border Opacity */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-bold text-white">EDGE BORDER INTENSITY</span>
                <span className="text-indigo-400 font-bold">{Math.round(cardBorderOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="0.8" 
                step="0.05"
                value={cardBorderOpacity}
                onChange={(e) => updateSettings({ cardBorderOpacity: parseFloat(e.target.value), glassPreset: 'custom' })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[8px] text-slate-500">Outer rim glass outline sharpness.</p>
            </div>
          </div>
        </section>

        {/* SYSTEM COLOR & BACKDROP TINT */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-indigo-400" /> PALETTE & WALLPAPER
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-2">Card Base Tint Color</label>
              <div className="flex items-center gap-2.5">
                {['#1e293b', '#0f172a', '#171717', '#312e81', '#1e1b4b', '#064e3b', '#450a0a'].map(color => (
                  <button 
                    key={color}
                    type="button"
                    onClick={() => updateSettings({ cardColor: color, glassPreset: 'custom' })}
                    className={`w-8 h-8 rounded-xl border-2 transition-all ${
                      themeConfig.cardColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input 
                  type="color" 
                  value={themeConfig.cardColor}
                  onChange={(e) => updateSettings({ cardColor: e.target.value, glassPreset: 'custom' })}
                  className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>OVERALL APP BACKDROP OPACITY</span>
                  <span>{Math.round(themeConfig.bgOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.05"
                  value={themeConfig.bgOpacity}
                  onChange={(e) => updateSettings({ bgOpacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>APP BACKGROUND BLUR</span>
                  <span>{themeConfig.blurAmount}px</span>
                </div>
                <input 
                  type="range" min="0" max="25" step="1"
                  value={themeConfig.blurAmount}
                  onChange={(e) => updateSettings({ blurAmount: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Custom Wallpaper */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1.5">Custom Wallpaper Source</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl p-3 text-center transition-all">
                    <span className="text-xs text-slate-400">+ Upload Custom Wallpaper (Max 5MB)</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                </label>
                {customBackground && (
                  <button 
                    type="button"
                    onClick={onClearBackground} 
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20"
                    title="Remove Wallpaper"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY TIMEOUT */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Timer size={16} className="text-orange-400" /> INACTIVITY LOCK TIMEOUT
            </h3>
            <span className="text-orange-400 font-bold text-xs bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
              {autoLockMinutes} MINUTES
            </span>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="1" 
              max="60" 
              value={autoLockMinutes} 
              onChange={(e) => handleAutoLockChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-[10px] text-slate-500">
              Vault will automatically seal and clear memory keys after {autoLockMinutes} minutes without interaction.
            </p>
          </div>
        </section>

        {/* OS CLIPBOARD AUTO-PURGE SETTINGS */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck size={16} className="text-cyan-400" /> OS CLIPBOARD AUTO-PURGE
            </h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono transition-all ${
              (themeConfig.clipboardTimeout ?? 30) > 0
                ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              {(themeConfig.clipboardTimeout ?? 30) > 0 
                ? `${themeConfig.clipboardTimeout ?? 30} SECONDS` 
                : 'AUTO-PURGE DISABLED'}
            </span>
          </div>

          <p className="text-[10px] text-slate-400">
            Native OS kernel thread (<code className="text-cyan-400">Win32 EmptyClipboard</code>) scrubs copied passwords and PINs after the timeout to prevent clipboard snooping.
          </p>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {[
              { label: '⚡ 10s Blitz', val: 10 },
              { label: '🛡️ 15s Tactical', val: 15 },
              { label: '🔒 30s Standard', val: 30 },
              { label: '⏳ 60s Relaxed', val: 60 },
              { label: '⚠️ Off / Never', val: 0 },
            ].map(preset => {
              const active = (themeConfig.clipboardTimeout ?? 30) === preset.val;
              return (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => updateSettings({ clipboardTimeout: preset.val })}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95 ${
                    active 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Precision Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>CUSTOM PURGE DELAY</span>
              <span className="text-cyan-400 font-bold">{themeConfig.clipboardTimeout ?? 30}s</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="120" 
              step="5"
              value={themeConfig.clipboardTimeout ?? 30} 
              onChange={(e) => updateSettings({ clipboardTimeout: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[8px] text-slate-500">
              <span>0s (Off)</span>
              <span>30s (Default)</span>
              <span>60s</span>
              <span>120s (Max)</span>
            </div>
          </div>
        </section>

        {/* ANTI-KEYLOGGER & HARDWARE AUTHENTICATION SUITE */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-indigo-400" /> ANTI-KEYLOGGER & HARDWARE AUTH
            </h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
              FIDO2 / WEBAUTHN
            </span>
          </div>

          <p className="text-[10px] text-slate-400">
            Eliminates physical keystrokes completely to defend against Ring 0/3 kernel hooks (<code className="text-indigo-400">WH_KEYBOARD_LL</code> & <code className="text-indigo-400">kbdclass.sys</code>).
          </p>

          {/* Windows Hello / Biometric Enrolment */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Fingerprint size={20} className={isBioRegistered ? "text-emerald-400" : "text-slate-500"} />
                <div>
                  <div className="text-xs font-bold text-white">WINDOWS HELLO / BIOMETRICS</div>
                  <div className="text-[9px] text-slate-400">Fingerprint, Face ID or TPM 2.0 PIN (Zero Keystrokes)</div>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                isBioRegistered 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-slate-500 bg-white/5 border-white/5'
              }`}>
                {isBioRegistered ? 'ENROLLED' : 'NOT ENROLLED'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleBiometrics}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${
                isBioRegistered
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              <KeyRound size={14} />
              <span>{isBioRegistered ? 'UNLINK BIOMETRIC CREDENTIAL' : 'REGISTER WINDOWS HELLO CREDENTIAL'}</span>
            </button>
          </div>

        </section>

        {/* BACKUP & EXPORT */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive size={16} className="text-emerald-400" /> ENCRYPTED ARCHIVE & RESTORE
            </h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
              .PVDB v1.0 BINARY SPEC
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Export directly to Pure Binary format (<code className="text-emerald-400">.pvdb</code>) with zero Base64 bloat, or download legacy JSON (<code className="text-slate-300">.pv</code>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              type="button"
              onClick={() => onExportVault('pvdb')} 
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
            >
              <Download size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">EXPORT .PVDB</span>
              <span className="text-[8px] text-emerald-300">Pure Binary (No Base64)</span>
            </button>

            <button 
              type="button"
              onClick={() => onExportVault('pv')} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group text-center"
            >
              <Download size={20} className="text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">EXPORT .PV</span>
              <span className="text-[8px] text-slate-400">Legacy JSON Format</span>
            </button>

            <label className="relative bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 group cursor-pointer text-center">
              <UploadCloud size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">RESTORE VAULT</span>
              <span className="text-[8px] text-cyan-300">Auto-Detects .pvdb & .pv</span>
              <input type="file" onChange={handleImportVault} className="hidden" accept=".pvdb,.pv,.json,application/octet-stream,application/json" />
            </label>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-2">
            <AlertCircle size={16} /> DANGER ZONE // MEMORY PURGE
          </h3>
          <p className="text-[10px] text-slate-400 mb-4">
            Destroys all encrypted records, local storage salts, and master configuration permanently.
          </p>
          <button 
            type="button"
            onClick={onOpenResetModal} 
            className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-xs tracking-wider"
          >
            <Trash2 size={16} /> WIPE ENTIRE DATABASE & RESET
          </button>
        </section>

      </div>
    </div>
  );
};
