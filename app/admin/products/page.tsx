'use client';
import { API_BASE } from "../../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function AdminProducts(){
  const [list,setList]=useState<any[]>([]);
  const [form,setForm]=useState<any>({ name:'', priceCents:0, imageUrl:'', description:'', stock:100, sku:'', active:true });
  async function load(){ const r=await fetch(`${API_BASE}/admin/products`,{ credentials:'include' }); const d=await r.json(); setList(d.products||[]); }
  useEffect(()=>{ load(); },[]);
  async function create(){ const r=await fetch(`${API_BASE}/admin/products`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); if(r.ok){ setForm({ name:'', priceCents:0, imageUrl:'', description:'', stock:100, sku:'', active:true }); load(); } else alert('Create failed'); }
  async function update(p:any){ const r=await fetch(`${API_BASE}/admin/products/${p.id}`,{ method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p) }); if(r.ok) load(); }
  async function del(id:number){ if(!confirm('Delete?')) return; const r=await fetch(`${API_BASE}/admin/products/${id}`,{ method:'DELETE', credentials:'include' }); if(r.ok) load(); }
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Admin</div><h2>Products</h2></div></div>
      <div className='form'>
        <div className='field'><label>Name</label><input className='input' value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className='field'><label>Price (cents)</label><input className='input' type='number' value={form.priceCents} onChange={e=>setForm({...form,priceCents:Number(e.target.value)})}/></div>
        <div className='field'><label>Image URL</label><input className='input' value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})}/></div>
        <div className='field'><label>Description</label><input className='input' value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div className='field'><label>Stock</label><input className='input' type='number' value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></div>
        <div className='field'><label>SKU</label><input className='input' value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></div>
        <div className='field'><label>Active</label><input type='checkbox' checked={!!form.active} onChange={e=>setForm({...form,active:e.target.checked})}/></div>
        <div className='actions'><button className='btn' onClick={create}>Create</button></div>
      </div>
      <div className='section'>
        {list.map(p=> (
          <div key={p.id} className='card'><div className='pad'>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
              <div><b>{p.name}</b><div className='sub'>ID {p.id} • ₹{(p.priceCents/100).toFixed(2)}</div></div>
              <div>Stock: <input className='input' type='number' defaultValue={p.stock} onBlur={e=>update({ id:p.id, stock:Number(e.target.value) })}/></div>
              <div>Active: <input type='checkbox' defaultChecked={p.active} onChange={e=>update({ id:p.id, active:e.target.checked })}/></div>
            </div>
            <div className='actions' style={{marginTop:8}}><button className='btn ghost' onClick={()=>del(p.id)}>Delete</button></div>
          </div></div>
        ))}
      </div>
    </section>
  );
}
