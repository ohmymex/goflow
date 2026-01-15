'use client';

import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ASTNode, TraceStep } from '@/types/trace';
import { StatementNode } from './nodes/StatementNode';
import { ForLoopNode } from './nodes/ForLoopNode';
import { FunctionNode } from './nodes/FunctionNode';

interface FlowCanvasProps {
  astNodes: ASTNode[];
  currentStep: TraceStep | null;
  currentLine: number;
}

const nodeTypes = {
  statement: StatementNode,
  forLoop: ForLoopNode,
  function: FunctionNode,
} as const;

export function FlowCanvas({ astNodes, currentStep, currentLine }: FlowCanvasProps) {
  // Convert AST nodes to React Flow nodes
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return convertASTToFlow(astNodes, currentLine);
  }, [astNodes, currentLine]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when currentLine changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertASTToFlow(astNodes, currentLine);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [currentLine, astNodes, setNodes, setEdges]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-base-300 bg-base-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#374151" />
        <Controls className="bg-base-100 border-base-300" />
        <MiniMap 
          className="bg-base-100 border-base-300"
          nodeColor={(node) => {
            const data = node.data as { isActive?: boolean };
            return data?.isActive ? '#6366f1' : '#374151';
          }}
        />
      </ReactFlow>
    </div>
  );
}

// Convert AST nodes to React Flow format
function convertASTToFlow(
  astNodes: ASTNode[],
  currentLine: number
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  
  let yOffset = 0;
  const xBase = 0;
  const yGap = 80;
  const xIndent = 250;

  function processNode(
    node: ASTNode,
    depth: number = 0,
    parentId?: string
  ): string {
    const nodeId = node.id;
    const x = xBase + depth * xIndent;
    const y = yOffset;
    yOffset += yGap;

    const isActive = node.startLine <= currentLine && node.endLine >= currentLine;
    const isCurrentLine = node.startLine === currentLine;

    let nodeType = 'statement';
    if (node.type === 'for') nodeType = 'forLoop';
    if (node.type === 'function') nodeType = 'function';

    flowNodes.push({
      id: nodeId,
      type: nodeType,
      position: { x, y },
      data: {
        label: node.label,
        nodeType: node.type,
        startLine: node.startLine,
        endLine: node.endLine,
        line: node.startLine,
        isActive,
        isCurrentLine,
      },
    });

    // Create edge from parent
    if (parentId) {
      flowEdges.push({
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: isActive,
        style: { stroke: isActive ? '#6366f1' : '#4b5563' },
      });
    }

    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        processNode(child, depth + 1, nodeId);
      }
    }

    return nodeId;
  }

  // Process all root nodes
  for (const node of astNodes) {
    processNode(node, 0);
  }

  return { nodes: flowNodes, edges: flowEdges };
}

// Empty state component
export function EmptyFlowCanvas() {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-base-300 bg-base-200 flex items-center justify-center">
      <div className="text-center text-base-content/50">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <p className="text-lg font-medium">No visualization yet</p>
        <p className="text-sm">Click "Visualize" to see the execution flow</p>
      </div>
    </div>
  );
}
