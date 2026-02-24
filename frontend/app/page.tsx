import Image from 'next/image';

async function getProducts(){
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(base + '/products', { next: { revalidate: 60 } });
  if(!res.ok) return { products: [] } as any; return res.json();
}

export default async function Home(){
  const { products } = await getProducts();
  return (
    <>
      <section className="hero">
        <div className="container" style={{minHeight:'70vh', display:'grid', gridTemplateColumns:'1.2fr .8fr', gap:'2rem', alignItems:'center'}}>
          <div>
            <div className="kicker">New Season • SS26</div>
            <h1 className="h1">Elegance in Every Stitch</h1>
            <p className="sub">Discover refined silhouettes and luxurious fabrics crafted for modern women.</p>
            <div className="ctas">
              <a className="btn" href="/catalog">Shop Dresses</a>
              <a className="btn ghost" href="/signup">Join La Rivera</a>
            </div>
          </div>
          <div>
            <Image className="hero-img" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop" alt="Elegant dress" width={1600} height={1000} />
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="topbar"><div className="badge">Signature Collection</div><a className="link" href="/catalog">Explore the catalog →</a></div>
        <div className="grid">
          {(products||[]).slice(0,4).map((p:any)=> (
            <div key={p.id} className="card">
              <Image src={p.imageUrl||''} alt={p.name} width={1200} height={800} style={{width:'100%',height:260,objectFit:'cover'}} />
              <div className="pad"><div style={{fontWeight:700}}>{p.name}</div><div className="sub" style={{fontSize:'.9rem',margin:'.25rem 0 .5rem'}}>{p.description||''}</div><div className="price">₹{(p.priceCents/100).toFixed(2)}</div></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
