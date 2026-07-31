import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calculator } from './Calculator';

describe('Calculator', () => {
  afterEach(() => vi.restoreAllMocks());

  it('enters values with the keypad and submits an addition request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ operation: 'add', result: 12 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<Calculator />);
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '=' }));

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/calculate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ operation: 'add', a: 7, b: 5 }),
      }),
    );
  });

  it('validates missing input before calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    render(<Calculator />);
    await user.click(screen.getByRole('button', { name: '=' }));

    expect(await screen.findByText('Operand A is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses only operand A for square root', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ operation: 'square_root', result: 9 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<Calculator />);
    await user.click(screen.getByRole('button', { name: 'Square root' }));
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '=' }));

    expect(await screen.findByText('9')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/calculate',
      expect.objectContaining({ body: JSON.stringify({ operation: 'square_root', a: 81 }) }),
    );
  });

  it('shows an API error returned by the backend', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'division_by_zero', message: 'cannot divide by zero' } }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(<Calculator />);
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Divide' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: '=' }));

    expect(await screen.findByText('cannot divide by zero')).toBeInTheDocument();
  });
});
