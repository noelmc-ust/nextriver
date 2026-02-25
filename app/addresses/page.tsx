'use client';
import { API_BASE } from "../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function Addresses(){
  const [list,setList]=useState<any[]>([]);
  const [form,setForm]=useState<any>({ fullName:'', line1:'', line2:'', city:'', state:'', postalCode:'', country:'IN', phone:'', isDefault:false });
  async function load(){ const r=await fetch(`${API_BASE}/addresses`,{ credentials:'include' }); const d=await r.json(); setList(d.addresses||[]); }
  useEffect(()=>{ load(); },[]);

  async function add(){ const r=await fetch(`${API_BASE}/addresses/add`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); if(r.ok){ setForm({ fullName:'', line1:'', line2:'', city:'', state:'', postalCode:'', country:'IN', phone:'', isDefault:false }); load(); } else { alert('Add failed'); } }
  async function del(id:number){ if(!confirm('Delete?')) return; const r=await fetch(`${API_BASE}/addresses/delete`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) }); if(r.ok) load(); }
  async function makeDefault(id:number){ await fetch(`${API_BASE}/addresses/update`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, isDefault:true }) }); load(); }

  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Account</div><h2>Addresses</h2></div></div>
      <div className='form'>
        {['fullName','line1','line2','city','state','postalCode','country','phone'].map(k=> (
          <div className='field' key={k}><label>{k}</label><input className='input' value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
        ))}
        <label style={{display:'flex',alignItems:'center',gap:8}}><input type='checkbox' checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})}/> Set as default</label>
        <div className='actions'><button className='btn' onClick={add}>Add Address</button></div>
      </div>
      <div className='section'>
        {list.map((a:any)=> (
          <div key={a.id} className='card'><div className='pad' style={{display:'flex',justifyContent:'space-between'}}>
            <div>
              <b>{a.fullName}</b> {a.isDefault? <span className='badge'>Default</span>:null}
              <div className='sub'>{a.line1}{a.line2?`, ${a.line2}`:''}, {a.city}, {a.state} {a.postalCode}, {a.country}</div>
              <div className='sub'>Ph: {a.phone}</div>
            </div>
            <div className='actions'>
              {!a.isDefault && <button className='btn ghost' onClick={()=>makeDefault(a.id)}>Make Default</button>}
              <button className='btn ghost' onClick={()=>del(a.id)}>Delete</button>
            </div>
          </div></div>
        ))}
      </div>
    </section>
  );
}
