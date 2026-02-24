import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'La Rivera – Elegance in Every Stitch', description: 'Timeless dresses crafted for modern women.' };

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div className="brand">La <em>Rivera</em></div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <Link href="/">Home</Link>
              <Link href="/catalog">Catalog</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/account">Account</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/addresses">Addresses</Link>
              <Link href="/admin">Admin</Link>
              <a className="btn ghost" href="#" onClick={async (e)=>{ e.preventDefault(); await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/logout`,{ method:'POST', credentials:'include' }); window.location.href='/'; }}>Logout</a>
              <Link className="btn ghost" href="/login">Sign In</Link>
              <Link className="btn" href="/signup">Create Account</Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="footer container">© La Rivera.</footer>
        <div id="toast"></div>
      </body>
    </html>
  );
}
