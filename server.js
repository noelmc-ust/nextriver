require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = (process.env.JWT_SECRET || 'dev_secret_change_me');
const key = new TextEncoder().encode(JWT_SECRET);

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

function setAuthCookie(res, token){
  res.cookie('lr_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV==='production',
    path: '/',
    maxAge: 4*60*60*1000
  });
}

async function signJwt(payload){
  return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('4h').sign(key);
}

async function requireAuth(req, res, next){
  const token = req.cookies.lr_token;
  if(!token) return res.status(401).json({ error: 'Unauthorized' });
  try{
    const { payload } = await jwtVerify(token, key);
    req.user = payload; next();
  }catch{ return res.status(401).json({ error: 'Unauthorized' }); }
}

async function requireAdmin(req,res,next){
  await requireAuth(req,res, async ()=>{
    const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select:{ isAdmin: true } });
    if(!user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

// Health
app.get('/health', (_req,res)=> res.status(200).send('OK'));

// Auth
app.post('/auth/signup', async (req,res)=>{
  const { name, email, password } = req.body||{};
  if(!name||!email||!password) return res.status(400).json({ error:'Missing fields' });
  const exists = await prisma.user.findUnique({ where: { email } });
  if(exists) return res.status(409).json({ error:'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, cart: { create: {} } }, select: { id:true, name:true, email:true, createdAt:true, isAdmin:true } });
  const token = await signJwt({ sub: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  setAuthCookie(res, token); res.json({ user });
});

app.post('/auth/login', async (req,res)=>{
  const { email, password } = req.body||{};
  if(!email||!password) return res.status(400).json({ error:'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return res.status(401).json({ error:'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({ error:'Invalid credentials' });
  const token = await signJwt({ sub: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  setAuthCookie(res, token);
  res.json({ user: { id:user.id, name:user.name, email:user.email, createdAt:user.createdAt, isAdmin:user.isAdmin } });
});

app.post('/auth/logout', (req,res)=>{ res.clearCookie('lr_token', { path:'/' }); res.json({ ok:true }); });

app.get('/me', requireAuth, async (req,res)=>{
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id:true, name:true, email:true, createdAt:true, isAdmin:true } });
  res.json({ user });
});

// Products
app.get('/products', async (_req,res)=>{
  const products = await prisma.product.findMany({ where: { active:true }, orderBy:{ id:'asc' } });
  res.json({ products });
});

// Cart
app.get('/cart', requireAuth, async (req,res)=>{
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.sub } });
  if(!cart) return res.json({ items: [] });
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, select: { productId:true, qty:true } });
  res.json({ items });
});

app.post('/cart/add', requireAuth, async (req,res)=>{
  const { productId, qty } = req.body||{};
  if(!productId || !qty || qty<1) return res.status(400).json({ error:'Invalid payload' });
  const cart = await prisma.cart.upsert({ where: { userId: req.user.sub }, update: {}, create: { userId: req.user.sub } });
  await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, update: { qty: { increment: qty } }, create: { cartId: cart.id, productId, qty } });
  res.json({ ok:true });
});

app.post('/cart/remove', requireAuth, async (req,res)=>{
  const { productId } = req.body||{};
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.sub } });
  if(!cart) return res.json({ ok:true });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  res.json({ ok:true });
});

// Wishlist
app.get('/wishlist', requireAuth, async (req,res)=>{
  const items = await prisma.wishlistItem.findMany({ where: { userId: req.user.sub }, include: { product: true } });
  const products = items.map(i=>({ id:i.product.id, name:i.product.name, description:i.product.description, priceCents:i.product.priceCents, imageUrl:i.product.imageUrl }));
  res.json({ products });
});

app.post('/wishlist/add', requireAuth, async (req,res)=>{
  const { productId } = req.body||{}; if(!productId) return res.status(400).json({ error:'Invalid payload' });
  await prisma.wishlistItem.upsert({ where: { userId_productId: { userId:req.user.sub, productId } }, update:{}, create:{ userId:req.user.sub, productId } });
  res.json({ ok:true });
});

