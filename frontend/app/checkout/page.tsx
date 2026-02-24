'use client';
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;

export default function Checkout(){
  const [items,setItems]=useState<any[]>([]);
  const [products,setProducts]=useState<any[]>([]);
  const [code,setCode]=useState('');
  const [discount,setDiscount]=useState(0);
  const [shipping,setShipping]=useState<any>({ fullName:'', line1:'', line2:'', city:'', state:'', postalCode:'', country:'IN', phone:'' });
  const [payment,setPayment]=useState<any>({ method:'SIMULATED', nameOnCard:'', last4:'' });

  useEffect(()=>{ (async()=>{
    const [c,p,a] = await Promise.all([
      fetch(`${API}/cart`, { credentials:'include' }).then(r=>r.json()),
      fetch(`${API}/products`).then(r=>r.json()),
      fetch(`${API}/addresses`, { credentials:'include' }).then(r=>r.json()).catch(()=>({addresses:[]}))
    ]);
    setItems(c.items||[]); setProducts(p.products||[]);
    const def=(a.addresses||[]).find((x:any)=>x.isDefault) || (a.addresses||[])[0];
    if(def) setShipping({ fullName:def.fullName, line1:def.line1, line2:def.line2||'', city:def.city, state:def.state, postalCode:def.postalCode, country:def.country, phone:def.phone });
  })(); },[]);

  const total = items.reduce((acc,it)=>{ const pid=it.productId||it.product_id; const prod=products.find((pp:any)=>pp.id===pid); return acc+(prod?prod.priceCents*it.qty:0); },0);
  const payable = Math.max(0,total-discount);

  async function apply(){ const r=await fetch(`${API}/discounts/validate`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code })}); const d=await r.json(); if(r.ok) setDiscount(d.discount_cents||0); else { setDiscount(0); alert(d.error||'Invalid code'); } }
  async function place(){ const r=await fetch(`${API}/orders/checkout`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, shippingAddress:shipping, payment })}); const d=await r.json(); if(!r.ok){ alert(d.error||'Checkout failed'); return; } window.location.href='/orders'; }

  return (
    <section className="container">
      <div className="topbar"><div><div className="badge">Checkout</div><h2>Shipping & Payment</h2></div></div>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:20}}>
        <div className="form">
          <h3>Shipping Address</h3>
          {['fullName','line1','line2','city','state','postalCode','country','phone'].map(k=> (
            <div className="field" key={k}><label>{k}</label><input className="input" value={shipping[k]||''} onChange={e=>setShipping({...shipping,[k]:e.target.value})}/></div>
          ))}
          <h3>Payment (Simulated)</h3>
          <div className="field"><label>Name on Card</label><input className="input" value={payment.nameOnCard||''} onChange={e=>setPayment({...payment,nameOnCard:e.target.value})}/></div>
          <div className="field"><label>Last 4 digits</label><input className="input" value={payment.last4||''} onChange={e=>setPayment({...payment,last4:e.target.value})}/></div>
        </div>
        <div className="cart-panel">
          <div style={{fontWeight:700, marginBottom:'.5rem'}}>Order Summary</div>
          {items.length===0? <div className='sub'>Your cart is empty.</div> : items.map((i:any,idx:number)=>{ const pid=i.productId||i.product_id; const p=products.find((x:any)=>x.id===pid); const sub=p?p.priceCents*i.qty:0; return <div key={idx} className='row'><div>{p?.name||('PID '+pid)} × {i.qty}</div><div>₹{(sub/100).toFixed(2)}</div></div>; })}
          <div className='row' style={{borderBottom:0}}><div style={{flex:1}}><input className='input' placeholder='Promo code' value={code} onChange={e=>setCode(e.target.value)} /></div><button className='btn ghost' onClick={apply} style={{marginLeft:8}}>Apply</button></div>
          <div className='total'>Subtotal: ₹{(total/100).toFixed(2)}</div>
          <div className='total' style={{color: discount>0?'#22c55e':undefined}}>Discount: -₹{(discount/100).toFixed(2)}</div>
          <div className='total'>Payable: ₹{(payable/100).toFixed(2)}</div>
          <div className='actions'><button className='btn' onClick={place} disabled={items.length===0}>Place Order</button></div>
        </div>
      </div>
    </section>
  );
}
