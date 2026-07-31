package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/example/fullstack-calculator/backend/internal/calculator"
)

const maxRequestBodySize = 1 << 20 // 1 MiB

type calculatorService interface {
	Calculate(calculator.Request) (calculator.Result, error)
}

// Handler owns the HTTP transport while delegating arithmetic to the domain service.
type Handler struct {
	calculator calculatorService
	logger     *slog.Logger
}

func NewHandler(service calculatorService, logger *slog.Logger) *Handler {
	return &Handler{calculator: service, logger: logger}
}

func (h *Handler) Routes(allowedOrigin string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", h.health)
	mux.HandleFunc("POST /api/v1/calculate", h.calculate)

	return corsMiddleware(allowedOrigin, requestLoggingMiddleware(h.logger, mux))
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var req calculator.Request
	if err := decoder.Decode(&req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", friendlyDecodeError(err))
		return
	}

	if err := ensureSingleJSONValue(decoder); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_json", "request body must contain exactly one JSON object")
		return
	}

	result, err := h.calculator.Calculate(req)
	if err != nil {
		var domainErr *calculator.Error
		if errors.As(err, &domainErr) {
			writeAPIError(w, http.StatusUnprocessableEntity, domainErr.Code, domainErr.Message)
			return
		}

		h.logger.Error("calculator service failed", "error", err)
		writeAPIError(w, http.StatusInternalServerError, "internal_error", "an unexpected error occurred")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

type errorEnvelope struct {
	Error apiError `json:"error"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeAPIError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func ensureSingleJSONValue(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return errors.New("multiple JSON values")
		}
		return err
	}
	return nil
}

func friendlyDecodeError(err error) string {
	var syntaxErr *json.SyntaxError
	var typeErr *json.UnmarshalTypeError

	switch {
	case errors.As(err, &syntaxErr):
		return "request body contains malformed JSON"
	case errors.As(err, &typeErr):
		return "request body contains a value with an invalid type"
	case errors.Is(err, io.EOF):
		return "request body is required"
	case err.Error() == "http: request body too large":
		return "request body is too large"
	default:
		return err.Error()
	}
}
