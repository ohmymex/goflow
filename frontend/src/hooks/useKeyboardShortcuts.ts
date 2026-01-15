'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onPlayPause?: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onGoToStart?: () => void;
  onGoToEnd?: () => void;
  onReset?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onNextStep,
  onPrevStep,
  onGoToStart,
  onGoToEnd,
  onReset,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('.monaco-editor')
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for specific combos)
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

      switch (event.key) {
        case ' ': // Space - Play/Pause
          if (!hasModifier) {
            event.preventDefault();
            onPlayPause?.();
          }
          break;

        case 'ArrowRight': // Right Arrow - Next Step
          if (!hasModifier) {
            event.preventDefault();
            onNextStep?.();
          }
          break;

        case 'ArrowLeft': // Left Arrow - Previous Step
          if (!hasModifier) {
            event.preventDefault();
            onPrevStep?.();
          }
          break;

        case 'Home': // Home - Go to Start
          if (!hasModifier) {
            event.preventDefault();
            onGoToStart?.();
          }
          break;

        case 'End': // End - Go to End
          if (!hasModifier) {
            event.preventDefault();
            onGoToEnd?.();
          }
          break;

        case 'r': // R - Reset (with Shift)
          if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onReset?.();
          }
          break;

        case 'Escape': // Escape - Stop playing
          if (!hasModifier) {
            event.preventDefault();
            // Only pause, don't toggle
            if (onPlayPause) {
              onPlayPause();
            }
          }
          break;
      }
    },
    [onPlayPause, onNextStep, onPrevStep, onGoToStart, onGoToEnd, onReset]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

// Export shortcut descriptions for help tooltip
export const KEYBOARD_SHORTCUTS = [
  { key: 'Space', description: 'Play / Pause' },
  { key: '←', description: 'Previous step' },
  { key: '→', description: 'Next step' },
  { key: 'Home', description: 'Go to start' },
  { key: 'End', description: 'Go to end' },
  { key: 'Shift + R', description: 'Reset' },
  { key: 'Esc', description: 'Stop playing' },
];
