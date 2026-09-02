import React from 'react';
import { 
  Monitor, CreditCard, StickyNote, Cookie, Sparkles, Trash2 
} from 'lucide-react';
import { VaultItem } from '../../types';
import { Modal } from '../common/Modal';
import { SERVICE_PRESETS } from '../../utils/constants';
import { formatCardNumber, formatExpiry } from '../../utils/formatters';
import StrengthMeter from '../StrengthMeter';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: VaultItem | null;
  itemData: Partial<VaultItem>;
  setItemData: React.Dispatch<React.SetStateAction<Partial<VaultItem>>>;
  formErrors: { name?: string; general?: string };
  setFormErrors: React.Dispatch<React.SetStateAction<{ name?: string; general?: string }>>;
  folders: string[];
  onSave: () => void;
  onDelete: (id: string) => void;
  onQuickGenerate: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  itemData,
  setItemData,
  formErrors,
  setFormErrors,
  folders,
  onSave,
  onDelete,
  onQuickGenerate
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingItem ? 'EDIT RECORD // CIPHER UPDATE' : `NEW RECORD // ${itemData.category?.toUpperCase()}`}
    >
      <div className="space-y-5 font-mono select-none">
        
        {/* Category Tabs */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1.5 font-bold">Classification</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'Login', label: 'Login', icon: Monitor },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'Note', label: 'Note', icon: StickyNote },
              { id: 'Cookie', label: 'Cookie', icon: Cookie },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setItemData({ ...itemData, category: cat.id as any });
                  setFormErrors({});
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  itemData.category === cat.id 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                    : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                <cat.icon size={16} />
                <span className="text-[10px] font-bold uppercase">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Service Presets (Only for Logins) */}
        {itemData.category === 'Login' && (
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1.5 font-bold">Quick Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setItemData({
                      ...itemData,
                      name: preset.name,
                      website: preset.url,
                    });
                    setFormErrors({});
                  }}
                  className="p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 flex items-center gap-2 group transition-all text-left"
                >
                  <preset.icon size={16} style={{ color: preset.color }} className="shrink-0" />
                  <span className="text-[10px] text-slate-300 group-hover:text-white truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Inputs */}
        {itemData.category === 'Login' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Service Name *</label>
              <input 
                type="text" 
                value={itemData.name || ''} 
                onChange={(e) => {
                  setItemData({ ...itemData, name: e.target.value });
                  setFormErrors({ ...formErrors, name: undefined });
                }}
                placeholder="e.g. Netflix, GitHub, ProtonMail"
                className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-700 ${
                  formErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus:border-indigo-500'
                }`}
              />
              {formErrors.name && <span className="text-[10px] text-rose-400 mt-1 block">{formErrors.name}</span>}
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Username / Account</label>
              <input 
                type="text" 
                value={itemData.username || ''} 
                onChange={(e) => setItemData({ ...itemData, username: e.target.value })}
                placeholder="e.g. user@example.com"
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Password / Key</label>
                <button 
                  type="button" 
                  onClick={onQuickGenerate} 
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles size={11} /> Generate
                </button>
              </div>
              <input 
                type="text" 
                value={itemData.password || ''} 
                onChange={(e) => setItemData({ ...itemData, password: e.target.value })}
                placeholder="Password or token"
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-700 font-mono"
              />
              {itemData.password && <StrengthMeter password={itemData.password} />}
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Website URL (Optional)</label>
              <input 
                type="text" 
                value={itemData.website || ''} 
                onChange={(e) => setItemData({ ...itemData, website: e.target.value })}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-700 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Notes (Optional)</label>
              <textarea 
                value={itemData.notes || ''} 
                onChange={(e) => setItemData({ ...itemData, notes: e.target.value })}
                placeholder="Recovery keys, security questions..."
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-700 min-h-[60px] resize-none"
              />
            </div>
          </div>
        )}

        {itemData.category === 'Card' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Card Holder / Bank Name *</label>
              <input 
                type="text" 
                value={itemData.name || ''} 
                onChange={(e) => {
                  setItemData({ ...itemData, name: e.target.value });
                  setFormErrors({ ...formErrors, name: undefined });
                }}
                placeholder="e.g. Chase Sapphire / John Ghost"
                className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all ${
                  formErrors.name ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">16-Digit Card Number</label>
              <input 
                type="text" 
                maxLength={19}
                value={itemData.username || ''} 
                onChange={(e) => setItemData({ ...itemData, username: formatCardNumber(e.target.value) })}
                placeholder="0000 0000 0000 0000"
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-widest outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Expiry (MM/YY)</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={itemData.website || ''} 
                  onChange={(e) => setItemData({ ...itemData, website: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">CVV / CVC</label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={itemData.password || ''} 
                  onChange={(e) => setItemData({ ...itemData, password: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-bold">Card PIN (Optional)</label>
              <input 
                type="password" 
                maxLength={6}
                value={itemData.notes || ''} 
                onChange={(e) => setItemData({ ...itemData, notes: e.target.value.replace(/\D/g, '') })}
                placeholder="••••"
                className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none text-center"
              />
            </div>
          </div>
        )}

        {itemData.category === 'Note' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] text-amber-400 uppercase block mb-1 font-bold">Note Title *</label>
              <input 
                type="text" 
                value={itemData.name || ''} 
                onChange={(e) => {
                  setItemData({ ...itemData, name: e.target.value });
                  setFormErrors({ ...formErrors, name: undefined });
                }}
                placeholder="e.g. WiFi Passwords, Backup Mnemonic, Server SSH"
                className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs text-amber-200 outline-none ${
                  formErrors.name ? 'border-rose-500' : 'border-white/10 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] text-amber-400 uppercase block mb-1 font-bold">Encrypted Content</label>
              <textarea 
                value={itemData.notes || ''} 
                onChange={(e) => setItemData({ ...itemData, notes: e.target.value })}
                placeholder="Enter sensitive multi-line content..."
                className="w-full bg-black/50 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-3 text-xs text-slate-200 font-mono outline-none min-h-[160px] resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {itemData.category === 'Cookie' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] text-orange-400 uppercase block mb-1 font-bold">Domain Name *</label>
              <input 
                type="text" 
                value={itemData.name || ''} 
                onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                placeholder="e.g. .google.com or github.com"
                className="w-full bg-black/50 border border-white/10 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-orange-400 uppercase block mb-1 font-bold">Cookie / Key Name</label>
              <input 
                type="text" 
                value={itemData.username || ''} 
                onChange={(e) => setItemData({ ...itemData, username: e.target.value })}
                placeholder="e.g. session_token"
                className="w-full bg-black/50 border border-white/10 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-orange-400 uppercase block mb-1 font-bold">Cookie Value</label>
              <textarea 
                value={itemData.password || ''} 
                onChange={(e) => setItemData({ ...itemData, password: e.target.value })}
                placeholder="Paste raw cookie string or value..."
                className="w-full bg-black/50 border border-white/10 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Folder Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1.5 font-bold">Assigned Folder</label>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {folders.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setItemData({ ...itemData, folder: f })}
                className={`px-3 py-1.5 rounded-lg text-[10px] border whitespace-nowrap transition-all ${
                  itemData.folder === f 
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold' 
                    : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {editingItem && (
            <button 
              type="button"
              onClick={() => onDelete(editingItem.id)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-3 rounded-xl transition-all active:scale-95"
              title="Delete Record"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button 
            type="button"
            onClick={onSave} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-indigo-600/25 transition-all active:scale-[0.98] text-xs tracking-widest font-mono"
          >
            {editingItem ? 'UPDATE & ENCRYPT' : 'ENCRYPT & SAVE'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
