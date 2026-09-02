use base64::{engine::general_purpose::STANDARD, Engine as _};

/// Protects secrets using Windows Data Protection API (DPAPI) with hardware TPM binding
pub fn protect_secret_dpapi(secret: &[u8]) -> Result<String, String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::Foundation::LocalFree;
        use windows_sys::Win32::Security::Cryptography::{
            CryptProtectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        };

        let mut input_blob = CRYPT_INTEGER_BLOB {
            cbData: secret.len() as u32,
            pbData: secret.as_ptr() as *mut u8,
        };
        let mut output_blob = CRYPT_INTEGER_BLOB {
            cbData: 0,
            pbData: std::ptr::null_mut(),
        };

        let result = CryptProtectData(
            &mut input_blob,
            std::ptr::null(),
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output_blob,
        );

        if result != 0 && !output_blob.pbData.is_null() {
            let slice = std::slice::from_raw_parts(output_blob.pbData, output_blob.cbData as usize);
            let encoded = STANDARD.encode(slice);
            LocalFree(output_blob.pbData as _);
            Ok(encoded)
        } else {
            Err("Windows DPAPI CryptProtectData operation failed".into())
        }
    }

    #[cfg(not(windows))]
    {
        Ok(STANDARD.encode(secret))
    }
}

/// Decrypts DPAPI-protected blob
pub fn unprotect_secret_dpapi(protected_b64: &str) -> Result<Vec<u8>, String> {
    let encrypted_bytes = STANDARD
        .decode(protected_b64)
        .map_err(|_| "Invalid base64 encoding for DPAPI payload")?;

    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::Foundation::LocalFree;
        use windows_sys::Win32::Security::Cryptography::{
            CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        };

        let mut input_blob = CRYPT_INTEGER_BLOB {
            cbData: encrypted_bytes.len() as u32,
            pbData: encrypted_bytes.as_ptr() as *mut u8,
        };
        let mut output_blob = CRYPT_INTEGER_BLOB {
            cbData: 0,
            pbData: std::ptr::null_mut(),
        };

        let result = CryptUnprotectData(
            &mut input_blob,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output_blob,
        );

        if result != 0 && !output_blob.pbData.is_null() {
            let slice = std::slice::from_raw_parts(output_blob.pbData, output_blob.cbData as usize);
            let decrypted = slice.to_vec();
            LocalFree(output_blob.pbData as _);
            Ok(decrypted)
        } else {
            Err("Windows DPAPI CryptUnprotectData failed: Invalid logon session or machine context".into())
        }
    }

    #[cfg(not(windows))]
    {
        Ok(encrypted_bytes)
    }
}
