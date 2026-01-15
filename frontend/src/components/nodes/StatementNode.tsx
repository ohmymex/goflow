'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

type StatementNodeData = {
  label: string;
  nodeType: string;
  line: number;
  isActive: boolean;
  isCurrentLine: boolean;
};

type StatementNodeType = Node<StatementNodeData, 'statement'>;

export const StatementNode = memo(function StatementNode({
  data,
}: NodeProps<StatementNodeType>) {
  const { label, line, isActive, isCurrentLine } = data;

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 min-w-[150px] transition-all duration-200
        ${isCurrentLine 
          ? 'bg-primary text-primary-content border-primary shadow-lg shadow-primary/30 scale-105' 
          : isActive 
            ? 'bg-primary/20 border-primary/50 text-base-content' 
            : 'bg-base-100 border-base-300 text-base-content'
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <div className="flex items-center gap-2">
        <span className="text-xs opacity-60 font-mono">L{line}</span>
        <span className="font-medium text-sm truncate max-w-[180px]">{label}</span>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
});
