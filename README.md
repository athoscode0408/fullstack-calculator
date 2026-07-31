# Full-Stack Calculator

A maintainable calculator application with a **React + TypeScript** frontend and a **Go REST microservice**. The backend owns arithmetic and validation; the frontend provides an accessible, responsive user experience and consumes the API.

## Features

- Addition, subtraction, multiplication, and division
- Exponentiation, square root, and percentage
- Client-side validation and clear user-facing errors
- Server-side validation with stable JSON error codes
- Responsive interface with basic mobile support
- Go domain tests and HTTP handler tests
- React component and API-client tests with Vitest
- Backend and frontend coverage commands
- Docker Compose deployment and GitHub Actions CI
- Graceful backend shutdown, request limits, timeouts, CORS, and structured logging

## Repository Structure

```text
.
├── backend/
│   ├── cmd/server/                 # Application entry point
│   ├── internal/calculator/        # Domain logic and unit tests
│   ├── internal/httpapi/           # REST handlers, middleware, and tests
│   ├── coverage.out                # Generated Go coverage profile
│   └── Dockerfile
├── frontend/
│   ├── src/components/             # Calculator UI and component tests
│   ├── src/services/               # Typed REST API client and tests
│   ├── src/types/                  # Shared frontend API types
│   ├── nginx.conf                  # Static hosting and API reverse proxy
│   └── Dockerfile
├── .github/workflows/ci.yml
├── AI_PROMPTS.md
├── docker-compose.yml
└── Makefile
```

## Prerequisites

For local development:

- Go 1.23 or newer
- Node.js 22 or newer
- npm 10 or newer

For containerized execution:

- Docker with Docker Compose

## Run Locally

### 1. Start the Go backend

```bash
cd backend
go run ./cmd/server
```

The API starts at `http://localhost:8080`.

Optional environment variables:

```bash
PORT=8080
ALLOWED_ORIGIN=http://localhost:5173
```

### 2. Start the React frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Go service at `http://localhost:8080`.

## Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3000`. Nginx serves the React build and proxies `/api` to the backend container.

Stop the application with:

```bash
docker compose down
```

## API

### Health check

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok"
}
```

### Calculate

```http
POST /api/v1/calculate
Content-Type: application/json
```

Request fields:

| Field | Type | Required | Description |
|---|---:|---:|---|
| `operation` | string | Yes | One of `add`, `subtract`, `multiply`, `divide`, `power`, `square_root`, or `percentage` |
| `a` | number | Yes | First operand |
| `b` | number | For binary operations | Second operand; omitted for `square_root` |

### cURL examples

Addition:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"add","a":12,"b":8}'
```

```json
{
  "operation": "add",
  "result": 20
}
```

Square root:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"square_root","a":81}'
```

```json
{
  "operation": "square_root",
  "result": 9
}
```

Percentage — defined as **A percent of B**:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"percentage","a":15,"b":200}'
```

```json
{
  "operation": "percentage",
  "result": 30
}
```

Division-by-zero response:

```json
{
  "error": {
    "code": "division_by_zero",
    "message": "cannot divide by zero"
  }
}
```

Domain and validation failures return HTTP `422`. Malformed JSON returns HTTP `400`. Unexpected server failures return HTTP `500`.

## Tests

### Backend

```bash
cd backend
go test ./... -race
```

Generate a coverage profile for the domain and HTTP layers:

```bash
go test ./internal/... -coverprofile=coverage.out
go tool cover -func=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

The checked-in generated backend profile reports **92.5% statement coverage** across the domain and HTTP packages.

### Frontend

```bash
cd frontend
npm install
npm test
```

Generate text, HTML, and LCOV coverage:

```bash
npm run coverage
```

The HTML report is written to `frontend/coverage/index.html`.

### Run all tests

```bash
make test
```

## Design Decisions

### One calculation endpoint

A single typed endpoint avoids nearly identical route handlers for each operation while preserving an explicit operation contract. Adding a new operation requires updating the domain switch, frontend metadata, and tests rather than introducing another transport path.

### Domain logic is independent from HTTP

`internal/calculator` contains no HTTP types. The handler depends on a small interface, which makes arithmetic behavior and transport behavior independently testable and keeps business rules reusable.

### Pointer operands in Go

Operands use `*float64` in the API request model so the service can distinguish a missing field from a valid value of zero. This matters for division-by-zero handling and required-field validation.

### Stable error envelope

Errors use a consistent shape:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human-readable explanation"
  }
}
```

The frontend can display the message while retaining a code for future localized or operation-specific handling.

### Percentage assumption

`percentage(a, b)` means **a percent of b**, calculated as `(a / 100) * b`. This is stated in both the UI and API documentation to remove ambiguity.

### Numeric scope

The application uses IEEE-754 double-precision values (`float64` in Go and `number` in JavaScript), which is appropriate for a general calculator exercise. It is not intended for exact financial arithmetic, where decimal or fixed-point representations would be preferable.

### Frontend API isolation

The React component imports a typed API client rather than calling `fetch` inline. This keeps networking and response parsing separate from rendering and makes both layers easier to test.

### Deployment approach

In development, Vite proxies API calls. In Docker, Nginx serves the static frontend and reverse-proxies `/api` to the Go container. The browser therefore uses one origin, avoiding production CORS complexity.

## Assumptions and Trade-offs

- Authentication, persistence, and calculation history are out of scope.
- Floating-point rounding follows native Go and JavaScript behavior.
- Rate limiting and distributed tracing would be useful for a public service but are intentionally omitted for the assignment scope.
- The API rejects unknown JSON fields to catch client mistakes early.
- The server limits request bodies to 1 MiB and configures read/write/idle timeouts.

## AI Usage

The prompts used during implementation are documented in [`AI_PROMPTS.md`](AI_PROMPTS.md), as requested in the assignment.

## Suggested Repository Submission Steps

```bash
git init
git add .
git commit -m "Build full-stack React and Go calculator"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

Replace the placeholder module path in `backend/go.mod` and Go imports with your final repository path when desired. The current path works locally without modification.
