import { useEffect } from 'react';
import { AppState } from '../types';

export const useAutoLock = (
  appState: AppState,
  autoLockMinutes: number,
  onLock: () => void
) => {
  useEffect(() => {
    if (appState !== AppState.UNLOCKED) return;

    let lastActivity = Date.now();
    const onActivity = () => {
      lastActivity = Date.now();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, onActivity, { capture: true });
    });

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > autoLockMinutes * 60 * 1000) {
        onLock();
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, onActivity, { capture: true });
      });
    };
  }, [appState, autoLockMinutes, onLock]);
};
