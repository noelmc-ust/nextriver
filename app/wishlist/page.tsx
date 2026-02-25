'use client';
import { API_BASE } from "../lib/apiBase";
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function Wishlist(){
  const [products,setProducts]=useState<any[]>([]);
  useEffect(()=>{ fetch(`${API_BASE}/wishlist`,{ credentials:'include' }).then(r=>r.json()).then(d=>setProducts(d.products||[])); },[]);
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Your Favourites</div><h2>Wishlist</h2></div></div>
      <div className='grid'>
        {products.length===0? <div className='sub'>No items in wishlist yet.</div> : products.map((p:any)=> (
          <div key={p.id} className='card'>
            <img src={p.imageUrl||''} alt={p.name} />
            <div className='pad'><div style={{display:'flex',justifyContent:'space-between'}}><div style={{fontWeight:700}}>{p.name}</div><div className='price'>₹{(p.priceCents/100).toFixed(2)}</div></div>
              <div className='sub' style={{fontSize:'.9rem', margin:'.25rem 0 .5rem'}}>{p.description||''}</div>
              <div className='actions'><a className='btn' href='/catalog'>View in Catalog</a></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
