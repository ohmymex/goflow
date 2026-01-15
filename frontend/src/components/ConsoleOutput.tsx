'use client';

interface ConsoleOutputProps {
  output: string;
}

export function ConsoleOutput({ output }: ConsoleOutputProps) {
  if (!output) {
    return (
      <div className="h-full flex items-center justify-center text-base-content/50 bg-neutral rounded-lg">
        <div className="text-center">
          <svg
            className="w-10 h-10 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-neutral-content/50">No output yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-1.5 bg-neutral-focus/50 border-b border-base-300 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <div className="w-3 h-3 rounded-full bg-success"></div>
        </div>
        <span className="text-xs text-neutral-content/60 font-mono">Console Output</span>
      </div>
      <pre className="flex-1 p-3 overflow-auto font-mono text-sm text-neutral-content whitespace-pre-wrap">
        {output}
      </pre>
    </div>
  );
}
