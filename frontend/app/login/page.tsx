'use client';
export default function Login(){
  async function onSubmit(e: any){
    e.preventDefault();
    const email = e.target.email.value; const password = e.target.password.value;
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/login`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    if(!r.ok){ alert('Login failed'); return; }
    const next = new URLSearchParams(window.location.search).get('next') || '/catalog';
    window.location.href = next;
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 style={{margin:'.25rem 0 1rem'}}>Sign In</h2>
      <div className="field"><label>Email</label><input className="input" name="email" type="email" required/></div>
      <div className="field"><label>Password</label><input className="input" name="password" type="password" required minLength={8}/></div>
      <div className="actions"><button className="btn" type="submit">Sign In</button><a className="btn ghost" href="/signup">Create account</a></div>
    </form>
  );
}
