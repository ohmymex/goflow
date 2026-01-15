package tracer

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"strconv"
	"strings"
)

// InstrumentCode takes Go source code and instruments it with trace calls
func InstrumentCode(code string) (string, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "main.go", code, parser.ParseComments)
	if err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}

	// Track variable declarations for each scope
	instrumenter := &codeInstrumenter{
		fset:       fset,
		loopDepth:  0,
		loopCount:  0,
		scopeStack: []string{"main"},
		variables:  make(map[string][]varInfo),
	}

	// Add trace package import and runtime code
	instrumenter.addTraceImport(file)

	// Instrument function bodies
	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Name.Name == "main" {
			if fn.Body != nil {
				fn.Body.List = instrumenter.instrumentBlock(fn.Body.List, "main")
			}
		}
	}

	// Print the modified AST
	var buf bytes.Buffer
	if err := printer.Fprint(&buf, fset, file); err != nil {
		return "", fmt.Errorf("print error: %w", err)
	}

	// Prepend the trace runtime code
	result := getTraceRuntime() + "\n" + buf.String()

	return result, nil
}

type varInfo struct {
	name     string
	typeName string
}

type codeInstrumenter struct {
	fset       *token.FileSet
	loopDepth  int
	loopCount  int
	scopeStack []string
	variables  map[string][]varInfo // scope -> variables
}

func (c *codeInstrumenter) addTraceImport(file *ast.File) {
	// Check if fmt is already imported
	hasFmt := false
	for _, imp := range file.Imports {
		if imp.Path.Value == `"fmt"` {
			hasFmt = true
			break
		}
	}

	if !hasFmt {
		// Add fmt import
		fmtImport := &ast.ImportSpec{
			Path: &ast.BasicLit{
				Kind:  token.STRING,
				Value: `"fmt"`,
			},
		}
		if len(file.Decls) > 0 {
			if genDecl, ok := file.Decls[0].(*ast.GenDecl); ok && genDecl.Tok == token.IMPORT {
				genDecl.Specs = append(genDecl.Specs, fmtImport)
			}
		}
	}
}

func (c *codeInstrumenter) instrumentBlock(stmts []ast.Stmt, scope string) []ast.Stmt {
	var result []ast.Stmt

	for _, stmt := range stmts {
		instrumented := c.instrumentStatement(stmt, scope)
		result = append(result, instrumented...)
	}

	return result
}

func (c *codeInstrumenter) instrumentStatement(stmt ast.Stmt, scope string) []ast.Stmt {
	var result []ast.Stmt

	switch s := stmt.(type) {
	case *ast.AssignStmt:
		// Track new variables from short declarations
		if s.Tok == token.DEFINE {
			for _, lhs := range s.Lhs {
				if ident, ok := lhs.(*ast.Ident); ok {
					c.addVariable(scope, ident.Name, "auto")
				}
			}
		}
		result = append(result, stmt)
		result = append(result, c.createTraceCall(s.Pos(), "assign", scope))

	case *ast.DeclStmt:
		// Track variable declarations
		if genDecl, ok := s.Decl.(*ast.GenDecl); ok && genDecl.Tok == token.VAR {
			for _, spec := range genDecl.Specs {
				if valueSpec, ok := spec.(*ast.ValueSpec); ok {
					typeName := "auto"
					if valueSpec.Type != nil {
						typeName = c.getTypeName(valueSpec.Type)
					}
					for _, name := range valueSpec.Names {
						c.addVariable(scope, name.Name, typeName)
					}
				}
			}
		}
		result = append(result, stmt)
		result = append(result, c.createTraceCall(s.Pos(), "declare", scope))

	case *ast.ForStmt:
		c.loopCount++
		loopID := fmt.Sprintf("for_%d", c.loopCount)
		c.loopDepth++
		newScope := scope + "." + loopID

		// Handle init statement
		if s.Init != nil {
			initStmts := c.instrumentStatement(s.Init, newScope)
			if len(initStmts) > 0 {
				s.Init = initStmts[0]
			}
		}

		// Instrument loop body
		if s.Body != nil {
			// Add trace at start of each iteration
			iterTrace := c.createTraceCallWithLoop(s.Body.Pos(), "for_cond", newScope, loopID)
			instrumentedBody := c.instrumentBlock(s.Body.List, newScope)
			s.Body.List = append([]ast.Stmt{iterTrace}, instrumentedBody...)
		}

		c.loopDepth--
		result = append(result, c.createTraceCall(s.Pos(), "for_init", scope))
		result = append(result, s)

	case *ast.IfStmt:
		result = append(result, c.createTraceCall(s.Pos(), "if_cond", scope))

		// Instrument if body
		if s.Body != nil {
			s.Body.List = c.instrumentBlock(s.Body.List, scope)
		}

		// Instrument else body
		if s.Else != nil {
			switch e := s.Else.(type) {
			case *ast.BlockStmt:
				e.List = c.instrumentBlock(e.List, scope)
			case *ast.IfStmt:
				instrumented := c.instrumentStatement(e, scope)
				if len(instrumented) > 0 {
					s.Else = instrumented[len(instrumented)-1]
				}
			}
		}
		result = append(result, s)

	case *ast.ExprStmt:
		result = append(result, stmt)
		result = append(result, c.createTraceCall(s.Pos(), "call", scope))

	case *ast.IncDecStmt:
		result = append(result, stmt)
		result = append(result, c.createTraceCall(s.Pos(), "assign", scope))

	case *ast.ReturnStmt:
		result = append(result, c.createTraceCall(s.Pos(), "return", scope))
		result = append(result, stmt)

	default:
		result = append(result, stmt)
	}

	return result
}

