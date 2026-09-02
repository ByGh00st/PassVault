import { Chrome, Github, Youtube, ShoppingBag, Twitter, Mail, Linkedin, Instagram } from 'lucide-react';
import { ThemeConfig } from '../types';

export const STORAGE_KEY = 'passvault_data';
export const SETTINGS_KEY = 'passvault_settings';
export const PROFILE_KEY = 'passvault_profile';
export const FOLDERS_KEY = 'passvault_folders';
export const SYS_RECOVERY_HASH = 'pv_sys_recovery_v1';

export const DEFAULT_FOLDERS = ['Personal', 'Work', 'Finance', 'Social', 'Dev', 'Other'];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  cardColor: '#1e293b',
  chatColor: '#6366f1',
  bgOpacity: 0.9,
  glowIntensity: 15,
  blurAmount: 10,
  cardOpacity: 0.65,
  cardBlur: 16,
  cardBorderOpacity: 0.25,
  glassPreset: 'custom',
  clipboardTimeout: 30
};

export const GLASS_PRESETS = [
  {
    id: 'holo',
    name: 'Holo Crystal',
    desc: 'Ultra transparent & radiant cyan glow',
    cardOpacity: 0.2,
    cardBlur: 24,
    cardBorderOpacity: 0.4,
    glowIntensity: 25,
    cardColor: '#0f172a'
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    desc: 'Deep tinted glass with vivid contrast',
    cardOpacity: 0.5,
    cardBlur: 16,
    cardBorderOpacity: 0.3,
    glowIntensity: 20,
    cardColor: '#1e1b4b'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Shield',
    desc: 'Opaque stealth finish with subtle edges',
    cardOpacity: 0.85,
    cardBlur: 8,
    cardBorderOpacity: 0.15,
    glowIntensity: 8,
    cardColor: '#09090b'
  },
  {
    id: 'ghost',
    name: 'Ghost Sheer',
    desc: 'Barely-there crystal membrane',
    cardOpacity: 0.1,
    cardBlur: 30,
    cardBorderOpacity: 0.5,
    glowIntensity: 30,
    cardColor: '#1e293b'
  }
];

export const SERVICE_PRESETS = [
  { id: 'google', name: 'Google', url: 'https://google.com', icon: Chrome, color: '#DB4437' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', icon: Github, color: '#f8fafc' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: Youtube, color: '#FF0000' },
  { id: 'amazon', name: 'Amazon', url: 'https://amazon.com', icon: ShoppingBag, color: '#FF9900' },
  { id: 'twitter', name: 'X / Twitter', url: 'https://x.com', icon: Twitter, color: '#38bdf8' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', icon: Mail, color: '#EA4335' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', icon: Linkedin, color: '#0A66C2' },
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', icon: Instagram, color: '#E1306C' },
];
