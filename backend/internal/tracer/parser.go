package tracer

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

// ParseAST parses Go source code and returns an AST suitable for visualization
func ParseAST(code string) (*ASTResult, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "main.go", code, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	result := &ASTResult{
		Nodes: make([]*ASTNode, 0),
	}

	nodeCounter := 0
	generateID := func(prefix string) string {
		nodeCounter++
		return fmt.Sprintf("%s_%d", prefix, nodeCounter)
	}

	// Process each function declaration
	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok {
			funcNode := &ASTNode{
				ID:        generateID("func"),
				Type:      "function",
				Label:     getFuncLabel(fset, fn),
				StartLine: fset.Position(fn.Pos()).Line,
				EndLine:   fset.Position(fn.End()).Line,
				Children:  make([]*ASTNode, 0),
			}

			// Process function body
			if fn.Body != nil {
				processBlock(fset, fn.Body.List, funcNode, generateID)
			}

			result.Nodes = append(result.Nodes, funcNode)
		}
	}

	return result, nil
}

func processBlock(fset *token.FileSet, stmts []ast.Stmt, parent *ASTNode, generateID func(string) string) {
	for _, stmt := range stmts {
		node := processStatement(fset, stmt, parent.ID, generateID)
		if node != nil {
			parent.Children = append(parent.Children, node)
		}
	}
}

func processStatement(fset *token.FileSet, stmt ast.Stmt, parentID string, generateID func(string) string) *ASTNode {
	switch s := stmt.(type) {
	case *ast.ForStmt:
		return processForStmt(fset, s, parentID, generateID)
	case *ast.IfStmt:
		return processIfStmt(fset, s, parentID, generateID)
	case *ast.AssignStmt:
		return &ASTNode{
			ID:        generateID("assign"),
			Type:      "statement",
			Label:     getStatementText(fset, stmt),
			StartLine: fset.Position(s.Pos()).Line,
			EndLine:   fset.Position(s.End()).Line,
			ParentID:  parentID,
		}
	case *ast.DeclStmt:
		return &ASTNode{
			ID:        generateID("decl"),
			Type:      "statement",
			Label:     getStatementText(fset, stmt),
			StartLine: fset.Position(s.Pos()).Line,
			EndLine:   fset.Position(s.End()).Line,
			ParentID:  parentID,
		}
	case *ast.ExprStmt:
		nodeType := "statement"
		// Detect user-defined function calls (not pkg.Method calls)
		if call, ok := s.X.(*ast.CallExpr); ok {
			if _, ok := call.Fun.(*ast.Ident); ok {
				nodeType = "func_call"
			}
		}
		return &ASTNode{
			ID:        generateID("expr"),
			Type:      nodeType,
			Label:     getStatementText(fset, stmt),
			StartLine: fset.Position(s.Pos()).Line,
			EndLine:   fset.Position(s.End()).Line,
			ParentID:  parentID,
		}
	case *ast.ReturnStmt:
		return &ASTNode{
			ID:        generateID("return"),
			Type:      "statement",
			Label:     getStatementText(fset, stmt),
			StartLine: fset.Position(s.Pos()).Line,
			EndLine:   fset.Position(s.End()).Line,
			ParentID:  parentID,
		}
	case *ast.IncDecStmt:
		return &ASTNode{
			ID:        generateID("incdec"),
			Type:      "statement",
			Label:     getStatementText(fset, stmt),
			StartLine: fset.Position(s.Pos()).Line,
			EndLine:   fset.Position(s.End()).Line,
			ParentID:  parentID,
		}
	default:
		return nil
	}
}

func processForStmt(fset *token.FileSet, s *ast.ForStmt, parentID string, generateID func(string) string) *ASTNode {
	forNode := &ASTNode{
		ID:        generateID("for"),
		Type:      "for",
		Label:     getForLabel(fset, s),
		StartLine: fset.Position(s.Pos()).Line,
		EndLine:   fset.Position(s.End()).Line,
		ParentID:  parentID,
		Children:  make([]*ASTNode, 0),
	}

	// Process for body
	if s.Body != nil {
		processBlock(fset, s.Body.List, forNode, generateID)
	}

	return forNode
}

