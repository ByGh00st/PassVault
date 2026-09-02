import React from 'react';
import { 
  Monitor, CreditCard, StickyNote, Cookie, ShieldCheck, FolderOpen, 
  FolderPlus, Plus, X, Search, ChevronRight, Zap, ArrowLeft 
} from 'lucide-react';
import { VaultItem, ThemeConfig } from '../../types';
import { VaultCard } from '../vault/VaultCard';
import VaultHealth from '../VaultHealth';

interface DashboardViewProps {
  vaultItems: VaultItem[];
  filteredItems: VaultItem[];
  themeConfig: ThemeConfig;
  folders: string[];
  dashboardView: 'folders' | 'list';
  setDashboardView: (view: 'folders' | 'list') => void;
  selectedCategory: VaultItem['category'] | null;
  setSelectedCategory: (cat: VaultItem['category'] | null) => void;
  filterFolder: string | null;
  setFilterFolder: (folder: string | null) => void;
  specialFilter: 'all' | 'weak' | 'reused' | 'old' | null;
  setSpecialFilter: (filter: 'all' | 'weak' | 'reused' | 'old' | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onAddFolder: () => void;
  onDeleteFolder: (name: string) => void;
  onOpenAddModal: (cat?: VaultItem['category']) => void;
  onOpenEditModal: (item: VaultItem) => void;
  onDeleteRecord: (id: string) => void;
  onCopyRecord: (text: string, label: string) => void;
  onImportCookies: () => void;
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  vaultItems,
  filteredItems,
  themeConfig,
  folders,
  dashboardView,
  setDashboardView,
  selectedCategory,
  setSelectedCategory,
  filterFolder,
  setFilterFolder,
  specialFilter,
  setSpecialFilter,
  searchQuery,
  setSearchQuery,
  newFolderName,
  setNewFolderName,
  onAddFolder,
  onDeleteFolder,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteRecord,
  onCopyRecord,
  onImportCookies
}) => {
  const cardOpacity = themeConfig.cardOpacity ?? 0.65;
  const cardBlur = themeConfig.cardBlur ?? 16;
  const cardBorderOpacity = themeConfig.cardBorderOpacity ?? 0.25;
  const glowRadius = themeConfig.glowIntensity ?? 15;

  const dynamicCardStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(themeConfig.cardColor || '#1e293b', cardOpacity),
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
    border: `1px solid rgba(255, 255, 255, ${cardBorderOpacity})`,
    boxShadow: `0 8px 30px -10px rgba(0,0,0,0.5), 0 0 ${glowRadius}px -8px rgba(99, 102, 241, 0.2)`,
  };
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10 animate-fade-in select-none font-mono">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {dashboardView === 'list' 
              ? (specialFilter 
                  ? `${specialFilter.toUpperCase()} ENTRIES` 
                  : (filterFolder ? `${filterFolder.toUpperCase()} FOLDER` : (selectedCategory ? `${selectedCategory.toUpperCase()}S` : 'ALL ITEMS')))
              : 'COMMAND CENTER'
            }
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {dashboardView === 'list' 
              ? `// ACCESSING ${filteredItems.length} SECURE RECORDS` 
              : '// SELECT DATA CLASSIFICATION'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dashboardView === 'list' && selectedCategory === 'Cookie' && (
            <button 
              type="button"
              onClick={onImportCookies} 
              className="flex items-center gap-2 text-amber-400 hover:text-white text-xs bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl transition-all hover:bg-amber-500/20 active:scale-95"
            >
              <Zap size={14} /> IMPORT FROM CLIPBOARD
            </button>
          )}
          
          {dashboardView === 'list' && (
            <button 
              type="button"
              onClick={() => { 
                setDashboardView('folders'); 
                setSelectedCategory(null); 
                setFilterFolder(null); 
                setSpecialFilter(null);
                setSearchQuery(''); 
              }} 
              className="flex items-center gap-2 text-slate-300 hover:text-white text-xs bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl transition-all hover:bg-white/10 active:scale-95"
            >
              <ArrowLeft size={14} /> CATEGORIES
            </button>
          )}

          <button 
            type="button"
            onClick={() => onOpenAddModal()} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 shrink-0 active:scale-95"
          >
            <Plus size={15} /> NEW ENTRY
          </button>
        </div>
      </header>

      {/* FOLDERS OVERVIEW VIEW */}
      {dashboardView === 'folders' && (
        <div className="space-y-8 animate-scale-in">
          {/* Health Overview */}
          <VaultHealth 
            items={vaultItems} 
            onFilterClick={(type) => {
              setSpecialFilter(type);
              setDashboardView('list');
            }} 
          />

          {/* Primary Category Cards */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-400" /> DATA CLASSIFICATIONS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'Login', icon: Monitor, label: 'Logins', desc: 'Accounts & Keys', color: 'text-cyan-400', border: 'border-cyan-500/20' },
                { id: 'Card', icon: CreditCard, label: 'Cards', desc: 'Financial Records', color: 'text-purple-400', border: 'border-purple-500/20' },
                { id: 'Note', icon: StickyNote, label: 'Notes', desc: 'Encrypted Memos', color: 'text-yellow-400', border: 'border-yellow-500/20' },
                { id: 'Cookie', icon: Cookie, label: 'Cookies', desc: 'Session Data', color: 'text-orange-400', border: 'border-orange-500/20' },
              ].map(cat => (
                <button 
                  key={cat.id}
                  type="button"
                  onClick={() => { 
                    setSelectedCategory(cat.id as any); 
                    setDashboardView('list'); 
                  }}
                  className={`relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300 group text-left shadow-xl`}
                  style={dynamicCardStyle}
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-black/40 border border-white/10 ${cat.color}`}>
                      <cat.icon size={22} />
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {vaultItems.filter(i => i.category === cat.id).length}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-bold text-white tracking-wide">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{cat.desc}</div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center w-full text-xs text-indigo-400 group-hover:text-indigo-300">
                    <span>OPEN SECTOR</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Folders Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FolderOpen size={14} className="text-indigo-400" /> CUSTOM FOLDERS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map(folder => (
                <div 
                  key={folder} 
                  onClick={() => { 
                    setFilterFolder(folder); 
                    setDashboardView('list'); 
                  }}
                  className="rounded-2xl p-4 flex flex-col justify-between hover:scale-105 transition-all group cursor-pointer active:scale-95 shadow-lg relative"
                  style={dynamicCardStyle}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FolderPlus size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    {folder !== 'Personal' && folder !== 'Other' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder);
                        }}
                        className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                        title="Delete Folder"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white truncate">{folder}</span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {vaultItems.filter(i => i.folder === folder).length} items
                  </span>
                </div>
              ))}

              {/* Add Folder Box */}
              <div className="bg-black/40 border border-dashed border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddFolder()}
                  placeholder="New folder..."
                  className="bg-transparent border-none outline-none text-white text-xs placeholder:text-slate-600 w-full mb-2"
                />
                <button 
                  type="button"
                  onClick={onAddFolder}
                  className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] py-1.5 rounded-lg border border-indigo-500/30 flex items-center justify-center gap-1 transition-all"
                >
                  <Plus size={12} /> ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIST / GRID VIEW */}
      {dashboardView === 'list' && (
        <div className="space-y-6 animate-slide-up">
          
          {/* Search & Action Bar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-3 py-1 shadow-inner focus-within:border-indigo-500/50 transition-colors">
                <Search className="text-slate-500" size={16} />
                <input 
                  id="vault-search-input"
                  type="text" 
                  placeholder="SEARCH DATABASE (NAME, USERNAME, URL)... (Ctrl+F)"
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-600 text-xs py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Folder Filter */}
              <div className="relative min-w-[160px]">
                <select
                  value={filterFolder || ''}
                  onChange={(e) => setFilterFolder(e.target.value || null)}
                  className="w-full h-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-8 py-2.5 text-white text-xs appearance-none focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">ALL FOLDERS</option>
                  {folders.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
                <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
              </div>
            </div>

            {/* Active Filter Badges */}
            {(selectedCategory || filterFolder || searchQuery || specialFilter) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
                <span className="text-[10px] text-slate-500 uppercase">Filters:</span>
                
                {selectedCategory && (
                  <button 
                    type="button"
                    onClick={() => setSelectedCategory(null)} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] hover:bg-indigo-500/20 transition-colors"
                  >
                    <span>TYPE: {selectedCategory.toUpperCase()}</span>
                    <X size={11} />
                  </button>
                )}

                {filterFolder && (
                  <button 
                    type="button"
                    onClick={() => setFilterFolder(null)} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] hover:bg-emerald-500/20 transition-colors"
                  >
                    <span>FOLDER: {filterFolder.toUpperCase()}</span>
                    <X size={11} />
                  </button>
                )}

                {specialFilter && (
                  <button 
                    type="button"
                    onClick={() => setSpecialFilter(null)} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] hover:bg-rose-500/20 transition-colors"
                  >
                    <span>DEFENSE FILTER: {specialFilter.toUpperCase()}</span>
                    <X size={11} />
                  </button>
                )}

                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] hover:bg-amber-500/20 transition-colors"
                  >
                    <span>QUERY: "{searchQuery}"</span>
                    <X size={11} />
                  </button>
                )}
                
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null); 
                    setFilterFolder(null); 
                    setSpecialFilter(null);
                    setSearchQuery('');
                  }} 
                  className="text-[10px] text-slate-500 hover:text-white underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* 3D CARDS GRID */}
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center my-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-bold text-white">NO RECORDS FOUND</h4>
              <p className="text-xs text-slate-500 mt-1">No items match the current search or classification filters.</p>
              <button 
                type="button"
                onClick={() => onOpenAddModal()} 
                className="mt-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Create Record
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {filteredItems.map((item) => (
                <VaultCard 
                  key={item.id}
                  item={item} 
                  themeConfig={themeConfig}
                  onEdit={onOpenEditModal}
                  onDelete={onDeleteRecord}
                  onCopy={onCopyRecord}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
