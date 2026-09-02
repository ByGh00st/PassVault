use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::Duration;

static CLIPBOARD_SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// Spawns a dedicated native OS worker thread that scrubs system clipboard after delay
pub fn schedule_clipboard_wipe(delay_seconds: u64) {
    if delay_seconds == 0 {
        return;
    }

    let current_seq = CLIPBOARD_SEQUENCE.fetch_add(1, Ordering::SeqCst) + 1;

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(delay_seconds));

        // Ensure no newer clipboard copy operation superseded this task
        if CLIPBOARD_SEQUENCE.load(Ordering::SeqCst) == current_seq {
            #[cfg(windows)]
            unsafe {
                use windows_sys::Win32::System::DataExchange::{
                    CloseClipboard, EmptyClipboard, OpenClipboard,
                };
                if OpenClipboard(0) != 0 {
                    EmptyClipboard();
                    CloseClipboard();
                }
            }
        }
    });
}
