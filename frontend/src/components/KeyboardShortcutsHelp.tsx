'use client';

import { useState, useRef, useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1"
        title="Keyboard shortcuts"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="hidden sm:inline text-xs">Shortcuts</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 card card-compact shadow-xl bg-base-100 border border-base-300 w-64">
          <div className="card-body">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Keyboard Shortcuts
            </h3>
            <div className="divider my-1"></div>
            <ul className="space-y-2">
              {KEYBOARD_SHORTCUTS.map(({ key, description }) => (
                <li key={key} className="flex justify-between items-center text-sm">
                  <span className="text-base-content/70">{description}</span>
                  <kbd className="kbd kbd-sm">{key}</kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
