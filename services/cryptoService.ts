/**
 * 🛡️ GHOST PROTOCOL - PUBLIC INTERFACE
 * 
 * This file acts as the secure bridge between the public frontend (UI)
 * and the private security core.
 * 
 * The actual cryptographic implementations (AES-256, PBKDF2, Panic Mode)
 * reside in the '../ghost-core' directory.
 * 
 * NOTE: The 'ghost-core' directory is excluded from the public repository
 * via .gitignore to protect the proprietary security architecture.
 */

export * from '../ghost-core';
