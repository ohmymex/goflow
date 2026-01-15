'use client';

import { useMemo } from 'react';
import { Variable } from '@/types/trace';

interface VariableTrackerProps {
  variables: Variable[];
  previousVariables?: Variable[];
}

export function VariableTracker({ variables, previousVariables = [] }: VariableTrackerProps) {
  // Detect which variables changed
  const changedVars = useMemo(() => {
    const changed = new Set<string>();
    for (const v of variables) {
      const prev = previousVariables.find(p => p.name === v.name);
      if (!prev || JSON.stringify(prev.value) !== JSON.stringify(v.value)) {
        changed.add(v.name);
      }
    }
    return changed;
  }, [variables, previousVariables]);

  if (variables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-base-content/50">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 7v10M7 12h10"
            />
          </svg>
          <p className="text-sm">No variables yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2">
      <table className="table table-sm w-full">
        <thead>
          <tr className="border-base-300">
            <th className="bg-base-200">Name</th>
            <th className="bg-base-200">Type</th>
            <th className="bg-base-200">Value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => {
            const hasChanged = changedVars.has(variable.name);
            return (
              <tr
                key={variable.name}
                className={`
                  border-base-300 transition-all duration-300
                  ${hasChanged ? 'bg-warning/20' : ''}
                `}
              >
                <td className="font-mono font-semibold">
                  <span className={hasChanged ? 'text-warning' : ''}>
                    {variable.name}
                  </span>
                </td>
                <td className="text-base-content/60 font-mono text-xs">
                  {variable.type}
                </td>
                <td className="font-mono">
                  <span
                    className={`
                      inline-block px-2 py-0.5 rounded
                      ${hasChanged ? 'bg-warning text-warning-content animate-pulse' : 'bg-base-200'}
                    `}
                  >
                    {formatValue(variable.value)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'nil';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
