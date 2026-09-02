import { VaultItem, EncryptedVault, EncryptedItem } from '../types';
import { packBinaryVault, unpackBinaryVault, isBinaryVault } from '../utils/binaryVault';

export { packBinaryVault, unpackBinaryVault, isBinaryVault };

// Security Constants
const INTEGRITY_CHECK_VALUE = "PASSVAULT_INTEGRITY_OK";
const PBKDF2_ITERATIONS = 600000; // OWASP 2025 Standard
const AES_KEY_LENGTH = 256;

// --- CRYO-LOCK SECURITY MODULE ---
const LOCK_KEY = 'pv_cryo_state';
const MAX_ATTEMPTS_TIER_1 = 3;
const MAX_ATTEMPTS_TIER_2 = 5;
const MAX_ATTEMPTS_PERMANENT = 10;

interface LockState {
  attempts: number;
  lockUntil: number | null; // Timestamp
  permanentLock: boolean;
}

const getLockState = (): LockState => {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return { attempts: 0, lockUntil: null, permanentLock: false };
    return JSON.parse(window.atob(raw));
  } catch {
    return { attempts: 0, lockUntil: null, permanentLock: false };
  }
};

const saveLockState = (state: LockState) => {
  localStorage.setItem(LOCK_KEY, window.btoa(JSON.stringify(state)));
};

export const checkLockout = (): { isLocked: boolean; remainingSeconds: number; permanent: boolean } => {
  const state = getLockState();

  if (state.permanentLock) return { isLocked: true, remainingSeconds: 888888, permanent: true };

  if (state.lockUntil) {
    const now = Date.now();
    if (now < state.lockUntil) {
      return { isLocked: true, remainingSeconds: Math.ceil((state.lockUntil - now) / 1000), permanent: false };
    }
  }

  return { isLocked: false, remainingSeconds: 0, permanent: false };
};

const registerFailure = () => {
  const state = getLockState();
  state.attempts += 1;

  if (state.attempts >= MAX_ATTEMPTS_PERMANENT) {
    state.permanentLock = true;
  } else if (state.attempts >= MAX_ATTEMPTS_TIER_2) {
    state.lockUntil = Date.now() + (30 * 60 * 1000); // 30 mins
  } else if (state.attempts >= MAX_ATTEMPTS_TIER_1) {
    state.lockUntil = Date.now() + (5 * 60 * 1000); // 5 mins
  }

  saveLockState(state);
  return state;
};

const registerSuccess = () => {
  localStorage.removeItem(LOCK_KEY);
};

// --- BASE64 & BUFFER UTILITIES ---

const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// --- CRYPTOGRAPHIC ENGINE (HIGH EFFICIENCY AES-GCM + PBKDF2) ---

/**
 * Derives a CryptoKey from a password and salt using PBKDF2-HMAC-SHA256
 */
const deriveMasterKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a string using AES-GCM with a freshly generated 12-byte IV
 */
const encryptField = async (text: string, key: CryptoKey): Promise<string> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encodedData = enc.encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any
    },
    key,
    encodedData
  );

  return `${bufferToBase64(iv)}:${bufferToBase64(ciphertext)}`;
};

/**
 * Decrypts a packed string formatted as IV:Ciphertext using the master key
 */
const decryptField = async (packed: string, key: CryptoKey): Promise<string> => {
  const parts = packed.split(':');
  
  // Format 1: IV(Base64):Cipher(Base64)
  if (parts.length === 2) {
    const iv = base64ToBuffer(parts[0]);
    const ciphertext = base64ToBuffer(parts[1]);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any
      },
      key,
      ciphertext as any
    );

    return new TextDecoder().decode(decrypted);
  }

  // Format 2: Salt(B64):Nonce(B64):Cipher(B64) (Legacy Rust format)
  if (parts.length === 3) {
    const nonce = base64ToBuffer(parts[1]);
    const ciphertext = base64ToBuffer(parts[2]);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce as any
      },
      key,
      ciphertext as any
    );

    return new TextDecoder().decode(decrypted);
  }

  throw new Error("Invalid payload format");
};

