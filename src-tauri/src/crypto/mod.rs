pub mod kdf;
pub mod zeroize_mem;

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce
};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use rand::{rngs::OsRng, RngCore};

pub use kdf::derive_argon2id_key;
pub use zeroize_mem::SecureBuffer;

/// Encrypts plaintext using Argon2id-derived key and AES-256-GCM AEAD
pub fn encrypt_native(plaintext: &[u8], password: &str) -> Result<String, String> {
    // 1. Generate 16-byte cryptographically secure random salt
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);

    // 2. Derive 256-bit key via Argon2id
    let derived_key = derive_argon2id_key(password, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(derived_key.as_slice());
    let cipher = Aes256Gcm::new(key);

    // 3. Generate 12-byte unique nonce
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // 4. Encrypt with integrated GHASH authentication tag
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("AES-256-GCM encryption error: {}", e))?;

    // 5. Pack formatted string: Salt(B64):Nonce(B64):Ciphertext(B64)
    let b64_salt = STANDARD.encode(salt);
    let b64_nonce = STANDARD.encode(nonce_bytes);
    let b64_cipher = STANDARD.encode(ciphertext);

    Ok(format!("{}:{}:{}", b64_salt, b64_nonce, b64_cipher))
}

/// Decrypts AES-256-GCM payload and verifies authentication tag
pub fn decrypt_native(packed: &str, password: &str) -> Result<SecureBuffer, String> {
    let parts: Vec<&str> = packed.split(':').collect();
    if parts.len() != 3 {
        return Err("Integrity Violation: Invalid ciphertext envelope format".into());
    }

    let salt = STANDARD.decode(parts[0]).map_err(|_| "Corrupted salt encoding")?;
    let nonce_bytes = STANDARD.decode(parts[1]).map_err(|_| "Corrupted nonce encoding")?;
    let ciphertext = STANDARD.decode(parts[2]).map_err(|_| "Corrupted ciphertext encoding")?;

    let derived_key = derive_argon2id_key(password, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(derived_key.as_slice());
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let decrypted = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Decryption Failed: Authentication Tag Mismatch or Invalid Master Key")?;

    Ok(SecureBuffer::new(decrypted))
}
