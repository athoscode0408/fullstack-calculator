.PHONY: backend frontend test coverage build docker-up docker-down

backend:
	cd backend && go run ./cmd/server

frontend:
	cd frontend && npm install && npm run dev

test:
	cd backend && go test ./...
	cd frontend && npm test

coverage:
	cd backend && go test ./internal/... -coverprofile=coverage.out && go tool cover -func=coverage.out
	cd frontend && npm run coverage

build:
	cd backend && go build ./cmd/server
	cd frontend && npm run build

docker-up:
	docker compose up --build

docker-down:
	docker compose down
