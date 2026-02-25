// app/page.tsx
import React from 'react';

type Product = {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: number;
};

async function getProducts(): Promise<{ products: Product[] }> {
  const base = process.env.NEXT_PUBLIC_API_BASE;

  if (!base) {
    console.error('API Base URL is missing!');
    return { products: [] };
  }

  try {
    // ISR: revalidate every 60 seconds
    const res = await fetch(`${base}/products`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn('Backend responded with an error:', res.status, res.statusText);
      return { products: [] };
    }
    return res.json();
  } catch (err) {
    console.error('Could not connect to backend at ' + base, err);
    return { products: [] };
  }
}

export default async function Home() {
  const { products } = await getProducts();

  return (
    <>
      <section className="hero">
        <div
          className="container"
          style={{
            minHeight: '70vh',
            display: 'grid',
            gridTemplateColumns: '1.2fr .8fr',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="kicker">New Season • SS26</div>
            <h1 className="h1">Elegance in Every Stitch</h1>
            <p className="sub">
              Discover refined silhouettes and luxurious fabrics crafted for modern women.
            </p>
            <div className="ctas">
              <a className="btn" href="/catalog">Shop Dresses</a>
              <a className="btn ghost" href="/signup">Join La Rivera</a>
            </div>
          </div>

          <div>
            {/* Use plain <img> to avoid Next/Image config */}
            <img
              className="hero-img"
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
              alt="Elegant dress"
              width={1600}
              height={1000}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="topbar">
          <div className="badge">Signature Collection</div>
          <a className="link" href="/catalog">Explore the catalog →</a>
        </div>

        <div className="grid">
          {(products || []).slice(0, 4).map((p: Product) => (
            <div key={p.id} className="card">
              <img
                src={p.imageUrl || ''}
                alt={p.name}
                width={1200}
                height={800}
                style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
              />
              <div className="pad">
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div className="sub" style={{ fontSize: '.9rem', margin: '.25rem 0 .5rem' }}>
                  {p.description || ''}
                </div>
                <div className="price">₹{(p.priceCents / 100).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
``