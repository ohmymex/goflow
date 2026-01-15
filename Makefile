.PHONY: all backend frontend dev clean install

# Default target - run both backend and frontend
all: dev

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Run backend server
backend:
	@echo "Starting Go backend on :8080..."
	cd backend && go run ./cmd/server

# Run frontend dev server
frontend:
	@echo "Starting Next.js frontend on :3000..."
	cd frontend && npm run dev

# Run both in development mode (requires tmux or run in separate terminals)
dev:
	@echo "Starting GoFlow..."
	@echo "Run 'make backend' in one terminal"
	@echo "Run 'make frontend' in another terminal"
	@echo ""
	@echo "Or use: make dev-all (requires concurrently npm package)"

# Build for production
build:
	@echo "Building backend..."
	cd backend && go build -o ../bin/goflow-server ./cmd/server
	@echo "Building frontend..."
	cd frontend && npm run build

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf frontend/.next
	rm -rf frontend/node_modules

# Run tests
test:
	cd backend && go test ./...
