# AI Prompts and Development Commands

This document records the AI-assisted prompts and developer commands used to build the calculator project progressively across five milestones. The prompts are grouped by milestone so the implementation process can be reviewed from the initial skeleton through the final submission.

> Note: AI assistance was used for planning, implementation suggestions, review, and documentation. All generated code was reviewed, tested, and adjusted before inclusion.

---

## Milestone 1 — Initialize the Project Skeleton

### Goal

Create a minimal full-stack repository structure with a React and TypeScript frontend and a Go backend, without implementing calculator behavior yet.

### Primary AI prompt

```text
Create the initial skeleton for a full-stack calculator take-home assignment.

Requirements:
- Frontend: React, TypeScript, and Vite.
- Backend: Go using the standard net/http package.
- Use separate frontend and backend directories.
- Add a root README.md, .gitignore, and Makefile.
- Add placeholder entry points that compile and run.
- Keep the structure simple and appropriate for a 2–4 hour assignment.
- Do not implement calculator operations yet.
- Explain the purpose of each top-level folder.
```

### Follow-up editing prompts

```text
Review the proposed folder structure and remove unnecessary abstractions or dependencies. Keep only files that will be useful for the calculator assignment.
```

```text
Create a minimal React page that confirms the frontend is running and a minimal Go HTTP server with a placeholder health endpoint.
```

```text
Add a root README skeleton with sections for overview, prerequisites, setup, API usage, testing, Docker, design decisions, and AI prompts. Leave unfinished sections clearly marked.
```

### Developer commands

```bash
mkdir fullstack-calculator
cd fullstack-calculator

git init
mkdir backend frontend

cd frontend
npm create vite@latest . -- --template react-ts
npm install
cd ..

cd backend
go mod init fullstack-calculator/backend
mkdir -p cmd/server internal/calculator internal/httpapi
cd ..

git add .
git commit -m "chore: initialize full-stack calculator project"
```

### Milestone validation commands

```bash
cd frontend
npm run build

cd ../backend
go test ./...
go run ./cmd/server
```

---

## Milestone 2 — Implement the Go Calculator API

### Goal

Build and test the backend domain service and REST API before connecting the frontend.

### Primary AI prompt

```text
Implement the backend for the calculator project in Go.

Functional requirements:
- Support addition, subtraction, multiplication, division, exponentiation, square root, and percentage.
- Expose POST /api/v1/calculate.
- Expose GET /api/v1/health.
- Accept and return JSON.
- Use operation names: add, subtract, multiply, divide, power, sqrt, percentage.
- Define percentage as A percent of B: (A / 100) * B.

Architecture requirements:
- Keep arithmetic rules independent from HTTP handlers.
- Put calculator behavior in internal/calculator.
- Put transport logic in internal/httpapi.
- Use small interfaces or concrete services only where they improve testability.
- Prefer the Go standard library over a web framework.

Validation requirements:
- Reject malformed JSON.
- Reject unsupported operations.
- Reject missing required operands.
- Prevent division by zero.
- Prevent square roots of negative values.
- Reject NaN or infinite results.
- Return consistent structured JSON errors.

Testing requirements:
- Add table-driven unit tests for calculator operations and edge cases.
- Add httptest-based tests for the HTTP handlers.
```

### Follow-up editing prompts

```text
Review the calculator service for edge cases involving floating-point overflow, NaN, infinity, negative square roots, and division by zero. Return domain errors that HTTP code can map cleanly.
```

```text
Design a small JSON error contract with a stable error code and human-readable message. Map invalid requests to 400, invalid mathematical operations to 422 where appropriate, unsupported methods to 405, and unexpected failures to 500.
```

```text
Add CORS middleware suitable for a local Vite frontend at localhost:5173. Handle OPTIONS requests without weakening validation on normal requests.
```

```text
Add graceful shutdown to the Go server using os/signal and context with a timeout. Make the listen address configurable through an environment variable.
```

```text
Write table-driven tests that cover every operation and include division by zero, negative square root, malformed JSON, unsupported operation, missing operand, wrong HTTP method, health check, and CORS preflight.
```

### API test commands

```bash
cd backend

go fmt ./...
go vet ./...
go test ./...
go test -race ./...

go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
go tool cover -html=coverage.out -o coverage.html

go run ./cmd/server
```

### Manual API verification commands

```bash
curl http://localhost:8080/api/v1/health
```

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"add","a":10,"b":20}'
```

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"power","a":5,"b":6}'
```

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","a":10,"b":0}'
```

### PowerShell API verification commands

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/calculate" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"operation":"add","a":10,"b":20}'
```

