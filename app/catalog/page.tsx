'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE as string;

export default function Catalog(){
  const [products,setProducts]=useState<any[]>([]);
  const [items,setItems]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [code,setCode]=useState('');
  const [discount,setDiscount]=useState(0);

  async function load(){
    const [p,c] = await Promise.all([
      fetch(`${API}/products`).then(r=>r.json()),
      fetch(`${API}/cart`, { credentials:'include' }).then(r=>r.json()).catch(()=>({items:[]}))
    ]);
    setProducts(p.products||[]); setItems(c.items||[]);
    let t=0; for(const i of (c.items||[])){ const prod=(p.products||[]).find((pp:any)=>pp.id===(i.productId||i.product_id)); if(prod) t += prod.priceCents*(i.qty||1); }
    setTotal(t);
  }
  useEffect(()=>{ load(); },[]);

  async function add(pid:number){
    await fetch(`${API}/cart/add`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId: pid, qty:1 }) });
    await load();
  }
  async function remove(pid:number){ await fetch(`${API}/cart/remove`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId: pid }) }); await load(); }
  async function setQty(pid:number, q:number){ const i=items.find((x:any)=> (x.productId||x.product_id)===pid); const current=i?i.qty:0; const delta=Math.max(1,q)-current; if(delta!==0){ await fetch(`${API}/cart/add`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId: pid, qty: delta }) }); await load(); } }
  async function apply(){ const r=await fetch(`${API}/discounts/validate`,{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code })}); const d=await r.json(); if(r.ok) setDiscount(d.discount_cents||0); else { setDiscount(0); alert(d.error||'Invalid code'); } }

  const payable=Math.max(0,total-discount);

  return (
    <section className="container">
      <div className="topbar"><div><div className="badge">Curated for You</div><h2>Elegant Dresses</h2></div>
        <div className="cart-panel" style={{maxWidth:420,flex:'0 0 420px'}}>
          <div style={{fontWeight:700, marginBottom:'.5rem'}}>Your Cart</div>
          <div>
            {items.length===0? <div className="sub">Your cart is empty.</div> : items.map((i:any,idx:number)=>{ const pid=i.productId||i.product_id; return (
              <div key={idx} className="row"><div>PID {pid} × <input type="number" min={1} defaultValue={i.qty} style={{width:60}} onChange={e=>setQty(pid, Number(e.target.value||1))}/></div><div><button className="btn ghost" onClick={()=>remove(pid)}>Remove</button></div></div>
            ); })}
          </div>
          <div className="row" style={{borderBottom:0}}><div style={{flex:1}}><input className="input" placeholder="Promo code" value={code} onChange={e=>setCode(e.target.value)}/></div><button className="btn ghost" onClick={apply} style={{marginLeft:8}}>Apply</button></div>
          <div className="total">Subtotal: ₹{(total/100).toFixed(2)}</div>
          <div className="total" style={{color: discount>0?'#22c55e':undefined}}>Discount: -₹{(discount/100).toFixed(2)}</div>
          <div className="total">Payable: ₹{(payable/100).toFixed(2)}</div>
          <div className="actions"><a className="btn" href="/checkout">Proceed to Checkout</a></div>
        </div>
      </div>
      <div className="grid">{products.map(p=> (
        <div key={p.id} className="card"><img src={p.imageUrl||''} alt={p.name} />
          <div className="pad"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontWeight:700}}>{p.name}</div><div className="price">₹{(p.priceCents/100).toFixed(2)}</div></div>
            <div className="sub" style={{fontSize:'.9rem',margin:'.25rem 0 .5rem'}}>{p.description||''}</div>
            <div className="actions"><button className="btn" onClick={()=>add(p.id)}>Add to cart</button></div>
          </div>
        </div>
      ))}</div>
    </section>
  );
}
