import type {
  ApiErrorResponse,
  CalculationRequest,
  CalculationResponse,
} from '../types/calculator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class CalculatorApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
  }
}

export async function calculate(
  request: CalculationRequest,
  signal?: AbortSignal,
): Promise<CalculationResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new CalculatorApiError(
      'network_error',
      'Unable to reach the calculator service. Confirm that the backend is running.',
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | CalculationResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    if (payload && 'error' in payload) {
      throw new CalculatorApiError(payload.error.code, payload.error.message);
    }
    throw new CalculatorApiError(
      'unexpected_response',
      'The calculator service returned an unexpected response.',
    );
  }

  if (!payload || !('result' in payload)) {
    throw new CalculatorApiError(
      'unexpected_response',
      'The calculator service returned an invalid result.',
    );
  }

  return payload;
}
