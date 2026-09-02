pub mod anti_debug;
pub mod clipboard;

pub use anti_debug::check_debugger_attached;
pub use clipboard::schedule_clipboard_wipe;
