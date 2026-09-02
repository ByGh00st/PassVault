import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VaultItem, AppState, EncryptedVault, UserProfile, ThemeConfig } from './types';
import * as CryptoService from './services/cryptoService';
import { 
  STORAGE_KEY, SETTINGS_KEY, PROFILE_KEY, FOLDERS_KEY, 
  SYS_RECOVERY_HASH, DEFAULT_FOLDERS, DEFAULT_THEME_CONFIG 
} from './utils/constants';
import { useToast } from './hooks/useToast';
import { useAutoLock } from './hooks/useAutoLock';

// Modular Components
import { SetupScreen } from './components/auth/SetupScreen';
import { UnlockScreen } from './components/auth/UnlockScreen';
import { ToastContainer } from './components/common/ToastContainer';
import { ResetConfirmModal } from './components/common/ResetConfirmModal';
import { RecordModal } from './components/vault/RecordModal';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import PasswordGenerator from './components/PasswordGenerator';
import SecurityAssistant from './components/SecurityAssistant';

export const App: React.FC = () => {
  // Core Application State
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [encryptedData, setEncryptedData] = useState<EncryptedVault | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ displayName: 'Ghost', avatarId: '1' });
  const [apiKey, setApiKey] = useState<string>('');
  const [isAuxMode, setIsAuxMode] = useState(false);

  // Folder & Customization State
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(15);
  const [customBackground, setCustomBackground] = useState<string | null>(null);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'generator' | 'settings'>('dashboard');
  const [dashboardView, setDashboardView] = useState<'folders' | 'list'>('folders');
  const [selectedCategory, setSelectedCategory] = useState<VaultItem['category'] | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);
  const [specialFilter, setSpecialFilter] = useState<'all' | 'weak' | 'reused' | 'old' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [newItemData, setNewItemData] = useState<Partial<VaultItem>>({ category: 'Login', folder: 'Personal' });
  const [formErrors, setFormErrors] = useState<{ name?: string; general?: string }>({});
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Custom Hooks
  const { toasts, showToast } = useToast();

  // Initialization: Load persisted configuration from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEncryptedData(JSON.parse(stored));
        setAppState(AppState.LOCKED);
      } catch {
        setAppState(AppState.SETUP);
      }
    } else {
      setAppState(AppState.SETUP);
    }

    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.autoLockMinutes) setAutoLockMinutes(parsed.autoLockMinutes);
        if (parsed.customBackground) setCustomBackground(parsed.customBackground);
        if (parsed.themeConfig) setThemeConfig(parsed.themeConfig);
      } catch {}
    }

    const storedProfile = localStorage.getItem(PROFILE_KEY);
    if (storedProfile) {
      try { setUserProfile(JSON.parse(storedProfile)); } catch {}
    }

    const storedFolders = localStorage.getItem(FOLDERS_KEY);
    if (storedFolders) {
      try { setFolders(JSON.parse(storedFolders)); } catch {}
    }
  }, []);

  // Theme & Dynamic Background Configuration
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
      root.style.backgroundColor = '#020617';
    }
  }, [customBackground, themeConfig]);

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+F, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (appState !== AppState.UNLOCKED) return;

      // Ctrl+N or Cmd+N: New Record Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenAddModal();
      }

      // Ctrl+F or Cmd+F: Focus Database Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveTab('dashboard');
        setDashboardView('list');
        setTimeout(() => {
          document.getElementById('vault-search-input')?.focus();
        }, 60);
      }

      // Escape: Close Active Modals
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsResetConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [appState]);

  // Settings & Profile Helpers
  const updateSettings = (newSettings: Partial<ThemeConfig>) => {
    const updated = { ...themeConfig, ...newSettings };
    setThemeConfig(updated);
    const settings = { autoLockMinutes, customBackground, themeConfig: updated };
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
    showToast('Codename profile updated', 'success');
  };

  // Folder Operations
  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (folders.includes(trimmed)) {
      showToast('Folder with this name already exists', 'warning');
      return;
    }
    const updated = [...folders, trimmed];
    setFolders(updated);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
    setNewFolderName('');
    showToast(`Folder "${trimmed}" created`, 'success');
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === 'Personal' || folderName === 'Other') {
      showToast('Default system folders cannot be removed', 'warning');
      return;
    }
    if (confirm(`Remove folder "${folderName}"? Items inside will be moved to "Personal".`)) {
      const updatedFolders = folders.filter((f) => f !== folderName);
      setFolders(updatedFolders);
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));

      const updatedItems = vaultItems.map((item) =>
        item.folder === folderName ? { ...item, folder: 'Personal', updatedAt: Date.now() } : item
      );
      if (masterPassword) {
        saveVault(updatedItems, masterPassword, apiKey, encryptedData?.salt);
      }
      showToast(`Folder "${folderName}" deleted`, 'info');
    }
  };

  // Image Upload Handlers
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Maximum image size is 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomBackground(base64);
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, customBackground: base64 }));
        showToast('Custom wallpaper applied', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearBackground = () => {
    setCustomBackground(null);
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, customBackground: null }));
    showToast('Wallpaper removed', 'info');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Maximum avatar size is 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateProfile({ ...userProfile, customAvatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Cryptographic Vault Persistence
  const saveVault = async (items: VaultItem[], password: string, currentApiKey: string, existingSalt?: string) => {
    if (isAuxMode) return;
    try {
      const encryptedVault = await CryptoService.encryptVault(items, currentApiKey, password, existingSalt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedVault));

      setEncryptedData(encryptedVault);
      setVaultItems(items);
      setApiKey(currentApiKey);
    } catch (e) {
      console.error(e);
      showToast('Write Error: Failed to encrypt and save data.', 'error');
    }
  };

  // Auth & Session Operations
  const handleSetup = async (password: string, panic?: string) => {
    setMasterPassword(password);
    localStorage.removeItem(SYS_RECOVERY_HASH);
    if (panic && panic.trim()) {
      const hash = await CryptoService.hashString(panic.trim());
      localStorage.setItem(SYS_RECOVERY_HASH, hash);
    }
    await saveVault([], password, '');
    setAppState(AppState.UNLOCKED);
    showToast('Vault created and encrypted with Ghost Protocol', 'success');
  };

  const handleUnlock = async (password: string): Promise<boolean> => {
    const storedRecoveryHash = localStorage.getItem(SYS_RECOVERY_HASH);
    if (storedRecoveryHash && password && password.trim()) {
      const isPanic = await CryptoService.verifyPanicCode(password.trim(), storedRecoveryHash);
      if (isPanic) {
        localStorage.clear();
        sessionStorage.clear();
        setEncryptedData(null);
        setVaultItems([]);
        setMasterPassword('');
        setApiKey('');
        setUserProfile({ displayName: 'Ghost', avatarId: '1' });
        setAppState(AppState.SETUP);
        showToast('PANIC OVERRIDE ENGAGED // ALL DATA WIPED', 'warning');
        return true;
      }
    }

    if (!encryptedData) return false;
    try {
      const { items, apiKey: decryptedApiKey } = await CryptoService.decryptVault(encryptedData, password);

      setMasterPassword(password);
      setVaultItems(items);
      setApiKey(decryptedApiKey);
      setAppState(AppState.UNLOCKED);
      showToast('Vault unlocked. Encryption keys derived.', 'success');
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = useCallback(() => {
    setMasterPassword('');
    setVaultItems([]);
    setApiKey('');
    setAppState(AppState.LOCKED);
    setDashboardView('folders');
    setIsAuxMode(false);
    setFilterFolder(null);
    setSelectedCategory(null);
    setSpecialFilter(null);
    setSearchQuery('');
    showToast('Vault locked and keys erased from memory', 'info');
  }, [showToast]);

  // Inactivity auto-lock hook
  useAutoLock(appState, autoLockMinutes, handleLogout);

  const performSystemWipe = () => {
    localStorage.clear();
    sessionStorage.clear();
    setEncryptedData(null);
    setVaultItems([]);
    setMasterPassword('');
    setApiKey('');
    setAppState(AppState.SETUP);
    setIsResetConfirmOpen(false);
    showToast('System database completely wiped. Setup screen initialized.', 'info');
  };

  // Archive Export & Import
  const handleExportVault = async (format: 'pvdb' | 'pv' = 'pvdb') => {
    if (isAuxMode) return;

    if (format === 'pvdb') {
      if (!masterPassword) {
        showToast('Unlock vault before binary export', 'warning');
        return;
      }
      try {
        const binaryData = await CryptoService.exportVaultToBinary(vaultItems, apiKey, masterPassword);
        const blob = new Blob([binaryData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `passvault_omega_${new Date().toISOString().slice(0, 10)}.pvdb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Pure Binary Vault (.pvdb) exported (Zero Base64 Overhead)', 'success');
      } catch (e: any) {
        showToast(`Export failed: ${e?.message || 'Crypto error'}`, 'error');
      }
      return;
    }

    // Legacy JSON export
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) {
      showToast('No vault data to export', 'warning');
      return;
    }

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passvault_legacy_backup_${new Date().toISOString().slice(0, 10)}.pv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Legacy JSON (.pv) backup exported', 'success');
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8 = new Uint8Array(arrayBuffer);

        // Check if file is Pure Binary .pvdb container
        if (CryptoService.isBinaryVault ? CryptoService.isBinaryVault(uint8) : (uint8[0] === 0x50 && uint8[1] === 0x56 && uint8[2] === 0x44 && uint8[3] === 0x42)) {
          const pwd = prompt('Enter the Master Key for this Pure Binary (.pvdb) vault:');
          if (!pwd) {
            showToast('Import cancelled: Master key required', 'warning');
            return;
          }

          const decrypted = await CryptoService.importVaultFromBinary(uint8, pwd);
          if (confirm('WARNING: Importing will replace your current vault records. Continue?')) {
            await saveVault(decrypted.items, pwd, decrypted.apiKey);
            setVaultItems(decrypted.items);
            setMasterPassword(pwd);
            setApiKey(decrypted.apiKey);
            setAppState(AppState.UNLOCKED);
            showToast(`Binary Vault imported successfully (${decrypted.items.length} records)`, 'success');
          }
          return;
        }

        // Legacy JSON parser
        const textDecoder = new TextDecoder();
        const content = textDecoder.decode(uint8);
        const parsed = JSON.parse(content);

        if (parsed.salt && (parsed.integrity || parsed.items || (parsed.iv && parsed.data))) {
          if (confirm('WARNING: Importing will replace your current vault. Continue?')) {
            localStorage.setItem(STORAGE_KEY, content);
            setEncryptedData(parsed);
            setVaultItems([]);
            setMasterPassword('');
            setApiKey('');
            setAppState(AppState.LOCKED);
            showToast('Legacy Vault imported. Please authenticate with its Master Key.', 'success');
          }
        } else {
          showToast('Import Failed: Invalid backup format', 'error');
        }
      } catch (err: any) {
        showToast(`Import Failed: ${err?.message || 'Corrupted file'}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Record Operations
  const handleCopyRecord = async (text: string, label: string) => {
    if (!text) {
      showToast(`No ${label} to copy`, 'warning');
      return;
    }
    const timeout = themeConfig.clipboardTimeout ?? 30;
    const success = await CryptoService.copyToClipboardWithAutoClear(text, timeout);
    if (success) {
      if (timeout > 0) {
        showToast(`${label} copied to clipboard (auto-clears in ${timeout}s)`, 'success');
      } else {
        showToast(`${label} copied to clipboard (auto-clear disabled)`, 'success');
      }
    } else {
      showToast(`Failed to copy ${label}`, 'error');
    }
  };

  const handleOpenAddModal = (categoryOverride?: VaultItem['category']) => {
    setEditingItem(null);
    setFormErrors({});
    setNewItemData({
      category: categoryOverride || selectedCategory || 'Login',
      folder: filterFolder || 'Personal',
      name: '',
      username: '',
      password: '',
      website: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: VaultItem) => {
    setEditingItem(item);
    setFormErrors({});
    setNewItemData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleSaveRecord = async () => {
    if (isAuxMode) {
      setIsAddModalOpen(false);
      return;
    }

    const errors: { name?: string; general?: string } = {};
    const name = (newItemData.name || '').trim();

    if (!name && newItemData.category !== 'Cookie') {
      errors.name = 'Please provide a name/title for this record';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fix required fields', 'error');
      return;
    }

    const now = Date.now();
    const item: VaultItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      name: name || (newItemData.category === 'Cookie' ? 'Session Cookie' : 'Untitled Record'),
      username: (newItemData.username || '').trim(),
      password: newItemData.password || '',
      website: (newItemData.website || '').trim(),
      notes: newItemData.notes || '',
      category: (newItemData.category as any) || 'Login',
      folder: newItemData.folder || 'Personal',
      color: newItemData.color,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
      history: editingItem ? editingItem.history : []
    };

    const newItems = editingItem
      ? vaultItems.map((i) => (i.id === item.id ? item : i))
      : [item, ...vaultItems];

    await saveVault(newItems, masterPassword, apiKey, encryptedData?.salt);

    showToast(editingItem ? 'Record updated and re-encrypted' : 'New record encrypted & stored', 'success');
    setEditingItem(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteRecord = async (id: string) => {
    if (isAuxMode) {
      setVaultItems((prev) => prev.filter((i) => i.id !== id));
      if (editingItem?.id === id) {
        setIsAddModalOpen(false);
        setEditingItem(null);
      }
      return;
    }
    if (confirm('Are you sure you want to permanently delete this item?')) {
      const newItems = vaultItems.filter((i) => i.id !== id);
      await saveVault(newItems, masterPassword, apiKey, encryptedData?.salt);
      if (editingItem?.id === id) {
        setIsAddModalOpen(false);
        setEditingItem(null);
      }
      showToast('Record deleted', 'info');
    }
  };

  // Quick Cookie Import
  const handleImportCookies = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast('Clipboard is empty', 'warning');
        return;
      }

      let imported = 0;
      const newItems: VaultItem[] = [];
      const now = Date.now();

      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          json.forEach((c: any) => {
            if (c.domain && c.name && c.value) {
              newItems.push({
                id: crypto.randomUUID(),
                category: 'Cookie',
                name: c.domain,
                username: c.name,
                password: c.value,
                notes: JSON.stringify(c, null, 2),
                folder: 'Other',
                createdAt: now,
                updatedAt: now
              });
              imported++;
            }
          });
        }
      } catch {
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (line.startsWith('#') || !line.trim()) return;
          const parts = line.split('\t');
          if (parts.length >= 6) {
            newItems.push({
              id: crypto.randomUUID(),
              category: 'Cookie',
              name: parts[0],
              username: parts[5],
              password: parts[6],
              notes: 'Imported Netscape cookie data',
              folder: 'Other',
              createdAt: now,
              updatedAt: now
            });
            imported++;
          }
        });
      }

      if (imported > 0) {
        const updatedVault = [...newItems, ...vaultItems];
        await saveVault(updatedVault, masterPassword, apiKey, encryptedData?.salt);
        showToast(`Successfully imported ${imported} cookies`, 'success');
      } else {
        showToast('No valid cookies found in clipboard', 'warning');
      }
    } catch {
      showToast('Clipboard access denied', 'error');
    }
  };

  // Quick generator for modal
  const handleQuickGenerate = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const basicSymbols = '!@#$%^&*()-_+=';
    const quotes = '\'"`';
    const extSymbols = '{}[]|;:,.<>?/~';
    const space = ' ';

    const fullPool = uppers + lowers + numbers + basicSymbols + quotes + extSymbols + space;
    const length = 20;
    const rands = new Uint32Array(length);
    window.crypto.getRandomValues(rands);

    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
      chars.push(fullPool[rands[i] % fullPool.length]);
    }

    const guaranteed = [uppers, lowers, numbers, basicSymbols, quotes, extSymbols];
    const posRands = new Uint32Array(guaranteed.length * 2);
    window.crypto.getRandomValues(posRands);

    guaranteed.forEach((pool, idx) => {
      const pos = posRands[idx * 2] % length;
      const charIdx = posRands[idx * 2 + 1] % pool.length;
      chars[pos] = pool[charIdx];
    });

    setNewItemData({ ...newItemData, password: chars.join('') });
    showToast('High-entropy key generated (with quotes & symbols)', 'info');
  };

  // Filtered items computation
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;

    const passwordCounts = new Map<string, number>();
    if (specialFilter === 'reused') {
      vaultItems.forEach((i) => {
        if (i.password) {
          passwordCounts.set(i.password, (passwordCounts.get(i.password) || 0) + 1);
        }
      });
    }

    return vaultItems.filter((item) => {
      let matchesSearch = true;
      if (query) {
        matchesSearch =
          (item.name || '').toLowerCase().includes(query) ||
          (item.username || '').toLowerCase().includes(query) ||
          (item.website || '').toLowerCase().includes(query) ||
          (item.notes || '').toLowerCase().includes(query);
      }

      const matchesFolder = filterFolder ? item.folder === filterFolder : true;
      const matchesCategory =
        dashboardView === 'list' && selectedCategory ? item.category === selectedCategory : true;

      let matchesSpecial = true;
      if (specialFilter === 'weak') {
        const p = item.password || '';
        matchesSpecial = p.length < 8 || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p);
      } else if (specialFilter === 'reused') {
        const p = item.password || '';
        matchesSpecial = (passwordCounts.get(p) || 0) > 1;
      } else if (specialFilter === 'old') {
        matchesSpecial = item.updatedAt < sixMonthsAgo;
      }

      return matchesSearch && matchesFolder && matchesCategory && matchesSpecial;
    });
  }, [vaultItems, searchQuery, filterFolder, dashboardView, selectedCategory, specialFilter]);

  // Auth Screen Views
  if (appState === AppState.SETUP) {
    return (
      <>
        <SetupScreen onSetup={handleSetup} />
        <ResetConfirmModal 
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={performSystemWipe}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  if (appState === AppState.LOCKED) {
    return (
      <>
        <UnlockScreen 
          onUnlock={handleUnlock} 
          onReset={() => setIsResetConfirmOpen(true)} 
        />
        <ResetConfirmModal 
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={performSystemWipe}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  const mainContainerStyle = {
    backgroundColor: `rgba(2, 6, 23, ${themeConfig.bgOpacity})`,
    backdropFilter: `blur(${themeConfig.blurAmount}px)`
  };

  return (
    <div className="flex h-screen text-slate-200 font-sans overflow-hidden select-none" style={mainContainerStyle}>
      
      {/* Dynamic Toast Feedback Overlay */}
      <ToastContainer toasts={toasts} />

      {/* Main Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onLogout={handleLogout}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setDashboardView('folders');
          setFilterFolder(null);
          setSpecialFilter(null);
        }}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <DashboardView 
            vaultItems={vaultItems}
            filteredItems={filteredItems}
            themeConfig={themeConfig}
            folders={folders}
            dashboardView={dashboardView}
            setDashboardView={setDashboardView}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filterFolder={filterFolder}
            setFilterFolder={setFilterFolder}
            specialFilter={specialFilter}
            setSpecialFilter={setSpecialFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            onAddFolder={handleAddFolder}
            onDeleteFolder={handleDeleteFolder}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteRecord={handleDeleteRecord}
            onCopyRecord={handleCopyRecord}
            onImportCookies={handleImportCookies}
          />
        )}

        {activeTab === 'security' && (
          <div className="flex-1 p-6 md:p-8 flex flex-col h-full relative z-10 animate-fade-in overflow-hidden">
            <SecurityAssistant 
              className="h-full" 
              userProfile={userProfile} 
              apiKey={apiKey} 
              items={vaultItems}
              themeConfig={themeConfig}
            />
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="flex-1 p-6 md:p-8 flex items-center justify-center relative z-10 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-xl">
              <PasswordGenerator 
                onToast={showToast}
                onSelect={(pwd) => {
                  handleOpenAddModal();
                  setNewItemData((prev) => ({ ...prev, password: pwd }));
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            userProfile={userProfile}
            updateProfile={updateProfile}
            handleAvatarUpload={handleAvatarUpload}
            autoLockMinutes={autoLockMinutes}
            handleAutoLockChange={handleAutoLockChange}
            themeConfig={themeConfig}
            updateSettings={updateSettings}
            customBackground={customBackground}
            handleBackgroundUpload={handleBackgroundUpload}
            onClearBackground={handleClearBackground}
            onExportVault={handleExportVault}
            handleImportVault={handleImportVault}
            onOpenResetModal={() => setIsResetConfirmOpen(true)}
          />
        )}
      </main>

      {/* Record Creation / Modification Modal */}
      <RecordModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingItem={editingItem}
        itemData={newItemData}
        setItemData={setNewItemData}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        folders={folders}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        onQuickGenerate={handleQuickGenerate}
      />

      {/* In-App System Purge Confirmation Dialog */}
      <ResetConfirmModal 
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={performSystemWipe}
      />

    </div>
  );
};

export default App;