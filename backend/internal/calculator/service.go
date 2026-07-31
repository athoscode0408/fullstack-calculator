package calculator

import (
	"fmt"
	"math"
)

// Operation identifies a supported calculator operation.
type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	SquareRoot Operation = "square_root"
	Percentage Operation = "percentage"
)

// Request contains the operands for a calculation. Pointer operands allow the
// service to distinguish a missing value from a valid zero.
type Request struct {
	Operation Operation `json:"operation"`
	A         *float64  `json:"a"`
	B         *float64  `json:"b,omitempty"`
}

// Result is the successful result returned by the service.
type Result struct {
	Operation Operation `json:"operation"`
	Value     float64   `json:"result"`
}

// Error is a domain error that can be translated into a stable API response.
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *Error) Error() string {
	return e.Message
}

// Service performs calculator operations without depending on HTTP concerns.
type Service struct{}

func NewService() *Service {
	return &Service{}
}

// Calculate validates the request and performs the selected operation.
func (s *Service) Calculate(req Request) (Result, error) {
	if req.Operation == "" {
		return Result{}, validationError("operation is required")
	}
	if req.A == nil {
		return Result{}, validationError("operand a is required")
	}

	a := *req.A
	if !isFinite(a) {
		return Result{}, validationError("operand a must be a finite number")
	}

	var value float64

	switch req.Operation {
	case Add, Subtract, Multiply, Divide, Power, Percentage:
		if req.B == nil {
			return Result{}, validationError("operand b is required for this operation")
		}
		b := *req.B
		if !isFinite(b) {
			return Result{}, validationError("operand b must be a finite number")
		}

		switch req.Operation {
		case Add:
			value = a + b
		case Subtract:
			value = a - b
		case Multiply:
			value = a * b
		case Divide:
			if b == 0 {
				return Result{}, &Error{Code: "division_by_zero", Message: "cannot divide by zero"}
			}
			value = a / b
		case Power:
			value = math.Pow(a, b)
		case Percentage:
			value = (a / 100) * b
		}

	case SquareRoot:
		if a < 0 {
			return Result{}, &Error{Code: "invalid_square_root", Message: "cannot calculate the square root of a negative number"}
		}
		value = math.Sqrt(a)

	default:
		return Result{}, &Error{
			Code:    "unsupported_operation",
			Message: fmt.Sprintf("unsupported operation %q", req.Operation),
		}
	}

	if !isFinite(value) {
		return Result{}, &Error{Code: "result_out_of_range", Message: "calculation result is outside the supported numeric range"}
	}

	return Result{Operation: req.Operation, Value: value}, nil
}

func validationError(message string) *Error {
	return &Error{Code: "validation_error", Message: message}
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
