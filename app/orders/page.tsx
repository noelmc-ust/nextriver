'use client';
import { API_BASE } from "../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function Orders(){
  const [orders,setOrders]=useState<any[]>([]);
  useEffect(()=>{ fetch(`${API_BASE}/orders`,{ credentials:'include' }).then(r=>r.json()).then(d=>setOrders(d.orders||[])); },[]);
  return (
    <section className="container">
      <div className="topbar"><div><div className="badge">Order History</div><h2>Your Orders</h2></div></div>
      <div>
        {orders.length===0? <div className='cart-panel'>You have not placed any orders yet.</div> : orders.map((o:any)=> (
          <div key={o.id} className='cart-panel' style={{marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.5rem'}}>
              <div><div style={{fontWeight:700}}>Order #{String(o.id).slice(0,8)}</div><div className='sub'>Placed on {new Date(o.created_at).toLocaleString()}</div></div>
              <div><span className='badge' style={{marginRight:8, textTransform:'capitalize'}}>{o.status}</span><span className='price' style={{fontSize:'1.1rem'}}>₹{(o.total_cents/100).toFixed(2)}</span></div>
            </div>
            <div>
              {o.applied_code? <div className='sub' style={{marginBottom:'.25rem'}}>Promo: {o.applied_code} (−₹{(o.applied_discount_cents/100).toFixed(2)})</div> : null}
              {o.line_items.map((i:any,idx:number)=> (<div key={idx} className='row'><div>{i.name} × {i.qty}</div><div>₹{(i.subtotal_cents/100).toFixed(2)}</div></div>))}
              <div className='total'>Total: ₹{(o.total_cents/100).toFixed(2)}</div>
            </div>
            <div className='actions' style={{marginTop:'.5rem'}}>
              <a className='btn ghost' href={`${API_BASE}/orders/${o.id}/invoice`} target='_blank' rel='noopener'>Download Invoice (PDF)</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
