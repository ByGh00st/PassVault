use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::crypto::{decrypt_native, encrypt_native};
use crate::security::{check_debugger_attached, schedule_clipboard_wipe};
use crate::storage::{
    protect_secret_dpapi, purge_vault_file, read_binary_vault_file, read_vault_file,
    save_binary_vault_atomic, save_vault_atomic, unprotect_secret_dpapi,
};

#[derive(Serialize, Deserialize)]
pub struct SecurityAuditReport {
    pub debugger_attached: bool,
    pub platform: String,
    pub hardware_encryption_available: bool,
}

/// Encrypts an arbitrary string payload with Argon2id + AES-256-GCM AEAD
#[command]
pub fn encrypt_payload(payload: String, password: String) -> Result<String, String> {
    encrypt_native(payload.as_bytes(), &password)
}

/// Decrypts an AES-256-GCM encrypted payload and verifies integrity
#[command]
pub fn decrypt_payload(packed: String, password: String) -> Result<String, String> {
    let secure_buf = decrypt_native(&packed, &password)?;
    secure_buf.into_string()
}

/// Hashes a password string with Argon2id
#[command]
pub fn hash_password(password: String) -> Result<String, String> {
    let mut salt = [0u8; 16];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut salt);
    let key = crate::crypto::derive_argon2id_key(&password, &salt)?;
    Ok(base64::engine::general_purpose::STANDARD.encode(key.as_slice()))
}

/// Atomically persists encrypted vault payload to local disk (.pvdb)
#[command]
pub fn save_vault_db(filename: Option<String>, content: String) -> Result<String, String> {
    let target_file = filename.unwrap_or_else(|| "vault.pvdb".to_string());
    save_vault_atomic(&target_file, &content)
}

/// Atomically persists pure binary vault payload to local disk (.pvdb)
#[command]
pub fn save_binary_vault_db(filename: Option<String>, data: Vec<u8>) -> Result<String, String> {
    let target_file = filename.unwrap_or_else(|| "vault.pvdb".to_string());
    save_binary_vault_atomic(&target_file, &data)
}

/// Loads encrypted vault payload from local disk (.pvdb)
#[command]
pub fn load_vault_db(filename: Option<String>) -> Result<String, String> {
    let target_file = filename.unwrap_or_else(|| "vault.pvdb".to_string());
    read_vault_file(&target_file)
}

/// Loads pure binary vault payload from local disk (.pvdb)
#[command]
pub fn load_binary_vault_db(filename: Option<String>) -> Result<Vec<u8>, String> {
    let target_file = filename.unwrap_or_else(|| "vault.pvdb".to_string());
    read_binary_vault_file(&target_file)
}

/// Securely removes and zero-fills local vault database file
#[command]
pub fn purge_vault_db(filename: Option<String>) -> Result<(), String> {
    let target_file = filename.unwrap_or_else(|| "vault.pvdb".to_string());
    purge_vault_file(&target_file)
}

/// Hardware/DPAPI protects the master salt
#[command]
pub fn protect_master_salt(salt_b64: String) -> Result<String, String> {
    protect_secret_dpapi(salt_b64.as_bytes())
}

/// Decrypts hardware/DPAPI protected salt
#[command]
pub fn unprotect_master_salt(protected_b64: String) -> Result<String, String> {
    let bytes = unprotect_secret_dpapi(&protected_b64)?;
    String::from_utf8(bytes).map_err(|_| "Invalid UTF-8 salt sequence".into())
}

/// Performs OS Ring 3 anti-debugging and environment audit
#[command]
pub fn audit_environment_security() -> Result<SecurityAuditReport, String> {
    let is_debugged = check_debugger_attached();

    Ok(SecurityAuditReport {
        debugger_attached: is_debugged,
        platform: std::env::consts::OS.to_string(),
        hardware_encryption_available: true,
    })
}

/// Schedules a native OS-level clipboard purge after specified seconds
#[command]
pub fn scrub_clipboard_native(delay_seconds: u64) -> Result<(), String> {
    schedule_clipboard_wipe(delay_seconds);
    Ok(())
}
