import { useEffect, useMemo, useRef, useState } from 'react';
import { calculate } from '../services/calculatorApi';
import type { Operation } from '../types/calculator';

interface OperationOption {
  value: Operation;
  label: string;
  symbol: string;
  description: string;
  unary?: boolean;
}

interface HistoryItem {
  id: number;
  operation: Operation;
  a: number;
  b?: number;
  result: number;
  createdAt: Date;
}

const operations: OperationOption[] = [
  { value: 'add', label: 'Add', symbol: '+', description: 'A plus B' },
  { value: 'subtract', label: 'Subtract', symbol: '−', description: 'A minus B' },
  { value: 'multiply', label: 'Multiply', symbol: '×', description: 'A times B' },
  { value: 'divide', label: 'Divide', symbol: '÷', description: 'A divided by B' },
  { value: 'power', label: 'Power', symbol: 'xʸ', description: 'A raised to B' },
  {
    value: 'square_root',
    label: 'Square root',
    symbol: '√',
    description: 'Square root of A',
    unary: true,
  },
  {
    value: 'percentage',
    label: 'Percentage',
    symbol: '%',
    description: 'A percent of B',
  },
];

const operationByValue = new Map(operations.map((item) => [item.value, item]));

function parseRequiredNumber(value: string, label: string): number {
  if (value.trim() === '') throw new Error(`${label} is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid finite number.`);
  return parsed;
}

function formatResult(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 12,
    useGrouping: true,
  });
}

function appendDigit(current: string, digit: string): string {
  if (digit === '.') {
    if (current.includes('.')) return current;
    return current === '' || current === '-' ? `${current}0.` : `${current}.`;
  }
  if (current === '0') return digit;
  if (current === '-0') return `-${digit}`;
  return `${current}${digit}`;
}

