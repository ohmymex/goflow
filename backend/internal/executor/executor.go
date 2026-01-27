package executor

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"strings"

	"github.com/goflow/visualizer/internal/tracer"
)

// CallFrame represents a function call on the call stack
type CallFrame struct {
	FuncName       string
	SavedVars      map[string]interface{}
	SavedTypes     map[string]string
	SavedScope     []string
	SavedReturned  bool
	SavedReturnVal interface{}
}

// ExecuteSimple executes Go code by parsing the AST and simulating execution
// This approach gives us full control over variable tracking and step generation
func ExecuteSimple(code string) ([]tracer.Step, string, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "main.go", code, parser.ParseComments)
	if err != nil {
		return nil, "", fmt.Errorf("parse error: %w", err)
	}

	executor := &simpleExecutor{
		fset:           fset,
		steps:          make([]tracer.Step, 0),
		variables:      make(map[string]interface{}),
		varTypes:       make(map[string]string),
		scopeStack:     []string{"main"},
		output:         &bytes.Buffer{},
		stepIndex:      0,
		loopIterations: make(map[string]int),
		loopCounter:    0,
		functions:      make(map[string]*ast.FuncDecl),
		callStack:      []CallFrame{{FuncName: "main"}},
		maxCallDepth:   50,
	}

	// Pre-scan: register all function declarations
	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Name.Name != "main" {
			executor.functions[fn.Name.Name] = fn
		}
	}

	// Find and execute main function
	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Name.Name == "main" {
			if fn.Body != nil {
				executor.executeBlock(fn.Body.List)
			}
		}
	}

	return executor.steps, executor.output.String(), nil
}

type simpleExecutor struct {
	fset           *token.FileSet
	steps          []tracer.Step
	variables      map[string]interface{}
	varTypes       map[string]string
	scopeStack     []string
	output         *bytes.Buffer
	stepIndex      int
	loopIterations map[string]int
	loopCounter    int
	functions      map[string]*ast.FuncDecl
	callStack      []CallFrame
	maxCallDepth   int
	returnValue    interface{}
	hasReturned    bool
}

func (e *simpleExecutor) executeBlock(stmts []ast.Stmt) {
	for _, stmt := range stmts {
		if e.hasReturned {
			return
		}
		e.executeStmt(stmt)
	}
}

func (e *simpleExecutor) executeStmt(stmt ast.Stmt) {
	switch s := stmt.(type) {
	case *ast.AssignStmt:
		e.executeAssign(s)
	case *ast.DeclStmt:
		e.executeDecl(s)
	case *ast.ForStmt:
		e.executeFor(s)
	case *ast.IfStmt:
		e.executeIf(s)
	case *ast.ExprStmt:
		e.executeExpr(s)
	case *ast.IncDecStmt:
		e.executeIncDec(s)
	case *ast.ReturnStmt:
		e.executeReturn(s)
	}
}

func (e *simpleExecutor) executeAssign(s *ast.AssignStmt) {
	line := e.fset.Position(s.Pos()).Line

	// Evaluate RHS and assign to LHS
	for i, lhs := range s.Lhs {
		if i < len(s.Rhs) {
			value := e.evalExpr(s.Rhs[i])
			
			switch target := lhs.(type) {
			case *ast.Ident:
				// Simple variable assignment: x = value
				e.variables[target.Name] = value
				e.varTypes[target.Name] = fmt.Sprintf("%T", value)
			case *ast.IndexExpr:
				// Slice/array index assignment: arr[i] = value
				if ident, ok := target.X.(*ast.Ident); ok {
					if arr, ok := e.variables[ident.Name].([]int); ok {
						idx := e.evalExpr(target.Index)
						if idxInt, ok := idx.(int); ok && idxInt >= 0 && idxInt < len(arr) {
							arr[idxInt] = value.(int)
							e.variables[ident.Name] = arr
						}
					}
				}
			}
		}
	}

	e.addStep(line, "assign", e.getStatementText(s))
}

func (e *simpleExecutor) executeDecl(s *ast.DeclStmt) {
	line := e.fset.Position(s.Pos()).Line

	if genDecl, ok := s.Decl.(*ast.GenDecl); ok && genDecl.Tok == token.VAR {
		for _, spec := range genDecl.Specs {
			if valueSpec, ok := spec.(*ast.ValueSpec); ok {
				for i, name := range valueSpec.Names {
					var value interface{}
					if i < len(valueSpec.Values) {
						value = e.evalExpr(valueSpec.Values[i])
					} else {
						value = 0 // Default value
					}
					e.variables[name.Name] = value
					e.varTypes[name.Name] = fmt.Sprintf("%T", value)
				}
			}
		}
	}

	e.addStep(line, "declare", e.getStatementText(s))
}

