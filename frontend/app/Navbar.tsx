"use client";
import Link from 'next/link';

export default function Navbar() {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const base = process.env.NEXT_PUBLIC_API_BASE;
    await fetch(`${base}/auth/logout`, { 
      method: 'POST', 
      credentials: 'include' 
    });
    window.location.href = '/';
  };

  return (
    <nav className="nav">
      <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div className="brand">La <em>Rivera</em></div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <Link href="/">Home</Link>
          <Link href="/catalog">Catalog</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/account">Account</Link>
          <a className="btn ghost" href="#" onClick={handleLogout}>Logout</a>
          <Link className="btn ghost" href="/login">Sign In</Link>
          <Link className="btn" href="/signup">Create Account</Link>
        </div>
      </div>
    </nav>
  );
}