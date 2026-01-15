'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

type ForLoopNodeData = {
  label: string;
  nodeType: string;
  startLine: number;
  endLine: number;
  isActive: boolean;
  isCurrentLine: boolean;
};

type ForLoopNodeType = Node<ForLoopNodeData, 'forLoop'>;

export const ForLoopNode = memo(function ForLoopNode({
  data,
}: NodeProps<ForLoopNodeType>) {
  const { label, startLine, endLine, isActive, isCurrentLine } = data;

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-200
        ${isCurrentLine 
          ? 'bg-secondary text-secondary-content border-secondary shadow-lg shadow-secondary/30 scale-105' 
          : isActive 
            ? 'bg-secondary/20 border-secondary/50 text-base-content' 
            : 'bg-base-100 border-base-300 text-base-content'
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-secondary" />
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span className="text-xs opacity-60 font-mono">Lines {startLine}-{endLine}</span>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-secondary" />
    </div>
  );
});
