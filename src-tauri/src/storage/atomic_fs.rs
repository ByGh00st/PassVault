use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;

/// Resolves the secure vault database directory (`%APPDATA%/.passvault` or `~/.passvault`)
pub fn get_vault_storage_dir() -> Result<PathBuf, String> {
    #[cfg(windows)]
    let base = std::env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));

    #[cfg(not(windows))]
    let base = std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));

    let vault_dir = base.join(".passvault");
    if !vault_dir.exists() {
        fs::create_dir_all(&vault_dir)
            .map_err(|e| format!("Failed to create secure vault directory: {}", e))?;
    }
    Ok(vault_dir)
}

/// Atomically writes encrypted database content with fsync and temp-file rename
pub fn save_vault_atomic(filename: &str, content: &str) -> Result<String, String> {
    save_binary_vault_atomic(filename, content.as_bytes())
}

/// Atomically writes pure binary vault data (.pvdb) directly to disk
pub fn save_binary_vault_atomic(filename: &str, data: &[u8]) -> Result<String, String> {
    let dir = get_vault_storage_dir()?;
    let target_path = dir.join(filename);
    let temp_path = dir.join(format!("{}.tmp.{}", filename, rand::random::<u32>()));

    // 1. Write to temporary buffer file
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temporary buffer file: {}", e))?;

    file.write_all(data)
        .map_err(|e| format!("Failed to write binary vault data: {}", e))?;

    file.sync_all()
        .map_err(|e| format!("Failed to fsync data to disk: {}", e))?;

    drop(file);

    // 2. Atomic rename / swap
    fs::rename(&temp_path, &target_path)
        .map_err(|e| format!("Atomic database swap failed: {}", e))?;

    Ok(target_path.to_string_lossy().to_string())
}

/// Reads encrypted database content from local disk
pub fn read_vault_file(filename: &str) -> Result<String, String> {
    let bytes = read_binary_vault_file(filename)?;
    String::from_utf8(bytes).map_err(|_| "Database file is binary format, use binary loader".into())
}

/// Reads raw binary database content from local disk (.pvdb)
pub fn read_binary_vault_file(filename: &str) -> Result<Vec<u8>, String> {
    let dir = get_vault_storage_dir()?;
    let target_path = dir.join(filename);

    if !target_path.exists() {
        return Err("Database file does not exist on disk".into());
    }

    let mut file = File::open(&target_path)
        .map_err(|e| format!("Failed to open vault database: {}", e))?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read vault database: {}", e))?;

    Ok(buffer)
}

/// Securely purges vault database file with zero-fill overwrite
pub fn purge_vault_file(filename: &str) -> Result<(), String> {
    let dir = get_vault_storage_dir()?;
    let target_path = dir.join(filename);

    if target_path.exists() {
        // Overwrite before deletion (Anti-Forensics)
        let _ = fs::write(&target_path, vec![0u8; 1024]);
        fs::remove_file(&target_path)
            .map_err(|e| format!("Failed to remove database file: {}", e))?;
    }

    Ok(())
}
