'use client';
import { API_BASE } from "../../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function AdminOrders(){
  const [list,setList]=useState<any[]>([]);
  async function load(){ const r=await fetch(`${API_BASE}/admin/orders`,{ credentials:'include' }); const d=await r.json(); setList(d.orders||[]); }
  useEffect(()=>{ load(); },[]);
  async function setStatus(id:number, status:string){ const r=await fetch(`${API_BASE}/admin/orders/${id}/status`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status })}); if(r.ok) load(); else alert('Failed'); }
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Admin</div><h2>Orders</h2></div></div>
      <div>
        {list.map((o:any)=> (
          <div key={o.id} className='card'><div className='pad'>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><b>Order #{o.id}</b><div className='sub'>{new Date(o.createdAt).toLocaleString()} • {o.user.name} ({o.user.email})</div></div>
              <div><span className='badge' style={{textTransform:'capitalize'}}>{o.status}</span></div>
            </div>
            <div className='actions' style={{marginTop:8, gap:8, display:'flex'}}>
              <button className='btn ghost' onClick={()=>setStatus(o.id,'paid')}>Mark Paid</button>
              <button className='btn ghost' onClick={()=>setStatus(o.id,'shipped')}>Mark Shipped</button>
              <button className='btn' onClick={()=>setStatus(o.id,'delivered')}>Mark Delivered</button>
            </div>
          </div></div>
        ))}
      </div>
    </section>
  );
}
