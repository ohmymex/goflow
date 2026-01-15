'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

type FunctionNodeData = {
  label: string;
  nodeType: string;
  startLine: number;
  endLine: number;
  isActive: boolean;
  isCurrentLine: boolean;
};

type FunctionNodeType = Node<FunctionNodeData, 'function'>;

export const FunctionNode = memo(function FunctionNode({
  data,
}: NodeProps<FunctionNodeType>) {
  const { label, startLine, endLine, isActive } = data;

  return (
    <div
      className={`
        px-5 py-4 rounded-2xl border-2 min-w-[200px] transition-all duration-200
        ${isActive 
          ? 'bg-accent/20 border-accent text-base-content shadow-lg shadow-accent/20' 
          : 'bg-base-100 border-base-300 text-base-content'
        }
      `}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="font-bold">{label}</span>
        </div>
        <span className="text-xs opacity-60 font-mono">Lines {startLine}-{endLine}</span>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  );
});
