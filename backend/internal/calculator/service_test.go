package calculator

import (
	"errors"
	"math"
	"testing"
)

func ptr(value float64) *float64 { return &value }

func TestServiceCalculateSuccess(t *testing.T) {
	service := NewService()

	tests := []struct {
		name string
		req  Request
		want float64
	}{
		{name: "addition", req: Request{Operation: Add, A: ptr(7), B: ptr(3)}, want: 10},
		{name: "subtraction", req: Request{Operation: Subtract, A: ptr(7), B: ptr(3)}, want: 4},
		{name: "multiplication", req: Request{Operation: Multiply, A: ptr(7), B: ptr(3)}, want: 21},
		{name: "division", req: Request{Operation: Divide, A: ptr(7), B: ptr(2)}, want: 3.5},
		{name: "power", req: Request{Operation: Power, A: ptr(2), B: ptr(8)}, want: 256},
		{name: "square root", req: Request{Operation: SquareRoot, A: ptr(81)}, want: 9},
		{name: "percentage", req: Request{Operation: Percentage, A: ptr(15), B: ptr(200)}, want: 30},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.Calculate(tt.req)
			if err != nil {
				t.Fatalf("Calculate() error = %v", err)
			}
			if math.Abs(result.Value-tt.want) > 1e-9 {
				t.Fatalf("Calculate() result = %v, want %v", result.Value, tt.want)
			}
		})
	}
}

func TestServiceCalculateErrors(t *testing.T) {
	service := NewService()

	tests := []struct {
		name     string
		req      Request
		wantCode string
	}{
		{name: "missing operation", req: Request{A: ptr(1)}, wantCode: "validation_error"},
		{name: "missing a", req: Request{Operation: Add, B: ptr(1)}, wantCode: "validation_error"},
		{name: "missing b", req: Request{Operation: Add, A: ptr(1)}, wantCode: "validation_error"},
		{name: "division by zero", req: Request{Operation: Divide, A: ptr(1), B: ptr(0)}, wantCode: "division_by_zero"},
		{name: "negative square root", req: Request{Operation: SquareRoot, A: ptr(-1)}, wantCode: "invalid_square_root"},
		{name: "unsupported operation", req: Request{Operation: "modulo", A: ptr(3), B: ptr(2)}, wantCode: "unsupported_operation"},
		{name: "overflow", req: Request{Operation: Power, A: ptr(1e308), B: ptr(2)}, wantCode: "result_out_of_range"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.Calculate(tt.req)
			if err == nil {
				t.Fatal("Calculate() expected an error")
			}

			var domainErr *Error
			if !errors.As(err, &domainErr) {
				t.Fatalf("Calculate() error type = %T, want *Error", err)
			}
			if domainErr.Code != tt.wantCode {
				t.Fatalf("Calculate() error code = %q, want %q", domainErr.Code, tt.wantCode)
			}
		})
	}
}

func TestDomainErrorString(t *testing.T) {
	err := &Error{Code: "test_error", Message: "test message"}
	if err.Error() != "test message" {
		t.Fatalf("Error() = %q, want %q", err.Error(), "test message")
	}
}

func TestServiceRejectsNonFiniteOperands(t *testing.T) {
	service := NewService()

	tests := []Request{
		{Operation: Add, A: ptr(math.NaN()), B: ptr(1)},
		{Operation: Add, A: ptr(1), B: ptr(math.Inf(1))},
	}

	for _, req := range tests {
		_, err := service.Calculate(req)
		if err == nil {
			t.Fatal("Calculate() expected an error for a non-finite operand")
		}
	}
}
