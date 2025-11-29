export interface HistoryEntry {
  timestamp: number;
  action: 'created' | 'updated';
  changes?: string[];
}

export interface VaultItem {
  id: string;
  name: string;
  username: string; // Used for Card Number in 'Card' mode
  password?: string; // Used for PIN/CVV in 'Card' mode
  website?: string; // Used for Expiry in 'Card' mode
  notes?: string;   // Used for Cookie content or Notes
  category: 'Login' | 'Card' | 'Note' | 'Cookie'; // The "Type" of item
  folder?: string; // The "Category" (Work, Personal, etc.)
  color?: string; // For UI customization
  createdAt: number;
  updatedAt: number;
  history?: HistoryEntry[];
}

export interface EncryptedItem {
  id: string;
  category: string;
  folder?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  
  // Encrypted Fields (IV + Ciphertext)
  name: string;
  username: string;
  password?: string;
  website?: string;
  notes?: string;
  history?: string; 
}

export interface EncryptedVault {
  salt: string; // Base64
  
  // New Field-Level Encryption Structure
  integrity?: string; // Encrypted check string
  items?: EncryptedItem[];
  encryptedApiKey?: string;

  // Legacy Blob Support (Deprecated)
  iv?: string;   
  data?: string; 
}

export enum AppState {
  SETUP,    // First time user, setting master password
  LOCKED,   // User exists, needs to enter master password
  UNLOCKED  // Vault is open
}

export interface PasswordGeneratorOptions {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[]; // Added for Search Grounding
}

export interface UserProfile {
  displayName: string;
  avatarId: string; // Presets
  customAvatar?: string; // Base64 string for custom upload
}

export interface ThemeConfig {
    cardColor: string; // Hex or tailwind class
    chatColor: string;
    bgOpacity: number; // 0.1 to 1
    glowIntensity: number; // 0 to 20
    blurAmount: number; // px
}