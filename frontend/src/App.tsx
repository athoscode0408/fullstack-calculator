import { useState } from 'react';
import { calculate } from './services/calculatorApi';
import type { Operation } from './types/calculator';

export default function App() {
 const [operation,setOperation]=useState<Operation>('add');
 const [a,setA]=useState(''); const [b,setB]=useState('');
 const [result,setResult]=useState<number|null>(null); const [error,setError]=useState('');
 async function submit(e: React.FormEvent){e.preventDefault();setError('');try{const response=await calculate({operation,a:Number(a),...(operation==='square_root'?{}:{b:Number(b)})});setResult(response.result)}catch(err){setResult(null);setError(err instanceof Error?err.message:'Calculation failed')}}
 return <main><p className="eyebrow">React + Go microservice</p><h1>Calculator</h1><form onSubmit={submit}><label>Operation<select value={operation} onChange={e=>setOperation(e.target.value as Operation)}><option value="add">Add</option><option value="subtract">Subtract</option><option value="multiply">Multiply</option><option value="divide">Divide</option><option value="power">Power</option><option value="square_root">Square root</option><option value="percentage">Percentage</option></select></label><div className="inputs"><label>Operand A<input value={a} onChange={e=>setA(e.target.value)} type="number" step="any" required/></label>{operation!=='square_root'&&<label>Operand B<input value={b} onChange={e=>setB(e.target.value)} type="number" step="any" required/></label>}</div><button>Calculate</button></form>{error&&<div className="error">{error}</div>}{result!==null&&<div className="result"><small>RESULT</small><strong>{result}</strong></div>}</main>;
}
