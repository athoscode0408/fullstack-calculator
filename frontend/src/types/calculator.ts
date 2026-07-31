export type Operation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'square_root'
  | 'percentage';

export interface CalculationRequest {
  operation: Operation;
  a: number;
  b?: number;
}

export interface CalculationResponse {
  operation: Operation;
  result: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