func (e *simpleExecutor) executeFor(s *ast.ForStmt) {
	line := e.fset.Position(s.Pos()).Line
	e.loopCounter++
	loopID := fmt.Sprintf("for_%d", e.loopCounter)

	// Execute init
	if s.Init != nil {
		e.executeStmt(s.Init)
	}

	e.addStep(line, "for_init", "for loop start")

	// Execute loop
	maxIterations := 100 // Safety limit
	iteration := 0

	for iteration < maxIterations {
		if e.hasReturned {
			break
		}

		// Check condition
		if s.Cond != nil {
			condValue := e.evalExpr(s.Cond)
			if b, ok := condValue.(bool); ok && !b {
				break
			}
		}

		iteration++
		e.loopIterations[loopID] = iteration

		// Add condition check step
		e.addStepWithLoop(line, "for_cond", "condition check", loopID, iteration)

		// Execute body
		e.scopeStack = append(e.scopeStack, loopID)
		if s.Body != nil {
			e.executeBlock(s.Body.List)
		}
		e.scopeStack = e.scopeStack[:len(e.scopeStack)-1]

		if e.hasReturned {
			break
		}

		// Execute post
		if s.Post != nil {
			e.executeStmt(s.Post)
		}
	}
}

func (e *simpleExecutor) executeIf(s *ast.IfStmt) {
	line := e.fset.Position(s.Pos()).Line

	e.addStep(line, "if_cond", "if condition")

	condValue := e.evalExpr(s.Cond)
	if b, ok := condValue.(bool); ok && b {
		if s.Body != nil {
			e.executeBlock(s.Body.List)
		}
	} else if s.Else != nil {
		switch el := s.Else.(type) {
		case *ast.BlockStmt:
			e.executeBlock(el.List)
		case *ast.IfStmt:
			e.executeIf(el)
		}
	}
}

func (e *simpleExecutor) executeExpr(s *ast.ExprStmt) {
	line := e.fset.Position(s.Pos()).Line
	var stepOutput string

	if call, ok := s.X.(*ast.CallExpr); ok {
		// Check for user-defined function call as statement (e.g., myFunc(x))
		if ident, ok := call.Fun.(*ast.Ident); ok {
			if _, isUserFunc := e.functions[ident.Name]; isUserFunc {
				e.executeUserFunc(e.functions[ident.Name], call)
				return
			}
		}

		// Check for fmt.Print calls
		if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
			if pkg, ok := sel.X.(*ast.Ident); ok && pkg.Name == "fmt" {
				// Evaluate and capture output
				var args []interface{}
				for _, arg := range call.Args {
					args = append(args, e.evalExpr(arg))
				}

				switch sel.Sel.Name {
				case "Println":
					stepOutput = fmt.Sprintln(args...)
				case "Print":
					stepOutput = fmt.Sprint(args...)
				case "Printf":
					if len(args) > 0 {
						if format, ok := args[0].(string); ok {
							stepOutput = fmt.Sprintf(format, args[1:]...)
						}
					}
				}

				// Add to total output
				e.output.WriteString(stepOutput)
			}
		}
	}

	e.addStepWithOutput(line, "call", e.getStatementText(s), stepOutput)
}

func (e *simpleExecutor) executeIncDec(s *ast.IncDecStmt) {
	line := e.fset.Position(s.Pos()).Line

	if ident, ok := s.X.(*ast.Ident); ok {
		if val, ok := e.variables[ident.Name]; ok {
			if intVal, ok := val.(int); ok {
				if s.Tok == token.INC {
					e.variables[ident.Name] = intVal + 1
				} else {
					e.variables[ident.Name] = intVal - 1
				}
			}
		}
	}

	e.addStep(line, "assign", e.getStatementText(s))
}

func (e *simpleExecutor) executeReturn(s *ast.ReturnStmt) {
	line := e.fset.Position(s.Pos()).Line

	// Evaluate return value if present
	if len(s.Results) > 0 {
		e.returnValue = e.evalExpr(s.Results[0])
	}
	e.hasReturned = true

	e.addStep(line, "func_return", e.getStatementText(s))
}

