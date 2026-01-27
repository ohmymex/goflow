'use client';

import { Fragment, useMemo } from 'react';
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

  // Group variables by scope (function name) — must be before early return (Rules of Hooks)
  const groupedVars = useMemo(() => {
    const groups: Record<string, Variable[]> = {};
    for (const v of variables) {
      // Extract function name from scope (e.g., "main.for_1" -> "main")
      const funcName = v.scope.split('.')[0] || 'main';
      if (!groups[funcName]) groups[funcName] = [];
      groups[funcName].push(v);
    }
    return groups;
  }, [variables]);

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

  const scopeNames = Object.keys(groupedVars);
  const hasMultipleScopes = scopeNames.length > 1;

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
          {scopeNames.map((scopeName) => (
            <Fragment key={scopeName}>
              {hasMultipleScopes && (
                <tr className="border-base-300">
                  <td colSpan={3} className="bg-base-300/50 py-1 px-2">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      {scopeName}()
                    </span>
                  </td>
                </tr>
              )}
              {groupedVars[scopeName].map((variable) => {
                const hasChanged = changedVars.has(variable.name);
                return (
                  <tr
                    key={`${scopeName}-${variable.name}`}
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
            </Fragment>
          ))}
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