app.post('/wishlist/remove', requireAuth, async (req,res)=>{
  const { productId } = req.body||{};
  await prisma.wishlistItem.deleteMany({ where: { userId:req.user.sub, productId } });
  res.json({ ok:true });
});

// Addresses
app.get('/addresses', requireAuth, async (req,res)=>{
  const addresses = await prisma.userAddress.findMany({ where: { userId: req.user.sub }, orderBy:{ createdAt:'desc' } });
  res.json({ addresses });
});

app.post('/addresses/add', requireAuth, async (req,res)=>{
  const b=req.body||{};
  const required=['fullName','line1','city','state','postalCode'];
  for(const k of required){ if(!b[k]) return res.status(400).json({ error:'Missing fields' }); }
  const a = await prisma.userAddress.create({ data: { userId:req.user.sub, fullName:b.fullName, line1:b.line1, line2:b.line2||null, city:b.city, state:b.state, postalCode:b.postalCode, country:b.country||'IN', phone:b.phone||'', isDefault: !!b.isDefault } });
  if(b.isDefault){ await prisma.userAddress.updateMany({ where: { userId:req.user.sub, id: { not: a.id } }, data:{ isDefault:false } }); }
  res.json({ address:a });
});

app.post('/addresses/update', requireAuth, async (req,res)=>{
  const b=req.body||{}; const id=Number(b.id); if(!id) return res.status(400).json({ error:'Invalid id' });
  const data={}; ['fullName','line1','line2','city','state','postalCode','country','phone'].forEach(k=>{ if(b[k]!==undefined) data[k]=b[k]; });
  await prisma.userAddress.update({ where: { id }, data });
  if(b.isDefault===true){
    await prisma.userAddress.update({ where: { id }, data: { isDefault:true } });
    await prisma.userAddress.updateMany({ where: { userId:req.user.sub, id: { not: id } }, data: { isDefault:false } });
  }
  res.json({ ok:true });
});

app.post('/addresses/delete', requireAuth, async (req,res)=>{
  const { id } = req.body||{}; if(!id) return res.status(400).json({ error:'Invalid id' });
  await prisma.userAddress.delete({ where: { id:Number(id) } });
  res.json({ ok:true });
});

// Discounts
app.post('/discounts/validate', requireAuth, async (req,res)=>{
  const code = String((req.body||{}).code||'').toUpperCase().trim();
  if(!code) return res.status(400).json({ error:'Invalid code' });
  const dc = await prisma.discountCode.findUnique({ where: { code } });
  if(!dc || !dc.active) return res.status(400).json({ error:'Invalid code' });
  if(dc.expiresAt && dc.expiresAt < new Date()) return res.status(400).json({ error:'Code expired' });
  if(dc.maxRedemptions && dc.timesUsed >= dc.maxRedemptions) return res.status(400).json({ error:'Code exhausted' });
  const cart = await prisma.cart.findUnique({ where: { userId:req.user.sub } });
  if(!cart) return res.status(400).json({ error:'Cart empty' });
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
  if(!items.length) return res.status(400).json({ error:'Cart empty' });
  const products = await prisma.product.findMany({ where: { id: { in: items.map(i=>i.productId) } } });
  const map = new Map(products.map(p=>[p.id,p]));
  let total=0; for(const i of items){ const p=map.get(i.productId); if(p) total += p.priceCents * i.qty; }
  let discount=0; if(dc.type==='PERCENT') discount = Math.floor(total*(dc.value/100)); else discount = Math.min(total, dc.value);
  res.json({ code: dc.code, discount_cents: discount, total_cents: total, payable_cents: Math.max(0,total-discount) });
});

