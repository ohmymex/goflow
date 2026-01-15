'use client';

import { useState } from 'react';
import { CODE_EXAMPLES, CodeExample } from '@/lib/codeExamples';

interface CodeExamplesDropdownProps {
  onSelect: (code: string) => void;
}

export function CodeExamplesDropdown({ onSelect }: CodeExamplesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (example: CodeExample) => {
    onSelect(example.code);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-2"
        onClick={() => setIsOpen(true)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Examples
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-3xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
              <div>
                <h2 className="text-lg font-bold">Code Examples</h2>
                <p className="text-sm text-base-content/60">Select an example to load into the editor</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Examples grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CODE_EXAMPLES.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => handleSelect(example)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <span className="font-semibold">{example.name}</span>
                    </div>
                    <span className="text-sm text-base-content/60">{example.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
