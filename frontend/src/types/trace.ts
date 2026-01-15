// Variable snapshot at a point in execution
export interface Variable {
  name: string;
  type: string;
  value: unknown;
  scope: string;
}

// Loop iteration tracking
export interface LoopIteration {
  loopId: string;
  iteration: number;
}

// Single execution step
export interface TraceStep {
  stepIndex: number;
  line: number;
  column?: number;
  statement: string;
  statementType: StatementType;
  variables: Variable[];
  scopeStack: string[];
  output?: string;
  loopIteration?: LoopIteration;
}

export type StatementType =
  | 'assign'
  | 'declare'
  | 'for_init'
  | 'for_cond'
  | 'for_post'
  | 'if_cond'
  | 'if_body'
  | 'else_body'
  | 'call'
  | 'return'
  | 'break'
  | 'continue';

// AST node for visualization
export interface ASTNode {
  id: string;
  type: 'function' | 'for' | 'if' | 'else' | 'statement' | 'block';
  label: string;
  startLine: number;
  endLine: number;
  children?: ASTNode[];
  parentId?: string;
}

// Complete trace response from backend
export interface TraceResponse {
  success: boolean;
  error?: string;
  sourceCode: string;
  totalSteps: number;
  ast: {
    nodes: ASTNode[];
  };
  trace: TraceStep[];
  finalOutput: string;
}

// Request to trace endpoint
export interface TraceRequest {
  code: string;
}
