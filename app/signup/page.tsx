'use client';
export default function Signup(){
  async function onSubmit(e: any){
    e.preventDefault();
    const name=e.target.name.value; const email=e.target.email.value; const password=e.target.password.value;
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/signup`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
    if(!r.ok){ alert('Signup failed'); return; }
    window.location.href='/catalog';
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      <h2 style={{margin:'.25rem 0 1rem'}}>Create Account</h2>
      <div className="field"><label>Name</label><input className="input" name="name" required/></div>
      <div className="field"><label>Email</label><input className="input" name="email" type="email" required/></div>
      <div className="field"><label>Password</label><input className="input" name="password" type="password" required minLength={8}/></div>
      <div className="actions"><button className="btn" type="submit">Create Account</button><a className="btn ghost" href="/login">Already have an account?</a></div>
    </form>
  );
}