// Orders
app.get('/orders', requireAuth, async (req,res)=>{
  const orders = await prisma.order.findMany({ where: { userId:req.user.sub }, orderBy:{ createdAt:'desc' }, include: { items:true } });
  const shaped = orders.map(o=>({ id:o.id, user_id:o.userId, created_at:o.createdAt, total_cents:o.totalCents, status:o.status, applied_code:o.appliedCode, applied_discount_cents:o.appliedDiscountCents, line_items:o.items.map(i=>({ name:i.name, qty:i.qty, price_cents:i.priceCents, subtotal_cents:i.subtotalCents })) }));
  res.json({ orders: shaped });
});

app.post('/orders/checkout', requireAuth, async (req,res)=>{
  const body=req.body||{}; const code=String(body.code||'').toUpperCase().trim(); const shipping=body.shippingAddress; const payment=body.payment;
  try{
    const result = await prisma.$transaction(async(tx)=>{
      const cart = await tx.cart.findUnique({ where: { userId:req.user.sub } }); if(!cart) throw new Error('Cart missing');
      const items = await tx.cartItem.findMany({ where: { cartId: cart.id } }); if(!items.length) throw new Error('Cart empty');
      const products = await tx.product.findMany({ where: { id: { in: items.map(i=>i.productId) }, active:true }, select:{ id:true, name:true, priceCents:true } });
      const map = new Map(products.map(p=>[p.id,p]));
      let total=0; const lines = items.map(i=>{ const p=map.get(i.productId); const sub=p.priceCents*i.qty; total+=sub; return { productId:p.id, name:p.name, qty:i.qty, priceCents:p.priceCents, subtotalCents:sub }; });
      let appliedCode=null; let discount=0;
      if(code){ const dc=await tx.discountCode.findUnique({ where:{ code } }); if(dc && dc.active && (!dc.expiresAt||dc.expiresAt>=new Date()) && (!dc.maxRedemptions||dc.timesUsed<dc.maxRedemptions)){ appliedCode=dc.code; discount = dc.type==='PERCENT'? Math.floor(total*(dc.value/100)) : Math.min(total, dc.value); await tx.discountCode.update({ where:{ id:dc.id }, data:{ timesUsed:{ increment:1 } } }); } }
      const order = await tx.order.create({ data: { userId:req.user.sub, totalCents: Math.max(0,total-discount), status:'paid', paymentStatus:'paid', appliedCode: appliedCode||undefined, appliedDiscountCents: discount, shippingAddress: shipping||undefined, items: { create: lines } } });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.payment.create({ data: { orderId: order.id, method: String(payment?.method||'SIMULATED'), details: payment||{}, amountCents: Math.max(0,total-discount), status:'succeeded' } });
      return { id: order.id, total: order.totalCents };
    });
    res.json({ order: { id: result.id, total_cents: result.total } });
  }catch(e){ res.status(400).json({ error: e.message||'Checkout failed' }); }
});

app.get('/orders/:id/invoice', requireAuth, async (req,res)=>{
  const id = Number(req.params.id);
  const order = await prisma.order.findFirst({ where: { id, userId:req.user.sub }, include:{ items:true, user:true } });
  if(!order) return res.status(404).json({ error:'Not found' });
  const doc = new PDFDocument({ size:'A4', margin:50 });
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`inline; filename="invoice-${order.id}.pdf"`);
  doc.pipe(res);
  doc.fontSize(20).text('La Rivera'); doc.fontSize(12).text('Invoice', { align:'right' }); doc.moveDown();
  doc.text(`Invoice #: ${order.id}`); doc.text(`Date: ${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}`); doc.text(`Billed To: ${order.user.name} <${order.user.email}>`); doc.moveDown();
  doc.text('Item',50,doc.y,{continued:true}).text('Qty',300,doc.y,{continued:true}).text('Price',360,doc.y,{continued:true}).text('Subtotal',430);
  doc.moveTo(50, doc.y+3).lineTo(550, doc.y+3).stroke();
  order.items.forEach(it=>{ doc.text(it.name,50,doc.y+6,{continued:true}).text(String(it.qty),300,doc.y,{continued:true}).text(`₹${(it.priceCents/100).toFixed(2)}`,360,doc.y,{continued:true}).text(`₹${(it.subtotalCents/100).toFixed(2)}`,430); });
  if(order.appliedCode){ doc.moveDown(); doc.text(`Promo (${order.appliedCode}): -₹${(order.appliedDiscountCents/100).toFixed(2)}`); }
  doc.fontSize(14).text(`Total: ₹${(order.totalCents/100).toFixed(2)}`, { align:'right' });
  doc.end();
});

