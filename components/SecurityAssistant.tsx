import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, Loader2, Terminal, Activity, Globe, ExternalLink } from 'lucide-react';
import { generateSecurityAdvice } from '../services/geminiService';
import { ChatMessage, UserProfile, VaultItem } from '../types';

interface SecurityAssistantProps {
  className?: string;
  userProfile: UserProfile;
  apiKey: string;
  items: VaultItem[];
  themeConfig?: any;
}

const getLocalStrengthScore = (password: string) => {
    let score = 0;
    if (password.length > 8) score += 1;
    if (password.length > 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

const getAvatarBg = (id: string) => {
    const AVATARS = [
        { id: '1', bg: 'bg-blue-500' },
        { id: '2', bg: 'bg-purple-500' },
        { id: '3', bg: 'bg-emerald-500' },
        { id: '4', bg: 'bg-orange-500' },
        { id: '5', bg: 'bg-pink-500' },
    ];
    return AVATARS.find(a => a.id === id)?.bg || 'bg-indigo-500';
}

// Robust Message Parser: Handles Markdown Links [Text](URL), Raw URLs https://..., and Bold **Text**
const renderMessageText = (text: string | undefined | null) => {
    // SECURITY FIX: Guard against undefined/null text which causes app crash
    if (!text) return null;

    // 1. Split by Markdown Links: [Title](URL)
    const parts = text.split(/(\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
        // Check if this part is a Markdown Link
        const markdownLinkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (markdownLinkMatch) {
            return (
                <a 
                    key={index} 
                    href={markdownLinkMatch[2]} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:text-cyan-200 underline underline-offset-4 decoration-cyan-500/50 inline-flex items-center gap-1 font-bold transition-colors mx-1 bg-cyan-500/10 px-1 rounded"
                >
                    {markdownLinkMatch[1]} <ExternalLink size={14} />
                </a>
            );
        }

        // If not a Markdown link, parse for Raw URLs and Bold text
        const subParts = part.split(/(https?:\/\/[^\s]+)/g);
        
        return (
            <span key={index}>
                {subParts.map((subPart, subIndex) => {
                    // Check if subPart is a Raw URL
                    if (subPart.match(/^https?:\/\/[^\s]+$/)) {
                         return (
                            <a 
                                key={`raw-${index}-${subIndex}`} 
                                href={subPart} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-400 hover:text-indigo-200 underline underline-offset-2 break-all inline-flex items-center gap-1"
                            >
                                {subPart.length > 30 ? subPart.substring(0, 30) + '...' : subPart} <ExternalLink size={12} />
                            </a>
                        );
                    }

                    // Handle Bold Text (**...**)
                    const boldParts = subPart.split(/(\*\*.*?\*\*)/g);
                    return (
                        <span key={`text-${index}-${subIndex}`}>
                            {boldParts.map((bPart, bIdx) => {
                                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                                    return <strong key={bIdx} className="text-emerald-400 font-bold tracking-wide">{bPart.slice(2, -2)}</strong>;
                                }
                                return bPart;
                            })}
                        </span>
                    );
                })}
            </span>
        );
    });
};

const SecurityAssistant: React.FC<SecurityAssistantProps> = ({ className, userProfile, apiKey, items, themeConfig }) => {
  const vaultContext = useMemo(() => {
    if (!items || items.length === 0) return "Vault is empty.";
    
    let weakItems: string[] = [];
    let oldItems: string[] = [];
    let reusedCount = 0;
    const passwordMap = new Map<string, number>();
    const now = Date.now();
    const SIX_MONTHS = 1000 * 60 * 60 * 24 * 180;

    items.forEach(item => {
        if(item.category !== 'Login' && item.category !== 'Card') return;
        const pwd = item.password || '';
        
        if (pwd && getLocalStrengthScore(pwd) < 3) weakItems.push(item.name);
        if ((now - item.updatedAt) > SIX_MONTHS) oldItems.push(item.name);
        if (pwd) passwordMap.set(pwd, (passwordMap.get(pwd) || 0) + 1);
    });

    passwordMap.forEach(count => { if (count > 1) reusedCount += count; });

    return `Vault Summary: Total: ${items.length}, Weak: ${weakItems.length}, Reused: ${reusedCount}, Old: ${oldItems.length}`;
  }, [items]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: apiKey 
        ? 'GHOST PROTOCOL INITIATED. Security AI online. Awaiting directive...' 
        : 'SYSTEM ALERT: Gemini API Key required for neural link.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await generateSecurityAdvice(messages, userMsg.text, apiKey, vaultContext);
      const botMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: result.text || "No data received.", // Fallback text
          sources: result.sources, 
          timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) { 
        console.error(error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Critical System Error: Connection terminated.", timestamp: Date.now() }]);
    } finally { 
        setIsLoading(false); 
    }
  };

  // Dynamic Styles from Theme
  const borderStyle = { borderColor: `${themeConfig?.chatColor || '#6366f1'}40` };

  return (
    <div className={`flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${className}`} style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(10px)', ...borderStyle, borderWidth: '1px' }}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/50 border border-white/10" style={borderStyle}>
                    <Terminal className="w-5 h-5" style={{ color: themeConfig?.chatColor || '#818cf8' }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-black"></div>
            </div>
            <div>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                    Ghost Protocol
                </h2>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Activity size={10} className="text-emerald-400" /> SYSTEM ONLINE
                </p>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex gap-4 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
            {/* Avatar Logic */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${msg.role === 'model' ? 'bg-black/60' : ''} ${msg.role === 'user' && !userProfile.customAvatar ? getAvatarBg(userProfile.avatarId) : ''}`} style={msg.role === 'model' ? borderStyle : {}}>
              {msg.role === 'model' ? (
                <Bot size={16} style={{ color: themeConfig?.chatColor || '#818cf8' }} />
              ) : (
                userProfile.customAvatar ? (
                    <img src={userProfile.customAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-white text-xs font-bold">{userProfile.displayName.charAt(0).toUpperCase()}</span>
                )
              )}
            </div>
            
            <div className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                    className={`p-6 text-base font-sans leading-8 shadow-lg relative ${
                        msg.role === 'model' 
                        ? 'bg-black/40 text-slate-200 rounded-tr-xl rounded-br-xl rounded-bl-xl border-l-2 whitespace-pre-wrap' 
                        : 'bg-white/10 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl whitespace-pre-wrap'
                    }`}
                    style={msg.role === 'model' ? { borderLeftColor: themeConfig?.chatColor || '#818cf8' } : {}}
                >
                    {renderMessageText(msg.text)}
                </div>
                
                {/* Search Sources Display */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 ml-1 w-full animate-fade-in">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Globe size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Verified Sources</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {msg.sources.slice(0, 3).map((source, sIdx) => (
                                <a 
                                    key={sIdx} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-md flex items-center gap-2 text-indigo-300 hover:text-white transition-all max-w-[200px] truncate"
                                >
                                    <span className="truncate max-w-[150px]">{source.title}</span>
                                    <ExternalLink size={10} className="shrink-0 opacity-50" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <span className="text-[10px] text-slate-600 mt-2 uppercase tracking-wider font-mono">
                   {msg.role === 'user' ? userProfile.displayName : 'AI_CORE'} • T-{new Date(msg.timestamp).getSeconds().toString().padStart(2,'0')}
                </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
             <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="animate-spin text-slate-400" />
            </div>
            <div className="bg-black/40 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl border-l-2 border-slate-600 flex items-center gap-3">
               <span className="text-xs text-slate-500 font-mono tracking-widest">ANALYZING SECURITY PROTOCOLS...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-black/20 border-t border-white/5 backdrop-blur-md">
        <div className="relative flex items-center gap-2">
             <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={apiKey ? "Ask Security AI or Search Web..." : "API KEY REQUIRED"}
                disabled={isLoading || !apiKey}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-slate-200 text-sm font-sans focus:outline-none transition-all placeholder-slate-600 focus:bg-black/60"
                style={{ 
                    boxShadow: input ? `0 0 15px -5px ${themeConfig?.chatColor || '#6366f1'}20` : 'none',
                    borderColor: input ? `${themeConfig?.chatColor || '#6366f1'}60` : 'rgba(255,255,255,0.1)'
                }}
            />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !apiKey}
            className="absolute right-2.5 p-2.5 rounded-lg transition-all hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Send size={18} className="text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityAssistant;