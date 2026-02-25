'use client';
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE as string;
export default function Account(){
  const [user,setUser]=useState<any>(null);
  useEffect(()=>{ fetch(`${API}/me`,{ credentials:'include' }).then(r=>r.json()).then(d=>setUser(d.user)).catch(()=>setUser(null)); },[]);
  if(!user) return <section className='container'><div className='form'>Please sign in.</div></section>;
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Welcome back</div><h2>My Account</h2></div></div>
      <div className='form' style={{maxWidth:520}}>
        <div className='field'><label>Name</label><input className='input' value={user.name||''} readOnly/></div>
        <div className='field'><label>Email</label><input className='input' value={user.email||''} readOnly/></div>
        <div className='field'><label>Member since</label><input className='input' value={new Date(user.createdAt||Date.now()).toLocaleDateString()} readOnly/></div>
        <div className='actions'><a className='btn' href='/orders'>View Orders</a><a className='btn ghost' href='/catalog'>Continue Shopping</a></div>
      </div>
    </section>
  );
}