func (e *simpleExecutor) evalExpr(expr ast.Expr) interface{} {
	switch ex := expr.(type) {
	case *ast.BasicLit:
		switch ex.Kind {
		case token.INT:
			var val int
			fmt.Sscanf(ex.Value, "%d", &val)
			return val
		case token.STRING:
			// Remove quotes
			return strings.Trim(ex.Value, `"`)
		case token.FLOAT:
			var val float64
			fmt.Sscanf(ex.Value, "%f", &val)
			return val
		}
	case *ast.Ident:
		if val, ok := e.variables[ex.Name]; ok {
			return val
		}
		if ex.Name == "true" {
			return true
		}
		if ex.Name == "false" {
			return false
		}
		return 0
	case *ast.BinaryExpr:
		left := e.evalExpr(ex.X)
		right := e.evalExpr(ex.Y)
		return e.evalBinary(left, right, ex.Op)
	case *ast.ParenExpr:
		return e.evalExpr(ex.X)
	case *ast.CompositeLit:
		// Handle slice/array literals like []int{5, 2, 8, 1, 9}
		return e.evalCompositeLit(ex)
	case *ast.IndexExpr:
		// Handle slice/array indexing like arr[i]
		return e.evalIndexExpr(ex)
	case *ast.CallExpr:
		// Handle built-in functions like len()
		return e.evalCallExpr(ex)
	}
	return nil
}

func (e *simpleExecutor) evalCompositeLit(lit *ast.CompositeLit) interface{} {
	// Check if it's a slice type
	if arrayType, ok := lit.Type.(*ast.ArrayType); ok {
		// Check element type
		if ident, ok := arrayType.Elt.(*ast.Ident); ok {
			switch ident.Name {
			case "int":
				result := make([]int, 0, len(lit.Elts))
				for _, elt := range lit.Elts {
					val := e.evalExpr(elt)
					if intVal, ok := val.(int); ok {
						result = append(result, intVal)
					}
				}
				return result
			case "string":
				result := make([]string, 0, len(lit.Elts))
				for _, elt := range lit.Elts {
					val := e.evalExpr(elt)
					if strVal, ok := val.(string); ok {
						result = append(result, strVal)
					}
				}
				return result
			case "float64":
				result := make([]float64, 0, len(lit.Elts))
				for _, elt := range lit.Elts {
					val := e.evalExpr(elt)
					if floatVal, ok := val.(float64); ok {
						result = append(result, floatVal)
					}
				}
				return result
			}
		}
	}
	return nil
}

func (e *simpleExecutor) evalIndexExpr(idx *ast.IndexExpr) interface{} {
	// Get the array/slice
	arr := e.evalExpr(idx.X)
	// Get the index
	index := e.evalExpr(idx.Index)
	
	if indexInt, ok := index.(int); ok {
		switch a := arr.(type) {
		case []int:
			if indexInt >= 0 && indexInt < len(a) {
				return a[indexInt]
			}
		case []string:
			if indexInt >= 0 && indexInt < len(a) {
				return a[indexInt]
			}
		case []float64:
			if indexInt >= 0 && indexInt < len(a) {
				return a[indexInt]
			}
		}
	}
	return nil
}

func (e *simpleExecutor) evalCallExpr(call *ast.CallExpr) interface{} {
	if ident, ok := call.Fun.(*ast.Ident); ok {
		// Check user-defined functions first
		if fn, ok := e.functions[ident.Name]; ok {
			return e.executeUserFunc(fn, call)
		}

		// Handle built-in functions
		switch ident.Name {
		case "len":
			if len(call.Args) > 0 {
				arg := e.evalExpr(call.Args[0])
				switch a := arg.(type) {
				case []int:
					return len(a)
				case []string:
					return len(a)
				case []float64:
					return len(a)
				case string:
					return len(a)
				}
			}
		}
	}
	return nil
}

func (e *simpleExecutor) executeUserFunc(fn *ast.FuncDecl, call *ast.CallExpr) interface{} {
	// Safety: check call depth
	if len(e.callStack) >= e.maxCallDepth {
		line := e.fset.Position(call.Pos()).Line
		e.addStep(line, "func_call", fn.Name.Name+"(...) — max call depth reached")
		return nil
	}

	// Evaluate arguments in caller scope
	args := make([]interface{}, len(call.Args))
	for i, arg := range call.Args {
		args[i] = e.evalExpr(arg)
	}

	// Record func_call step (in caller context)
	line := e.fset.Position(call.Pos()).Line
	e.addStep(line, "func_call", fn.Name.Name+"(...)")

	// Save caller state (deep copy to prevent corruption during recursion)
	savedVars := make(map[string]interface{}, len(e.variables))
	for k, v := range e.variables {
		savedVars[k] = v
	}
	savedTypes := make(map[string]string, len(e.varTypes))
	for k, v := range e.varTypes {
		savedTypes[k] = v
	}
	savedScope := make([]string, len(e.scopeStack))
	copy(savedScope, e.scopeStack)

	frame := CallFrame{
		FuncName:       fn.Name.Name,
		SavedVars:      savedVars,
		SavedTypes:     savedTypes,
		SavedScope:     savedScope,
		SavedReturned:  e.hasReturned,
		SavedReturnVal: e.returnValue,
	}

	// Push call frame
	e.callStack = append(e.callStack, frame)

	// Create fresh scope for callee
	e.variables = make(map[string]interface{})
	e.varTypes = make(map[string]string)
	e.scopeStack = []string{fn.Name.Name}

	// Bind parameters
	if fn.Type.Params != nil {
		argIdx := 0
		for _, field := range fn.Type.Params.List {
			typeName := e.getTypeString(field.Type)
			for _, name := range field.Names {
				if argIdx < len(args) {
					e.variables[name.Name] = args[argIdx]
					e.varTypes[name.Name] = typeName
					argIdx++
				}
			}
		}
	}

	// Record func_enter step (in callee context)
	if fn.Body != nil {
		enterLine := e.fset.Position(fn.Body.Pos()).Line
		e.addStep(enterLine, "func_enter", "enter "+fn.Name.Name)
	}

	// Execute function body
	e.hasReturned = false
	e.returnValue = nil
	if fn.Body != nil {
		e.executeBlock(fn.Body.List)
	}

	// Capture return value
	result := e.returnValue

	// Pop call frame: restore caller state
	e.callStack = e.callStack[:len(e.callStack)-1]
	e.variables = frame.SavedVars
	e.varTypes = frame.SavedTypes
	e.scopeStack = frame.SavedScope
	e.hasReturned = frame.SavedReturned
	e.returnValue = frame.SavedReturnVal

	return result
}

