/// Inspects process execution environment for debuggers and instrumentation hooks
pub fn check_debugger_attached() -> bool {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::System::Diagnostics::Debug::{
            CheckRemoteDebuggerPresent, IsDebuggerPresent,
        };
        use windows_sys::Win32::System::Threading::GetCurrentProcess;

        if IsDebuggerPresent() != 0 {
            return true;
        }

        let mut is_remote_debugger: i32 = 0;
        let process_handle = GetCurrentProcess();
        if CheckRemoteDebuggerPresent(process_handle, &mut is_remote_debugger) != 0 && is_remote_debugger != 0 {
            return true;
        }
    }

    false
}