### Commit command

```bash
git add backend
git commit -m "feat(api): implement calculator REST endpoints"
```

---

## Milestone 3 — Build the Basic React Frontend and Integrate the API

### Goal

Create the first functional React user interface with separate Operand A and Operand B inputs, operation selection, validation, result display, and backend integration.

### Primary AI prompt

```text
Build the first functional React and TypeScript frontend for the calculator API.

Requirements:
- Provide numeric inputs for Operand A and Operand B.
- Provide operation controls for add, subtract, multiply, divide, power, square root, and percentage.
- Hide or disable Operand B when square root is selected.
- Validate empty and invalid numeric input before calling the backend.
- Call POST /api/v1/calculate through a dedicated typed API module.
- Display loading, success, validation-error, and backend-error states.
- Keep API types separate from presentational components.
- Use accessible labels and buttons.
- Add a basic responsive layout for mobile screens.
```

### Follow-up editing prompts

```text
Create TypeScript request, response, operation, and API error types that match the Go API contract. Avoid using any.
```

```text
Implement a calculatorApi service using fetch. Parse structured backend errors and convert network failures into clear user-facing messages.
```

```text
Review the React component and separate API communication from UI state. Keep the component understandable without introducing a state-management library.
```

```text
Add frontend tests using Vitest and React Testing Library for successful addition, square-root input behavior, client validation, backend errors, and loading behavior.
```

```text
Style the page as a clean calculator form with a large heading, operation selector, two inputs, calculate and clear buttons, and a prominent result panel. Ensure it works at approximately 375px mobile width.
```

### Frontend commands

```bash
cd frontend
npm install
npm run dev
npm run build
npm test
npm run coverage
```

### Full local run commands

Terminal 1:

```bash
cd backend
go run ./cmd/server
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

### Commit command

```bash
git add frontend README.md
git commit -m "feat(ui): build calculator interface and connect backend"
```

---

## Milestone 4 — Redesign the Frontend as a Real Calculator

### Goal

Replace the two visible operand fields with a calculator-style display and keypad while continuing to submit calculations through the Go backend.

### Primary AI prompt

```text
Redesign the React calculator so it behaves like a real desktop calculator instead of showing separate Operand A and Operand B input fields.

Interaction requirements:
- Add a large calculator display.
- Add number buttons 0 through 9.
- Add a decimal-point button.
- Add operator buttons for addition, subtraction, multiplication, and division.
- Add buttons for power, square root, and percentage.
- Add equals, delete, all-clear, and positive/negative controls.
- Store the first operand when an operator is selected.
- Enter the second operand with the same keypad.
- Submit the completed operation to the Go API only when equals or a unary operation is activated.
- Continue to use the backend as the source of truth for arithmetic.
- Support chaining from the previous result.
- Handle repeated operator selection and incomplete expressions safely.

UI requirements:
- Preserve the React + Go microservice branding.
- Use a dark calculator display and a clean keypad grid.
- Clearly distinguish numeric, utility, operator, and equals buttons.
- Add a calculation history panel with expression, result, timestamp, copy-result action, and clear-history action.
- Make the history stack below the calculator on smaller screens.
- Maintain keyboard and screen-reader accessibility.
```

### Follow-up editing prompts

```text
Model the calculator state explicitly: current display value, stored first operand, pending operation, overwrite-display flag, loading state, error state, and history. Avoid parsing arbitrary mathematical expressions.
```

```text
Implement keypad behavior for leading zeroes, one decimal point per operand, sign toggling, deletion, all clear, operator replacement, result chaining, and recovery after an API error.
```

```text
Implement square root as a unary operation on the current display. Implement percentage using the API definition A percent of B and clearly communicate when a second operand is required.
```

```text
Add a bounded calculation history so the browser does not retain unlimited entries. Use stable IDs and copy only the result value when the copy button is pressed.
```

```text
Update React tests to interact with keypad buttons rather than operand input fields. Cover number entry, decimal entry, sign toggle, delete, all clear, binary calculation, square root, division by zero, history creation, history clearing, and result copying.
```

```text
Review the responsive CSS at desktop, tablet, and mobile widths. Ensure buttons remain large enough to tap and that long results do not break the display.
```

### UI validation commands

```bash
cd frontend
npm run dev
npm run build
npm test
npm run coverage
```

### Manual interaction checklist

```text
1. Enter 12, press +, enter 8, press =, and confirm 20.
2. Enter 9, press ÷, enter 3, press =, and confirm 3.
3. Enter 5, press power, enter 6, press =, and confirm 15,625.
4. Enter 81 and press square root, then confirm 9.
5. Enter a decimal and confirm only one decimal point is accepted.
6. Test DEL, AC, and +/-.
7. Confirm every completed calculation appears in history.
8. Confirm history can be cleared.
9. Confirm the layout stacks correctly on a narrow browser window.
10. Stop the backend and confirm the frontend shows a network error.
```

### Commit command

```bash
git add frontend
git commit -m "feat(ui): redesign calculator with keypad and history"
```

---

## Milestone 5 — Tests, Coverage, Docker, CI, and Documentation

### Goal

Polish the repository for evaluation and ensure setup, testing, deployment, and design decisions are documented clearly.

### Primary AI prompt

```text
Prepare the full-stack calculator repository for final take-home submission.