export function Calculator() {
  const [operation, setOperation] = useState<Operation>('add');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [activeOperand, setActiveOperand] = useState<'a' | 'b'>('a');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedOperation = useMemo(
    () => operationByValue.get(operation) ?? operations[0],
    [operation],
  );

  const displayValue = error
    ? error
    : result !== null
      ? formatResult(result)
      : activeOperand === 'b'
        ? b || '0'
        : a || '0';

  const expression = selectedOperation.unary
    ? `${selectedOperation.symbol}${a || '0'}`
    : `${a || '0'} ${selectedOperation.symbol} ${b || '0'}`;

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const cancelPending = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const chooseOperation = (nextOperation: Operation) => {
    cancelPending();
    setOperation(nextOperation);
    setError('');
    setResult(null);
    const next = operationByValue.get(nextOperation);
    setActiveOperand(next?.unary || a === '' ? 'a' : 'b');
  };

  const updateActiveValue = (updater: (value: string) => string) => {
    setError('');
    setResult(null);
    if (activeOperand === 'a' || selectedOperation.unary) setA(updater(a));
    else setB(updater(b));
  };

  const handleDigit = (digit: string) => updateActiveValue((value) => appendDigit(value, digit));

  const handleToggleSign = () => {
    updateActiveValue((value) => {
      if (value === '') return '-';
      return value.startsWith('-') ? value.slice(1) : `-${value}`;
    });
  };

  const handleDelete = () => updateActiveValue((value) => value.slice(0, -1));

  const handleClear = () => {
    cancelPending();
    setA('');
    setB('');
    setActiveOperand('a');
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    let controller: AbortController | null = null;

    try {
      const operandA = parseRequiredNumber(a, 'Operand A');
      const operandB = selectedOperation.unary ? undefined : parseRequiredNumber(b, 'Operand B');

      cancelPending();
      controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      const response = await calculate(
        { operation, a: operandA, ...(operandB !== undefined ? { b: operandB } : {}) },
        controller.signal,
      );

      setResult(response.result);
      setHistory((items) => [
        {
          id: Date.now(),
          operation,
          a: operandA,
          ...(operandB !== undefined ? { b: operandB } : {}),
          result: response.result,
          createdAt: new Date(),
        },
        ...items,
      ].slice(0, 8));
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return;
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred.');
    } finally {
      if (controller && abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(String(item.result));
    } catch {
      // Clipboard access can be unavailable in insecure or test environments.
    }
  };

  return (
    <main className="page-shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">React + Go microservice</p>
        <h1 id="page-title">Calculator</h1>
        <p className="intro-copy">
          Choose an operation and use the calculator below to enter your numbers.
          The backend service will perform the calculation.
        </p>
      </section>

      <section className="calculator-card" aria-label="Calculator">
        <div className="operation-grid" role="group" aria-label="Operations">
          {operations.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`operation-button ${operation === item.value ? 'operation-button--active' : ''}`}
              aria-pressed={operation === item.value}
              onClick={() => chooseOperation(item.value)}
            >
              <span className="operation-symbol" aria-hidden="true">{item.symbol}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="workspace">
          <div className="calculator-panel">
            <div className={`display ${error ? 'display--error' : ''}`} aria-live="polite">
              <div className="display-topline">
                <span>{selectedOperation.description}</span>
                <span>{expression}</span>
              </div>
              <output aria-label="Calculator display">{isLoading ? 'Calculating…' : displayValue}</output>
            </div>

            <div className="keypad" role="group" aria-label="Calculator keypad">
              <button type="button" className="key key--utility" onClick={handleToggleSign}>+/−</button>
              <button type="button" className="key key--danger" onClick={handleDelete}>DEL</button>
              <button type="button" className="key key--danger" onClick={handleClear}>AC</button>
              <button type="button" className="key key--operator" onClick={() => chooseOperation('divide')}>÷</button>

              <button type="button" className="key" onClick={() => handleDigit('7')}>7</button>
              <button type="button" className="key" onClick={() => handleDigit('8')}>8</button>
              <button type="button" className="key" onClick={() => handleDigit('9')}>9</button>
              <button type="button" className="key key--operator" onClick={() => chooseOperation('multiply')}>×</button>

              <button type="button" className="key" onClick={() => handleDigit('4')}>4</button>
              <button type="button" className="key" onClick={() => handleDigit('5')}>5</button>
              <button type="button" className="key" onClick={() => handleDigit('6')}>6</button>
              <button type="button" className="key key--operator" onClick={() => chooseOperation('subtract')}>−</button>

              <button type="button" className="key" onClick={() => handleDigit('1')}>1</button>
              <button type="button" className="key" onClick={() => handleDigit('2')}>2</button>
              <button type="button" className="key" onClick={() => handleDigit('3')}>3</button>
              <button type="button" className="key key--operator" onClick={() => chooseOperation('add')}>+</button>

              <button type="button" className="key key--zero" onClick={() => handleDigit('0')}>0</button>
              <button type="button" className="key" onClick={() => handleDigit('.')}>.</button>
              <button type="button" className="key key--equals" onClick={handleSubmit} disabled={isLoading}>=</button>
            </div>

            <div className="advanced-keys" aria-label="Advanced operation shortcuts">
              <button type="button" onClick={() => chooseOperation('power')}>xʸ</button>
              <button type="button" onClick={() => chooseOperation('square_root')}>√</button>
              <button type="button" onClick={() => chooseOperation('percentage')}>%</button>
            </div>
          </div>

          <aside className="history-panel" aria-label="Calculation history">
            <div className="history-header">
              <h2>History</h2>
              <button type="button" onClick={() => setHistory([])} disabled={history.length === 0}>Clear</button>
            </div>

            {history.length === 0 ? (
              <div className="history-empty">
                <span>↺</span>
                <p>Your recent calculations will appear here.</p>
              </div>
            ) : (
              <ol className="history-list">
                {history.map((item) => {
                  const metadata = operationByValue.get(item.operation) ?? operations[0];
                  return (
                    <li key={item.id}>
                      <div className="history-equation">
                        <span>{item.operation === 'square_root' ? `${metadata.symbol}${item.a}` : `${item.a} ${metadata.symbol} ${item.b}`}</span>
                        <strong>= {formatResult(item.result)}</strong>
                        <button type="button" aria-label={`Copy result ${item.result}`} onClick={() => handleCopy(item)}>⧉</button>
                      </div>
                      <time>{item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>

        <p className="service-note">All calculations are performed by the Go backend service.</p>
      </section>
    </main>
  );
}
