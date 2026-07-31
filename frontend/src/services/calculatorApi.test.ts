import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculate } from './calculatorApi';

describe('calculatorApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps network failures to a user-friendly error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));

    await expect(calculate({ operation: 'add', a: 1, b: 2 })).rejects.toMatchObject({
      code: 'network_error',
    });
  });

  it('maps structured API errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'validation_error', message: 'invalid input' } }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(calculate({ operation: 'add', a: 1, b: 2 })).rejects.toMatchObject({
      code: 'validation_error',
      message: 'invalid input',
    });
  });
});
