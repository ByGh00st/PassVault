#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod crypto;
mod security;
mod storage;

use commands::{
    audit_environment_security, decrypt_payload, encrypt_payload, hash_password,
    load_binary_vault_db, load_vault_db, protect_master_salt, purge_vault_db,
    save_binary_vault_db, save_vault_db, scrub_clipboard_native, unprotect_master_salt,
};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            encrypt_payload,
            decrypt_payload,
            hash_password,
            save_vault_db,
            save_binary_vault_db,
            load_vault_db,
            load_binary_vault_db,
            purge_vault_db,
            protect_master_salt,
            unprotect_master_salt,
            audit_environment_security,
            scrub_clipboard_native
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