func (c *codeInstrumenter) addVariable(scope, name, typeName string) {
	if c.variables[scope] == nil {
		c.variables[scope] = make([]varInfo, 0)
	}
	// Check if variable already exists
	for _, v := range c.variables[scope] {
		if v.name == name {
			return
		}
	}
	c.variables[scope] = append(c.variables[scope], varInfo{name: name, typeName: typeName})
}

func (c *codeInstrumenter) getTypeName(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		return "[]" + c.getTypeName(t.Elt)
	case *ast.MapType:
		return "map[" + c.getTypeName(t.Key) + "]" + c.getTypeName(t.Value)
	default:
		return "auto"
	}
}

func (c *codeInstrumenter) createTraceCall(pos token.Pos, stmtType, scope string) ast.Stmt {
	line := c.fset.Position(pos).Line

	// Build variable capture string
	varCaptures := c.buildVarCaptures(scope)

	// Create: __trace__(line, stmtType, scope, vars...)
	return &ast.ExprStmt{
		X: &ast.CallExpr{
			Fun: &ast.Ident{Name: "__trace__"},
			Args: []ast.Expr{
				&ast.BasicLit{Kind: token.INT, Value: strconv.Itoa(line)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, stmtType)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, scope)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, varCaptures)},
			},
		},
	}
}

func (c *codeInstrumenter) createTraceCallWithLoop(pos token.Pos, stmtType, scope, loopID string) ast.Stmt {
	line := c.fset.Position(pos).Line
	varCaptures := c.buildVarCaptures(scope)

	return &ast.ExprStmt{
		X: &ast.CallExpr{
			Fun: &ast.Ident{Name: "__traceLoop__"},
			Args: []ast.Expr{
				&ast.BasicLit{Kind: token.INT, Value: strconv.Itoa(line)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, stmtType)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, scope)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, loopID)},
				&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf(`"%s"`, varCaptures)},
			},
		},
	}
}

func (c *codeInstrumenter) buildVarCaptures(scope string) string {
	var vars []string

	// Collect variables from current scope and parent scopes
	scopes := strings.Split(scope, ".")
	for i := range scopes {
		checkScope := strings.Join(scopes[:i+1], ".")
		if scopeVars, ok := c.variables[checkScope]; ok {
			for _, v := range scopeVars {
				vars = append(vars, v.name)
			}
		}
	}

	return strings.Join(vars, ",")
}

func getTraceRuntime() string {
	return `
// GoFlow Trace Runtime
var __traceData__ []map[string]interface{}
var __traceOutput__ string
var __loopIterations__ = make(map[string]int)
var __stepIndex__ int

func __trace__(line int, stmtType, scope, varNames string) {
	step := map[string]interface{}{
		"stepIndex":     __stepIndex__,
		"line":          line,
		"statementType": stmtType,
		"scopeStack":    strings.Split(scope, "."),
	}
	__traceData__ = append(__traceData__, step)
	__stepIndex__++
}

func __traceLoop__(line int, stmtType, scope, loopID, varNames string) {
	__loopIterations__[loopID]++
	step := map[string]interface{}{
		"stepIndex":     __stepIndex__,
		"line":          line,
		"statementType": stmtType,
		"scopeStack":    strings.Split(scope, "."),
		"loopIteration": map[string]interface{}{
			"loopId":    loopID,
			"iteration": __loopIterations__[loopID],
		},
	}
	__traceData__ = append(__traceData__, step)
	__stepIndex__++
}

func __captureOutput__(s string) {
	__traceOutput__ += s
	fmt.Print(s)
}

func __getTrace__() []map[string]interface{} {
	return __traceData__
}

func __getOutput__() string {
	return __traceOutput__
}
`
}
