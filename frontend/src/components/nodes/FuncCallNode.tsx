'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

type FuncCallNodeData = {
  label: string;
  nodeType: string;
  line: number;
  isActive: boolean;
  isCurrentLine: boolean;
};

type FuncCallNodeType = Node<FuncCallNodeData, 'funcCall'>;

export const FuncCallNode = memo(function FuncCallNode({
  data,
}: NodeProps<FuncCallNodeType>) {
  const { label, line, isActive, isCurrentLine } = data;

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[150px] transition-all duration-200
        ${isCurrentLine
          ? 'bg-info text-info-content border-info shadow-lg shadow-info/30 scale-105'
          : isActive
            ? 'bg-info/20 border-info/50 text-base-content'
            : 'bg-base-100 border-base-300 text-base-content'
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-info" />

      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs opacity-60 font-mono">L{line}</span>
        <span className="font-medium text-sm truncate max-w-[180px]">{label}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-info" />
    </div>
  );
});