func processIfStmt(fset *token.FileSet, s *ast.IfStmt, parentID string, generateID func(string) string) *ASTNode {
	ifNode := &ASTNode{
		ID:        generateID("if"),
		Type:      "if",
		Label:     getIfLabel(fset, s),
		StartLine: fset.Position(s.Pos()).Line,
		EndLine:   fset.Position(s.End()).Line,
		ParentID:  parentID,
		Children:  make([]*ASTNode, 0),
	}

	// Process if body
	if s.Body != nil {
		processBlock(fset, s.Body.List, ifNode, generateID)
	}

	// Process else body if exists
	if s.Else != nil {
		elseNode := &ASTNode{
			ID:        generateID("else"),
			Type:      "else",
			Label:     "else",
			StartLine: fset.Position(s.Else.Pos()).Line,
			EndLine:   fset.Position(s.Else.End()).Line,
			ParentID:  ifNode.ID,
			Children:  make([]*ASTNode, 0),
		}

		switch e := s.Else.(type) {
		case *ast.BlockStmt:
			processBlock(fset, e.List, elseNode, generateID)
		case *ast.IfStmt:
			// else if - process recursively
			elseIfNode := processIfStmt(fset, e, elseNode.ID, generateID)
			elseNode.Children = append(elseNode.Children, elseIfNode)
		}

		ifNode.Children = append(ifNode.Children, elseNode)
	}

	return ifNode
}

func getFuncLabel(fset *token.FileSet, fn *ast.FuncDecl) string {
	label := "func " + fn.Name.Name + "("

	// Add parameters
	if fn.Type.Params != nil {
		var params []string
		for _, field := range fn.Type.Params.List {
			typeName := getExprText(field.Type)
			var names []string
			for _, name := range field.Names {
				names = append(names, name.Name)
			}
			if len(names) > 0 {
				params = append(params, strings.Join(names, ", ")+" "+typeName)
			} else {
				params = append(params, typeName)
			}
		}
		label += strings.Join(params, ", ")
	}
	label += ")"

	// Add return type
	if fn.Type.Results != nil && len(fn.Type.Results.List) > 0 {
		var results []string
		for _, field := range fn.Type.Results.List {
			results = append(results, getExprText(field.Type))
		}
		if len(results) == 1 {
			label += " " + results[0]
		} else {
			label += " (" + strings.Join(results, ", ") + ")"
		}
	}

	return label
}

func getExprText(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.ArrayType:
		return "[]" + getExprText(t.Elt)
	case *ast.StarExpr:
		return "*" + getExprText(t.X)
	default:
		return "?"
	}
}

func getForLabel(fset *token.FileSet, s *ast.ForStmt) string {
	var parts []string

	if s.Init != nil {
		parts = append(parts, "for "+getStatementText(fset, s.Init))
	} else {
		parts = append(parts, "for")
	}

	return strings.Join(parts, " ")
}

func getIfLabel(fset *token.FileSet, s *ast.IfStmt) string {
	return "if ..."
}

func getStatementText(fset *token.FileSet, stmt ast.Stmt) string {
	// This is a simplified version - returns a generic label
	// In production, you'd use go/printer to get the actual code
	switch s := stmt.(type) {
	case *ast.AssignStmt:
		if len(s.Lhs) > 0 {
			if ident, ok := s.Lhs[0].(*ast.Ident); ok {
				return ident.Name + " = ..."
			}
		}
		return "assignment"
	case *ast.DeclStmt:
		return "var declaration"
	case *ast.ExprStmt:
		if call, ok := s.X.(*ast.CallExpr); ok {
			if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
				if pkg, ok := sel.X.(*ast.Ident); ok {
					return pkg.Name + "." + sel.Sel.Name + "(...)"
				}
			}
			if ident, ok := call.Fun.(*ast.Ident); ok {
				return ident.Name + "(...)"
			}
		}
		return "expression"
	case *ast.ReturnStmt:
		return "return"
	case *ast.IncDecStmt:
		if ident, ok := s.X.(*ast.Ident); ok {
			if s.Tok == token.INC {
				return ident.Name + "++"
			}
			return ident.Name + "--"
		}
		return "inc/dec"
	default:
		return "statement"
	}
}
