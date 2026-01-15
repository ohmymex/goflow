package tracer

// Variable represents a variable snapshot at a point in execution
type Variable struct {
	Name  string      `json:"name"`
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
	Scope string      `json:"scope"`
}

// LoopIteration tracks which iteration of a loop we're in
type LoopIteration struct {
	LoopID    string `json:"loopId"`
	Iteration int    `json:"iteration"`
}

// Step represents a single execution step
type Step struct {
	StepIndex     int            `json:"stepIndex"`
	Line          int            `json:"line"`
	Column        int            `json:"column,omitempty"`
	Statement     string         `json:"statement"`
	StatementType string         `json:"statementType"`
	Variables     []Variable     `json:"variables"`
	ScopeStack    []string       `json:"scopeStack"`
	Output        string         `json:"output,omitempty"`
	LoopIteration *LoopIteration `json:"loopIteration,omitempty"`
}

// ASTNode represents a node in the visualization tree
type ASTNode struct {
	ID        string     `json:"id"`
	Type      string     `json:"type"`
	Label     string     `json:"label"`
	StartLine int        `json:"startLine"`
	EndLine   int        `json:"endLine"`
	Children  []*ASTNode `json:"children,omitempty"`
	ParentID  string     `json:"parentId,omitempty"`
}

// ASTResult contains the parsed AST for visualization
type ASTResult struct {
	Nodes []*ASTNode `json:"nodes"`
}
