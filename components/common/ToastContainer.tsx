import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastNotification } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastNotification[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm select-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-slide-up ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' :
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' :
            toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/40 text-amber-200' :
            'bg-slate-900/90 border-indigo-500/40 text-indigo-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle size={16} className="text-amber-400 shrink-0" />}
          {toast.type === 'info' && <Info size={16} className="text-indigo-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
