package httpapi

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/example/fullstack-calculator/backend/internal/calculator"
)

func testRouter() http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return NewHandler(calculator.NewService(), logger).Routes("*")
}

func TestCalculateSuccess(t *testing.T) {
	body := []byte(`{"operation":"multiply","a":6,"b":7}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}

	var result calculator.Result
	if err := json.NewDecoder(recorder.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if result.Value != 42 {
		t.Fatalf("result = %v, want 42", result.Value)
	}
}

func TestCalculateDivisionByZero(t *testing.T) {
	body := []byte(`{"operation":"divide","a":10,"b":0}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnprocessableEntity)
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"division_by_zero"`)) {
		t.Fatalf("body = %s, want division_by_zero error", recorder.Body.String())
	}
}

func TestCalculateRejectsInvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(`{"operation":`))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestCalculateRejectsUnknownFields(t *testing.T) {
	body := []byte(`{"operation":"add","a":1,"b":2,"unexpected":true}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func TestCalculateRejectsEmptyBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", nil)
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestCalculateRejectsMultipleJSONValues(t *testing.T) {
	body := []byte(`{"operation":"add","a":1,"b":2} {"extra":true}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestCalculateUnsupportedOperation(t *testing.T) {
	body := []byte(`{"operation":"modulo","a":7,"b":3}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewReader(body))
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnprocessableEntity)
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"unsupported_operation"`)) {
		t.Fatalf("body = %s, want unsupported_operation error", recorder.Body.String())
	}
}

func TestCORSPreflight(t *testing.T) {
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	recorder := httptest.NewRecorder()

	testRouter().ServeHTTP(recorder, req)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNoContent)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want *", got)
	}
}
