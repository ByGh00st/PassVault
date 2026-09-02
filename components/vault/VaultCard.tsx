import React, { useState } from 'react';
import { 
  Monitor, CreditCard, StickyNote, Cookie, Edit3, Trash2, Globe, 
  ChevronRight, ArrowLeft, Eye, EyeOff, Copy, History, ExternalLink 
} from 'lucide-react';
import { VaultItem, ThemeConfig } from '../../types';
import { safeHostname, formatTimeAgo } from '../../utils/formatters';

interface VaultCardProps {
  item: VaultItem;
  themeConfig: ThemeConfig;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string, label: string) => void;
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

export const VaultCard: React.FC<VaultCardProps> = ({ item, themeConfig, onEdit, onDelete, onCopy }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isCard = item.category === 'Card';

  let shadowGlow = 'rgba(99, 102, 241, 0.25)';
  let accentColor = 'text-cyan-400';
  let badgeBg = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';

  if (isCard) {
    shadowGlow = 'rgba(168, 85, 247, 0.3)';
    accentColor = 'text-purple-400';
    badgeBg = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
  } else if (item.category === 'Note') {
    shadowGlow = 'rgba(245, 158, 11, 0.3)';
    accentColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  } else if (item.category === 'Cookie') {
    shadowGlow = 'rgba(249, 115, 22, 0.3)';
    accentColor = 'text-orange-400';
    badgeBg = 'bg-orange-500/10 text-orange-300 border-orange-500/20';
  }

  const cardOpacity = themeConfig.cardOpacity ?? 0.65;
  const cardBlur = themeConfig.cardBlur ?? 16;
  const cardBorderOpacity = themeConfig.cardBorderOpacity ?? 0.25;
  const glowRadius = themeConfig.glowIntensity ?? 15;

  const dynamicBg = hexToRgba(themeConfig.cardColor || '#1e293b', cardOpacity);
  const dynamicBackdropFilter = `blur(${cardBlur}px)`;
  const dynamicBorder = `1px solid rgba(255, 255, 255, ${cardBorderOpacity})`;
  const dynamicBoxShadow = `0 8px 32px -8px ${shadowGlow}, 0 0 ${glowRadius}px -4px ${shadowGlow}`;

  const cardFaceStyle: React.CSSProperties = {
    backgroundColor: dynamicBg,
    backdropFilter: dynamicBackdropFilter,
    WebkitBackdropFilter: dynamicBackdropFilter,
    border: dynamicBorder,
    boxShadow: dynamicBoxShadow,
  };

  const hostname = safeHostname(item.website);

  return (
    <div className="perspective-1000 h-60 w-full group select-none">
      <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* FRONT FACE */}
        <div 
          onClick={() => setIsFlipped(true)}
          className={`absolute inset-0 backface-hidden rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group-hover:scale-[1.015] ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
          style={cardFaceStyle}
        >
          {/* Subtle Ambient Top Flare */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>

          {/* Edit / Delete Buttons Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-30" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                onEdit(item); 
              }} 
              className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all shadow-md active:scale-95" 
              title="Edit Record"
            >
              <Edit3 size={14} />
            </button>
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(item.id); 
              }} 
              className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-rose-500/80 text-slate-300 hover:text-white transition-all shadow-md active:scale-95" 
              title="Delete Record"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* HEADER SECTION */}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 border border-white/10 ${accentColor}`}>
              {item.category === 'Login' && <Monitor size={20} />}
              {item.category === 'Card' && <CreditCard size={20} />}
              {item.category === 'Note' && <StickyNote size={20} />}
              {item.category === 'Cookie' && <Cookie size={20} />}
            </div>

            <div className="min-w-0 pr-16">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${badgeBg}`}>
                  {item.category}
                </span>
                {item.folder && (
                  <span className="text-[9px] font-mono text-slate-500 truncate">
                    // {item.folder}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE CONTENT SECTION */}
          <div className="relative z-10 my-auto">
            {isCard ? (
              <div className="space-y-1">
                <p className="font-ocr text-lg sm:text-xl text-white tracking-[0.18em] drop-shadow-md">
                  {item.username ? item.username.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">{item.name}</p>
              </div>
            ) : (
              <div className="space-y-1 pr-4">
                <h3 className="text-lg font-bold text-white tracking-tight truncate font-mono" title={item.name}>
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {item.category === 'Note' 
                    ? (item.notes ? item.notes.substring(0, 45) + '...' : 'Secure memo note')
                    : (item.username || 'No identity/username')}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER SECTION */}
          <div className="relative z-10 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400">
            {isCard ? (
              <>
                <div>EXP: <span className="text-white font-mono">{item.website || 'MM/YY'}</span></div>
                <div className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>FLIP FOR CVV</span>
                  <ChevronRight size={12} />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                  {item.category !== 'Note' && <Globe size={11} className="text-slate-500 shrink-0" />}
                  <span className="truncate">{item.category === 'Note' ? 'Encrypted Memo' : hostname}</span>
                </div>
                <div className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>VIEW CREDENTIALS</span>
                  <ChevronRight size={12} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-5 flex flex-col justify-between ${isFlipped ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={cardFaceStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Action Overlay */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <button 
              type="button"
              onClick={() => setIsFlipped(false)}
              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase font-bold tracking-wider active:scale-95"
            >
              <ArrowLeft size={12} /> RETURN
            </button>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Edit"
              >
                <Edit3 size={13} />
              </button>
              <button 
                type="button"
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-rose-500/80 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* BACK CONTENT */}
          <div className="space-y-2.5 my-auto overflow-y-auto custom-scrollbar max-h-[140px] pr-1 font-mono">
            {isCard ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400">CVV / CVC</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-bold">{showPass ? (item.password || '---') : '•••'}</span>
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-white">
                      {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    {item.password && (
                      <button type="button" onClick={() => onCopy(item.password || '', 'CVV')} className="text-slate-400 hover:text-white">
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400">CARD PIN</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-bold">{showPass ? (item.notes || '----') : '••••'}</span>
                    {item.notes && (
                      <button type="button" onClick={() => onCopy(item.notes || '', 'PIN')} className="text-slate-400 hover:text-white">
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400">CARD NUMBER</span>
                  <button type="button" onClick={() => onCopy(item.username || '', 'Card Number')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Copy size={11} /> COPY
                  </button>
                </div>
              </div>
            ) : item.category === 'Note' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Encrypted Content</span>
                  <button type="button" onClick={() => onCopy(item.notes || '', 'Note Content')} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1">
                    <Copy size={11} /> COPY ALL
                  </button>
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-xs text-slate-200 leading-relaxed max-h-[90px] overflow-y-auto custom-scrollbar select-text whitespace-pre-wrap">
                  {item.notes || <span className="text-slate-600">No content</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Username Row */}
                <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[8px] text-slate-500 uppercase block">Username / Account</span>
                    <span className="text-xs text-white truncate block select-all">{item.username || '-'}</span>
                  </div>
                  {item.username && (
                    <button type="button" onClick={() => onCopy(item.username || '', 'Username')} className="text-slate-400 hover:text-white p-1 rounded transition-colors" title="Copy Username">
                      <Copy size={13} />
                    </button>
                  )}
                </div>

                {/* Password Row */}
                <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[8px] text-slate-500 uppercase block">Password / Token</span>
                    <span className="text-xs text-white truncate block select-all">
                      {showPass ? (item.password || '---') : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-white p-1 rounded transition-colors" title={showPass ? 'Hide' : 'Show'}>
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {item.password && (
                      <button type="button" onClick={() => onCopy(item.password || '', 'Password')} className="text-slate-400 hover:text-white p-1 rounded transition-colors" title="Copy Password">
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {item.website && (
                  <a 
                    href={item.website.startsWith('http') ? item.website : `https://${item.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 pt-0.5"
                  >
                    <ExternalLink size={10} /> Open {hostname}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer Timestamp */}
          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <History size={10} /> {formatTimeAgo(item.updatedAt)}
            </span>
            <span className="text-slate-600">ID: {item.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
