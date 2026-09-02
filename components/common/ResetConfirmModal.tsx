import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-rose-950/50 animate-scale-in text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-base font-bold text-white font-mono tracking-widest uppercase">
            CONFIRM SYSTEM PURGE
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-2 leading-relaxed">
            CRITICAL: This action will permanently erase all encrypted vault records, local salts, and master configuration keys. The system will reset to initial setup.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 py-3.5 rounded-xl font-mono text-xs transition-all active:scale-95"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl font-mono text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            CONFIRM & WIPE
          </button>
        </div>
      </div>
    </div>
  );
};
