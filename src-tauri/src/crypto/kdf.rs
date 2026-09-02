use argon2::{
    Algorithm, Argon2, Params, Version
};
use zeroize::Zeroize;
use super::zeroize_mem::SecureBuffer;

/// Derives a 256-bit (32-byte) AES key using multi-lane Argon2id with memory-sanitization guarantees
pub fn derive_argon2id_key(password: &str, salt: &[u8]) -> Result<SecureBuffer, String> {
    let params = Params::new(
        65536, // 64 MB RAM
        3,     // 3 Iterations (Time Cost)
        4,     // 4 Parallel Lanes
        Some(32) // 256-bit Key output
    ).map_err(|e| format!("Argon2 parameters initialization error: {}", e))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key_bytes = [0u8; 32];

    argon2.hash_password_into(
        password.as_bytes(),
        salt,
        &mut key_bytes
    ).map_err(|e| format!("KDF key derivation failed: {}", e))?;

    let secure_key = SecureBuffer::new(key_bytes.to_vec());
    key_bytes.zeroize(); // Immediate zeroing of stack buffer

    Ok(secure_key)
}
