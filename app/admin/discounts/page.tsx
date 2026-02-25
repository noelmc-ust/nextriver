'use client';
import { API_BASE } from "../../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function AdminDiscounts(){
  const [list,setList]=useState<any[]>([]);
  const [form,setForm]=useState<any>({ code:'', type:'PERCENT', value:10, active:true });
  async function load(){ const r=await fetch(`${API_BASE}/admin/discounts`,{ credentials:'include' }); const d=await r.json(); setList(d.codes||[]); }
  useEffect(()=>{ load(); },[]);
  async function create(){ const r=await fetch(`${API_BASE}/admin/discounts`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); if(r.ok){ setForm({ code:'', type:'PERCENT', value:10, active:true }); load(); } else alert('Create failed'); }
  async function update(c:any){ const r=await fetch(`${API_BASE}/admin/discounts/${c.id}`,{ method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(c) }); if(r.ok) load(); }
  async function del(id:number){ if(!confirm('Delete?')) return; const r=await fetch(`${API_BASE}/admin/discounts/${id}`,{ method:'DELETE', credentials:'include' }); if(r.ok) load(); }
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Admin</div><h2>Discount Codes</h2></div></div>
      <div className='form'>
        <div className='field'><label>Code</label><input className='input' value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/></div>
        <div className='field'><label>Type</label><select className='input' value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value='PERCENT'>PERCENT</option><option value='FIXED'>FIXED</option></select></div>
        <div className='field'><label>Value</label><input className='input' type='number' value={form.value} onChange={e=>setForm({...form,value:Number(e.target.value)})}/></div>
        <div className='field'><label>Active</label><input type='checkbox' checked={!!form.active} onChange={e=>setForm({...form,active:e.target.checked})}/></div>
        <div className='actions'><button className='btn' onClick={create}>Create</button></div>
      </div>
      <div className='section'>
        {list.map(c=> (
          <div key={c.id} className='card'><div className='pad' style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><b>{c.code}</b> <span className='sub'>({c.type} {c.value})</span></div>
            <div className='actions'>
              <label style={{marginRight:8}}>Active <input type='checkbox' defaultChecked={c.active} onChange={e=>update({ id:c.id, active:e.target.checked })}/></label>
              <button className='btn ghost' onClick={()=>del(c.id)}>Delete</button>
            </div>
          </div></div>
        ))}
      </div>
    </section>
  );
}
