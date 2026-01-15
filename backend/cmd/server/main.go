package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/goflow/visualizer/internal/executor"
	"github.com/goflow/visualizer/internal/tracer"
)

// TraceRequest represents the incoming request body
type TraceRequest struct {
	Code string `json:"code"`
}

// TraceResponse represents the execution trace response
type TraceResponse struct {
	Success     bool              `json:"success"`
	Error       string            `json:"error,omitempty"`
	SourceCode  string            `json:"sourceCode"`
	TotalSteps  int               `json:"totalSteps"`
	AST         *tracer.ASTResult `json:"ast"`
	Trace       []tracer.Step     `json:"trace"`
	FinalOutput string            `json:"finalOutput"`
}

func main() {
	mux := http.NewServeMux()

	// CORS middleware
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	// Health check endpoint
	mux.HandleFunc("/health", corsHandler(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))

	// Main trace endpoint
	mux.HandleFunc("/api/trace", corsHandler(handleTrace))

	log.Println("GoFlow server starting on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func handleTrace(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TraceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body: "+err.Error())
		return
	}

	if req.Code == "" {
		sendError(w, "Code cannot be empty")
		return
	}

	// Step 1: Parse and analyze AST
	astResult, err := tracer.ParseAST(req.Code)
	if err != nil {
		sendError(w, "Parse error: "+err.Error())
		return
	}

	// Step 2: Execute using simple AST-based executor (more reliable for visualization)
	trace, output, err := executor.ExecuteSimple(req.Code)
	if err != nil {
		sendError(w, "Execution error: "+err.Error())
		return
	}

	response := TraceResponse{
		Success:     true,
		SourceCode:  req.Code,
		TotalSteps:  len(trace),
		AST:         astResult,
		Trace:       trace,
		FinalOutput: output,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func sendError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(TraceResponse{
		Success: false,
		Error:   msg,
	})
}