// Admin
app.get('/admin/products', requireAdmin, async (_req,res)=>{ const products = await prisma.product.findMany({ orderBy:{ id:'asc' } }); res.json({ products }); });
app.post('/admin/products', requireAdmin, async (req,res)=>{ const b=req.body||{}; const p = await prisma.product.create({ data: { name:String(b.name||'Untitled'), description:b.description||null, priceCents:Number(b.priceCents||0), imageUrl:b.imageUrl||null, stock:Number(b.stock||100), sku:b.sku||null, active:b.active!==false } }); res.json({ product:p }); });
app.patch('/admin/products/:id', requireAdmin, async (req,res)=>{ const id=Number(req.params.id); const b=req.body||{}; const data={}; ['name','description','priceCents','imageUrl','stock','sku','active'].forEach(k=>{ if(b[k]!==undefined) data[k]=b[k]; }); const p=await prisma.product.update({ where:{ id }, data }); res.json({ product:p }); });
app.delete('/admin/products/:id', requireAdmin, async (req,res)=>{ const id=Number(req.params.id); await prisma.product.delete({ where:{ id } }); res.json({ ok:true }); });

app.get('/admin/discounts', requireAdmin, async (_req,res)=>{ const codes = await prisma.discountCode.findMany({ orderBy:{ id:'asc' } }); res.json({ codes }); });
app.post('/admin/discounts', requireAdmin, async (req,res)=>{ const b=req.body||{}; const c=await prisma.discountCode.create({ data: { code:String(b.code||'').toUpperCase(), type: b.type==='FIXED'?'FIXED':'PERCENT', value:Number(b.value||0), active:b.active!==false, expiresAt: b.expiresAt? new Date(b.expiresAt): null, maxRedemptions: b.maxRedemptions? Number(b.maxRedemptions): null } }); res.json({ code:c }); });
app.patch('/admin/discounts/:id', requireAdmin, async (req,res)=>{ const id=Number(req.params.id); const b=req.body||{}; const data={}; ['code','type','value','active','expiresAt','maxRedemptions'].forEach(k=>{ if(b[k]!==undefined) data[k]=b[k]; }); if(data.code) data.code=String(data.code).toUpperCase(); if(data.expiresAt) data.expiresAt=new Date(data.expiresAt); const c=await prisma.discountCode.update({ where:{ id }, data }); res.json({ code:c }); });
app.delete('/admin/discounts/:id', requireAdmin, async (req,res)=>{ const id=Number(req.params.id); await prisma.discountCode.delete({ where:{ id } }); res.json({ ok:true }); });

app.get('/admin/orders', requireAdmin, async (_req,res)=>{ const orders = await prisma.order.findMany({ orderBy:{ createdAt:'desc' }, include: { items:true, user:true } }); res.json({ orders }); });
app.post('/admin/orders/:id/status', requireAdmin, async (req,res)=>{ const id=Number(req.params.id); const status=String((req.body||{}).status); const allowed=['paid','shipped','delivered','cancelled']; if(!allowed.includes(status)) return res.status(400).json({ error:'Invalid status' }); const o=await prisma.order.update({ where:{ id }, data:{ status } }); res.json({ order:o }); });

app.listen(PORT, ()=> console.log(`Backend listening on :${PORT}`));
