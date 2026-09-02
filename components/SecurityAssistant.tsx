import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Terminal, ShieldAlert, WifiOff, Sparkles, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { ChatMessage, UserProfile, VaultItem } from '../types';

interface SecurityAssistantProps {
  className?: string;
  userProfile: UserProfile;
  apiKey?: string;
  items: VaultItem[];
  themeConfig?: any;
}

// --- LOCAL AIR-GAPPED HEURISTIC ENGINE ---
const analyzeVaultLocal = (items: VaultItem[], query: string): string => {
  const q = query.toLowerCase().trim();

  // 1. Weak Passwords Check
  if (q.includes('weak') || q.includes('zayıf') || q.includes('güçsüz') || q.includes('kolay')) {
    const weakItems = items.filter((i) => {
      const p = i.password || '';
      return p.length < 8 || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p);
    });

    if (weakItems.length === 0) {
      return '### 🛡️ CRYPTO-AUDIT: OPTIMAL\n\nNo vulnerable or low-entropy credentials found. All current keys meet baseline defense parameters.';
    }

    return `### ⚠️ VULNERABILITY ALERT: WEAK CREDENTIALS DETECTED\n\nThe following ${weakItems.length} records fail minimum entropy thresholds (length < 8 or missing numeric/special characters):\n\n${weakItems
      .map((item) => `- **${item.name}** [${item.category}] — *Username: \`${item.username || 'N/A'}\`*`)
      .join('\n')}\n\n**Action Plan:** Rotate these credentials immediately using the **Generator** module.`;
  }

  // 2. Credential Reuse Analysis
  if (q.includes('reuse') || q.includes('tekrar') || q.includes('aynı') || q.includes('duplicate')) {
    const pwdMap = new Map<string, string[]>();
    items.forEach((i) => {
      if (!i.password) return;
      const existing = pwdMap.get(i.password) || [];
      pwdMap.set(i.password, [...existing, i.name]);
    });

    const reused = Array.from(pwdMap.entries()).filter(([_, names]) => names.length > 1);

    if (reused.length === 0) {
      return '### 🔒 PROPAGATION DEFENSE: SECURE\n\nZero credential reuse detected across all records. Each asset operates with an isolated cryptographic key.';
    }

    return `### 🚨 CRITICAL THREAT: CREDENTIAL REUSE DETECTED\n\nIdentical passwords were found across multiple independent services:\n\n${reused
      .map(([_, names], idx) => `**Group ${idx + 1}:** ${names.map((n) => `\`${n}\``).join(' ↔ ')}`)
      .join('\n')}\n\n**Risk Vector:** Compromise of one service exposes all linked targets. Immediate key differentiation required.`;
  }

  // 3. Stale / Expired Credentials
  if (q.includes('old') || q.includes('eski') || q.includes('stale') || q.includes('tarih') || q.includes('yaş')) {
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const oldItems = items.filter((i) => i.updatedAt < sixMonthsAgo);

    if (oldItems.length === 0) {
      return '### ⏱️ CREDENTIAL AGING: CURRENT\n\nAll credentials in this sector were updated within the last 180 days.';
    }

    return `### ⏱️ AGING ASSETS: ${oldItems.length} RECORDS > 6 MONTHS OLD\n\nPeriodic rotation prevents credential degradation:\n\n${oldItems
      .map((i) => `- **${i.name}** — *Last updated: ${new Date(i.updatedAt).toLocaleDateString()}*`)
      .join('\n')}`;
  }

  // 4. General Status / Executive Briefing
  if (q.includes('status') || q.includes('durum') || q.includes('rapor') || q.includes('audit') || q.includes('health')) {
    const total = items.length;
    const logins = items.filter((i) => i.category === 'Login').length;
    const cards = items.filter((i) => i.category === 'Card').length;
    const notes = items.filter((i) => i.category === 'Note').length;
    const cookies = items.filter((i) => i.category === 'Cookie').length;

    return `### 📊 EXECUTIVE SECURITY STATUS REPORT\n\n- **Vault Total Records:** \`${total}\`\n  - Logins: \`${logins}\` | Cards: \`${cards}\` | Notes: \`${notes}\` | Cookies: \`${cookies}\`\n- **Cryptographic Mode:** \`AES-256-GCM + PBKDF2 (100K iter)\`\n- **Network Confinement:** \`AIR-GAPPED (100% Offline)\`\n- **Threat Level:** \`${items.length === 0 ? 'NOMINAL' : 'MONITORED'}\`\n\n*Heuristic sentinel active. Ready for analytical directives.*`;
  }

  // Default response
  return `### 🛰️ SENTINEL LOCAL HEURISTICS\n\nI am running in **air-gapped local mode** without external network telemetry.\n\nYou can issue commands such as:\n- \`"Scan for weak passwords"\`\n- \`"Check for reused passwords"\`\n- \`"List stale credentials"\`\n- \`"Generate status report"\``;
};

const SecurityAssistant: React.FC<SecurityAssistantProps> = ({ className, userProfile, items, themeConfig }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: '### 🛡️ AIR-GAP SENTINEL ACTIVE\n\nExternal network traffic severed. Real-time local heuristic monitoring engaged. Zero telemetry leaves this system.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const responseText = analyzeVaultLocal(items, textToSend);
      const botMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
    }, 450);
  };

  const quickChips = [
    'Scan for weak passwords',
    'Check for reused passwords',
    'List stale credentials',
    'Generate status report',
  ];

  return (
    <div
      className={`flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border border-white/10 bg-slate-900/80 backdrop-blur-2xl ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldAlert size={20} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-black"></div>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono flex items-center gap-2">
              SENTINEL CORE // LOCAL AI
            </h2>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <WifiOff size={10} className="text-emerald-400" /> AIR-GAPPED &bull; ZERO TELEMETRY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ACTIVE
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${
                msg.role === 'model' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-600 text-white'
              }`}
            >
              {msg.role === 'model' ? (
                <Bot size={16} />
              ) : userProfile.customAvatar ? (
                <img src={userProfile.customAvatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold font-mono">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-xs font-mono leading-relaxed shadow-lg ${
                  msg.role === 'model'
                    ? 'bg-black/50 text-slate-200 border border-white/5 rounded-tl-sm'
                    : 'bg-indigo-600 text-white rounded-tr-sm'
                }`}
              >
                {msg.text.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) {
                    return (
                      <h4 key={i} className="text-sm font-bold text-white font-mono mt-1 mb-2">
                        {line.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={i} className="ml-4 list-disc text-slate-300">
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  return (
                    <p key={i} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  );
                })}
              </div>

              <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                {msg.role === 'user' ? userProfile.displayName : 'SENTINEL'} &bull;{' '}
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="animate-spin text-indigo-400" />
            </div>
            <div className="bg-black/40 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono tracking-wider">ANALYZING LOCAL VAULT ENTROPY...</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quick Directives */}
      <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="text-[10px] font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles size={10} className="text-indigo-400" />
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type directive (e.g. 'Audit weak passwords')..."
            disabled={isLoading}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white text-xs font-mono focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition-all active:scale-95 shadow-md shadow-indigo-600/20"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityAssistant;