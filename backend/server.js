require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || 'false') === 'true'; // set true only when you serve HTTPS
const key = new TextEncoder().encode(JWT_SECRET);

// ---------- CORS (case-insensitive host compare) ----------
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
    .filter(Boolean)
    .map(o => o.toLowerCase())
);

app.use(cors({
  origin(origin, cb) {
    // allow SSR/tools and same-origin fetches without Origin header
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin.toLowerCase())) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

// ---------- Health (for TG + manual) ----------
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => res.status(200).send('OK'));

// ---------- Helpers ----------
function setAuthCookie(res, token) {
  res.cookie('lr_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,       // IMPORTANT: keep false on HTTP ALB; set true after HTTPS
    path: '/',
    maxAge: 4 * 60 * 60 * 1000,  // 4 hours
  });
}

async function signJwt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('4h')
    .sign(key);
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.lr_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { payload } = await jwtVerify(token, key);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// ---------- API router mounted at /api ----------
const api = express.Router();

// Auth
api.post('/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, cart: { create: {} } },
      select: { id: true, name: true, email: true, createdAt: true, isAdmin: true },
    });

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

api.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    next(err);
  }
});

api.post('/auth/logout', (_req, res) => {
  res.clearCookie('lr_token', { path: '/' });
  res.json({ ok: true });
});

api.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, name: true, email: true, createdAt: true, isAdmin: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Products (will 500 if tables don’t exist; see steps to create schema)
api.get('/products', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// Mount router
app.use('/api', api);

// ---------- Global error handler (avoid empty reply) ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- Listen ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on :${PORT}`);
});