func (e *simpleExecutor) getTypeString(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		return "[]" + e.getTypeString(t.Elt)
	default:
		return "auto"
	}
}

func (e *simpleExecutor) evalBinary(left, right interface{}, op token.Token) interface{} {
	// Handle int operations
	if l, ok := left.(int); ok {
		if r, ok := right.(int); ok {
			switch op {
			case token.ADD:
				return l + r
			case token.SUB:
				return l - r
			case token.MUL:
				return l * r
			case token.QUO:
				if r != 0 {
					return l / r
				}
				return 0
			case token.REM:
				if r != 0 {
					return l % r
				}
				return 0
			case token.LSS:
				return l < r
			case token.LEQ:
				return l <= r
			case token.GTR:
				return l > r
			case token.GEQ:
				return l >= r
			case token.EQL:
				return l == r
			case token.NEQ:
				return l != r
			}
		}
	}

	// Handle bool operations
	if l, ok := left.(bool); ok {
		if r, ok := right.(bool); ok {
			switch op {
			case token.LAND:
				return l && r
			case token.LOR:
				return l || r
			}
		}
	}

	return nil
}

func (e *simpleExecutor) addStep(line int, stmtType, statement string) {
	e.addStepWithOutput(line, stmtType, statement, "")
}

func (e *simpleExecutor) currentFuncName() string {
	if len(e.callStack) > 0 {
		return e.callStack[len(e.callStack)-1].FuncName
	}
	return "main"
}

func (e *simpleExecutor) captureCallStack() []string {
	stack := make([]string, len(e.callStack))
	for i, frame := range e.callStack {
		stack[i] = frame.FuncName
	}
	return stack
}

func (e *simpleExecutor) addStepWithOutput(line int, stmtType, statement, output string) {
	step := tracer.Step{
		StepIndex:     e.stepIndex,
		Line:          line,
		Statement:     statement,
		StatementType: stmtType,
		Variables:     e.captureVariables(),
		ScopeStack:    append([]string{}, e.scopeStack...),
		Output:        output,
		CallStack:     e.captureCallStack(),
		FunctionName:  e.currentFuncName(),
	}
	e.steps = append(e.steps, step)
	e.stepIndex++
}

func (e *simpleExecutor) addStepWithLoop(line int, stmtType, statement, loopID string, iteration int) {
	step := tracer.Step{
		StepIndex:     e.stepIndex,
		Line:          line,
		Statement:     statement,
		StatementType: stmtType,
		Variables:     e.captureVariables(),
		ScopeStack:    append([]string{}, e.scopeStack...),
		LoopIteration: &tracer.LoopIteration{
			LoopID:    loopID,
			Iteration: iteration,
		},
		CallStack:    e.captureCallStack(),
		FunctionName: e.currentFuncName(),
	}
	e.steps = append(e.steps, step)
	e.stepIndex++
}

func (e *simpleExecutor) captureVariables() []tracer.Variable {
	vars := make([]tracer.Variable, 0, len(e.variables))
	scope := strings.Join(e.scopeStack, ".")

	for name, value := range e.variables {
		vars = append(vars, tracer.Variable{
			Name:  name,
			Type:  e.varTypes[name],
			Value: value,
			Scope: scope,
		})
	}

	return vars
}

func (e *simpleExecutor) getStatementText(stmt ast.Stmt) string {
	var buf bytes.Buffer
	printer.Fprint(&buf, e.fset, stmt)
	return buf.String()
}