/**
 * Hashes a string deterministically with SHA-256
 */
export const hashString = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(`pv_fixed_salt_v1:${message}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verifies panic password against stored recovery hash (checks both salted and legacy plain hashes)
 */
export const verifyPanicCode = async (inputPassword: string, storedHash: string): Promise<boolean> => {
  if (!storedHash || !inputPassword) return false;
  
  // 1. Check Salted SHA-256 (Current Standard)
  const saltedHash = await hashString(inputPassword);
  if (saltedHash === storedHash) return true;

  // 2. Check Plain Legacy SHA-256 (Backwards Compatibility)
  const plainBuffer = new TextEncoder().encode(inputPassword);
  const plainHashBuffer = await window.crypto.subtle.digest('SHA-256', plainBuffer);
  const plainHash = Array.from(new Uint8Array(plainHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (plainHash === storedHash) return true;

  return false;
};

/**
 * Copies text to clipboard and automatically overwrites after delay for OPSEC
 */
let clipboardTimeoutId: ReturnType<typeof setTimeout> | null = null;
export const copyToClipboardWithAutoClear = async (text: string, clearDelaySeconds: number = 30): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    
    // 1. Native Desktop Tauri Integration (Win32 OS level)
    if (typeof window !== 'undefined' && (window as any).__TAURI__ && clearDelaySeconds > 0) {
      try {
        await (window as any).__TAURI__.invoke('scrub_clipboard_native', { delaySeconds: clearDelaySeconds });
      } catch {
        // Fallback to web timer
      }
    }

    // 2. Web / Browser Timer Fallback
    if (clipboardTimeoutId) {
      clearTimeout(clipboardTimeoutId);
    }

    if (clearDelaySeconds > 0) {
      clipboardTimeoutId = setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === text) {
            await navigator.clipboard.writeText('');
          }
        } catch {
          // Clipboard read permission might be restricted in some browsers
        }
      }, clearDelaySeconds * 1000);
    }
    return true;
  } catch (err) {
    // Fallback for non-HTTPS or denied permissions
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Encrypts an entire Vault with single KDF master key derivation and microsecond field encryption
 */
export const encryptVault = async (
  items: VaultItem[],
  apiKey: string,
  password: string,
  existingSalt?: string
): Promise<EncryptedVault> => {
  // 1. Generate or reuse Salt
  let saltBytes: Uint8Array;
  if (existingSalt && existingSalt !== "RUST_MANAGED") {
    saltBytes = base64ToBuffer(existingSalt);
  } else {
    saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  }

  // 2. Single Master Key Derivation (Fast & Zero RAM Spike)
  const masterKey = await deriveMasterKey(password, saltBytes);

  // 3. Encrypt Integrity Check
  const integrity = await encryptField(INTEGRITY_CHECK_VALUE, masterKey);

  // 4. Encrypt API Key
  const encryptedApiKey = apiKey ? await encryptField(apiKey, masterKey) : undefined;

  // 5. Encrypt Items in parallel
  const encryptedItems: EncryptedItem[] = await Promise.all(
    items.map(async (item) => {
      return {
        id: item.id,
        category: item.category,
        folder: item.folder,
        color: item.color,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,

        name: await encryptField(item.name || '', masterKey),
        username: await encryptField(item.username || '', masterKey),
        password: item.password ? await encryptField(item.password, masterKey) : undefined,
        website: item.website ? await encryptField(item.website, masterKey) : undefined,
        notes: item.notes ? await encryptField(item.notes, masterKey) : undefined,
        history: item.history && item.history.length > 0 
          ? await encryptField(JSON.stringify(item.history), masterKey) 
          : undefined,
      };
    })
  );

  return {
    salt: bufferToBase64(saltBytes),
    integrity,
    items: encryptedItems,
    encryptedApiKey
  };
};

/**
 * Decrypts a vault using single master key derivation and verifying integrity
 */
export const decryptVault = async (
  vault: EncryptedVault,
  password: string
): Promise<{ items: VaultItem[]; apiKey: string }> => {
  // CRYO CHECK
  const lockStatus = checkLockout();
  if (lockStatus.isLocked) {
    if (lockStatus.permanent) throw new Error("VAULT SEALED (PERMANENT LOCK)");
    throw new Error(`VAULT FROZEN: Wait ${lockStatus.remainingSeconds}s`);
  }

  if (!vault.salt) {
    registerFailure();
    throw new Error("Invalid vault format: Missing salt");
  }

  const saltBytes = vault.salt === "RUST_MANAGED" 
    ? new Uint8Array(16) // Fallback default
    : base64ToBuffer(vault.salt);

  let masterKey: CryptoKey;
  try {
    masterKey = await deriveMasterKey(password, saltBytes);
  } catch (e) {
    registerFailure();
    throw new Error("Key derivation failed");
  }

  // 1. Verify Integrity
  try {
    if (!vault.integrity) throw new Error("Missing integrity check");
    const check = await decryptField(vault.integrity, masterKey);

    if (check !== INTEGRITY_CHECK_VALUE) throw new Error("Wrong password");

    registerSuccess(); // Success - clear failed attempts
  } catch (e) {
    registerFailure();
    throw new Error("Invalid password");
  }

  // 2. Decrypt API Key
  let apiKey = '';
  if (vault.encryptedApiKey) {
    try {
      apiKey = await decryptField(vault.encryptedApiKey, masterKey);
    } catch {
      console.warn("Failed to decrypt API Key");
    }
  }

  // 3. Decrypt Items
  const items: VaultItem[] = await Promise.all(
    (vault.items || []).map(async (encItem) => {
      try {
        return {
          id: encItem.id,
          category: (encItem.category as any) || 'Login',
          folder: encItem.folder || 'Personal',
          color: encItem.color,
          createdAt: encItem.createdAt || Date.now(),
          updatedAt: encItem.updatedAt || Date.now(),

          name: await decryptField(encItem.name, masterKey),
          username: await decryptField(encItem.username, masterKey),
          password: encItem.password ? await decryptField(encItem.password, masterKey) : undefined,
          website: encItem.website ? await decryptField(encItem.website, masterKey) : undefined,
          notes: encItem.notes ? await decryptField(encItem.notes, masterKey) : undefined,
          history: encItem.history ? JSON.parse(await decryptField(encItem.history, masterKey)) : [],
        };
      } catch (e) {
        return {
          id: encItem.id,
          name: "Corrupted Item",
          username: "",
          category: 'Login',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
    })
  );

  return { items, apiKey };
};

/**
 * Encrypts entire vault into a Pure Binary .pvdb container (Zero Base64 Overhead)
 */
export const exportVaultToBinary = async (
  items: VaultItem[],
  apiKey: string,
  password: string
): Promise<Uint8Array> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const masterKey = await deriveMasterKey(password, salt);

  const plainJson = JSON.stringify({
    integrity: INTEGRITY_CHECK_VALUE,
    apiKey: apiKey || '',
    items,
    timestamp: Date.now()
  });

  const encodedData = new TextEncoder().encode(plainJson);

  const ciphertextWithTag = new Uint8Array(
    await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any
      },
      masterKey,
      encodedData
    )
  );

  return packBinaryVault(salt, iv, ciphertextWithTag);
};

/**
 * Decrypts a Pure Binary .pvdb container (Zero Base64 Overhead)
 */
export const importVaultFromBinary = async (
  binaryData: Uint8Array,
  password: string
): Promise<{ items: VaultItem[]; apiKey: string }> => {
  const { salt, iv, ciphertext } = unpackBinaryVault(binaryData);
  const masterKey = await deriveMasterKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any
      },
      masterKey,
      ciphertext as any
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    const parsed = JSON.parse(decryptedText);

    if (parsed.integrity !== INTEGRITY_CHECK_VALUE) {
      throw new Error("Invalid Master Key: Integrity Check Failed");
    }

    return {
      items: parsed.items || [],
      apiKey: parsed.apiKey || ''
    };
  } catch (e: any) {
    throw new Error(e?.message || "Decryption failed: Invalid Password or Corrupted Binary Vault");
  }
};