Required work:
- Review the frontend and backend for correctness and maintainability.
- Finish unit tests for both layers.
- Generate and document coverage commands.
- Add backend and frontend Dockerfiles.
- Add docker-compose.yml to run both services.
- Add a production Nginx configuration for the frontend.
- Add a Makefile with common development commands.
- Add a GitHub Actions workflow that runs backend and frontend checks.
- Complete the README with setup instructions, run instructions, API examples, tests, coverage, Docker usage, architecture, assumptions, design decisions, and known limitations.
- Add AI_PROMPTS.md containing all significant AI prompts used during the five milestones.
- Keep the final solution small enough to explain during an interview.
```

### Follow-up editing prompts

```text
Review the entire repository as a senior engineer evaluating a 2–4 hour take-home assignment. Identify unnecessary complexity, missing error handling, inconsistent naming, unclear documentation, or files that should not be committed.
```

```text
Write a concise design-rationale section explaining why the backend separates arithmetic from HTTP, why the API uses a single calculate endpoint, why the frontend avoids evaluating expression strings, and why no external database is required.
```

```text
Add Docker support with a multi-stage frontend build served by Nginx and a small Go runtime image. Configure the frontend container to proxy /api requests to the backend service.
```

```text
Create a GitHub Actions workflow that installs dependencies, runs frontend tests and build checks, formats and tests Go code, runs the race detector, and uploads or reports coverage where practical.
```

```text
Review README commands for Windows PowerShell as well as macOS/Linux shells. Ensure every documented endpoint exactly matches the implementation, especially /api/v1/health and /api/v1/calculate.
```

```text
Review AI_PROMPTS.md and make it transparent, organized by milestone, and detailed enough for an evaluator to understand where AI assisted the work.
```

### Final verification commands

Backend:

```bash
cd backend
go fmt ./...
go vet ./...
go test ./...
go test -race ./...
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out | tee coverage-summary.txt
go tool cover -html=coverage.out -o coverage.html
```

Frontend:

```bash
cd frontend
npm ci
npm test -- --run
npm run coverage
npm run build
```

Docker:

```bash
docker compose build
docker compose up
```

Smoke tests:

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:5173
```

Repository review:

```bash
git status
git diff --check
git log --oneline --reverse
```

### Final commit command

```bash
git add .
git commit -m "docs: finalize project with tests and deployment support"
```

---

## Final Five-Commit History

```text
chore: initialize full-stack calculator project
feat(api): implement calculator REST endpoints
feat(ui): build calculator interface and connect backend
feat(ui): redesign calculator with keypad and history
docs: finalize project with tests and deployment support
```

## Assumptions Communicated to the AI

```text
- The assignment should remain explainable within an interview.
- Correctness and maintainability are more important than adding many features.
- The Go backend remains the source of truth for calculations.
- The frontend must not use eval or execute arbitrary expression strings.
- Percentage means A percent of B: (A / 100) * B.
- Square root is unary and ignores Operand B.
- Floating-point arithmetic is acceptable for the assignment.
- Calculation history is client-side only and does not require persistence.
- Docker is optional in the assignment but included as a completion feature.
```

## Final AI Review Prompt

```text
Perform a final submission review of this React and Go calculator project. Check that every stated requirement is implemented, every README command is accurate, tests cover the most important success and failure paths, API errors are consistent, the responsive calculator interaction is understandable, Docker configuration matches local behavior, and the repository contains no secrets, generated dependency folders, or misleading claims. Return a prioritized list of corrections, then apply only corrections that improve correctness, clarity, or maintainability without expanding the project scope.
```
