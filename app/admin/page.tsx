'use client';
export default function Admin(){
  return (
    <section className='container'>
      <div className='topbar'><div><div className='badge'>Admin</div><h2>Console</h2></div></div>
      <div className='grid'>
        <div className='card'><div className='pad'><h3>Products</h3><p className='sub'>Create, edit, or deactivate products.</p><a className='btn' href='/admin/products'>Manage</a></div></div>
        <div className='card'><div className='pad'><h3>Discount Codes</h3><p className='sub'>Create or toggle promo codes.</p><a className='btn' href='/admin/discounts'>Manage</a></div></div>
        <div className='card'><div className='pad'><h3>Orders</h3><p className='sub'>Update order status.</p><a className='btn' href='/admin/orders'>Manage</a></div></div>
      </div>
    </section>
  );
}
