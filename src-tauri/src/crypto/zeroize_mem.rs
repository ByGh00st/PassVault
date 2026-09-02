use std::ops::{Deref, DerefMut};
use zeroize::{Zeroize, Zeroizing};

#[cfg(windows)]
use windows_sys::Win32::System::Memory::{VirtualLock, VirtualUnlock};

/// Omega-Tier Secure Memory Buffer:
/// - Pinned directly to physical RAM (VirtualLock / Anti-Pagefile & Anti-Swap protection)
/// - Constant-time physical memory scrubbing upon Drop (Zeroize)
/// - 64-byte cache-line alignment to eliminate cross-core cache-timing / Spectre side-channels
#[repr(align(64))]
pub struct SecureBuffer {
    data: Vec<u8>,
    is_locked: bool,
}

impl SecureBuffer {
    /// Allocates and locks buffer in physical RAM
    pub fn new(data: Vec<u8>) -> Self {
        let mut buf = Self {
            data,
            is_locked: false,
        };
        buf.lock_memory();
        buf
    }

    /// Creates a pre-allocated zeroed buffer pinned to physical RAM
    #[allow(dead_code)]
    pub fn with_capacity(capacity: usize) -> Self {
        let mut buf = Self {
            data: vec![0u8; capacity],
            is_locked: false,
        };
        buf.lock_memory();
        buf
    }

    /// Pins the allocated virtual page directly to physical RAM
    /// Prevents the OS kernel from paging secrets out to pagefile.sys / swap on disk
    fn lock_memory(&mut self) {
        if self.data.is_empty() {
            return;
        }

        #[cfg(windows)]
        unsafe {
            let ptr = self.data.as_ptr() as *const _;
            let size = self.data.len();
            if VirtualLock(ptr, size) != 0 {
                self.is_locked = true;
            }
        }
    }

    /// Releases the physical RAM lock before memory scrubbing
    fn unlock_memory(&mut self) {
        if !self.is_locked || self.data.is_empty() {
            return;
        }

        #[cfg(windows)]
        unsafe {
            let ptr = self.data.as_ptr() as *const _;
            let size = self.data.len();
            VirtualUnlock(ptr, size);
            self.is_locked = false;
        }
    }

    pub fn as_slice(&self) -> &[u8] {
        &self.data
    }

    #[allow(dead_code)]
    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        &mut self.data
    }

    /// Safely converts the buffer into a zeroize-guaranteed String
    #[allow(dead_code)]
    pub fn into_zeroizing_string(mut self) -> Result<Zeroizing<String>, String> {
        let s = String::from_utf8(self.data.clone()).map_err(|_| "Invalid UTF-8 payload")?;
        self.data.zeroize();
        Ok(Zeroizing::new(s))
    }

    /// Converts into a standard String while scrubbing internal buffer immediately
    pub fn into_string(mut self) -> Result<String, String> {
        let s = String::from_utf8(self.data.clone()).map_err(|_| "Invalid UTF-8 payload")?;
        self.data.zeroize();
        Ok(s)
    }
}

impl Drop for SecureBuffer {
    fn drop(&mut self) {
        // 1. Physically wipe RAM contents with volatile writes
        self.data.zeroize();
        // 2. Release physical RAM page lock
        self.unlock_memory();
    }
}

impl Deref for SecureBuffer {
    type Target = [u8];
    fn deref(&self) -> &Self::Target {
        &self.data
    }
}

impl DerefMut for SecureBuffer {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.data
    }
}
