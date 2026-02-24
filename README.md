# La Rivera Monorepo (Frontend + Backend)

This repo contains a separated **frontend** (Next.js) and **backend** (Express + Prisma) for the La Rivera store with:
- Auth (HTTP-only cookies)
- Products, Cart, Orders
- Discount codes
- Wishlist
- Address book & shipping
- PDF invoice
- Admin console (products, discount codes, order status)

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET (long random), FRONTEND_ORIGIN
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev  # runs on :4000
```

### 2) Frontend
```bash
cd ../frontend
cp .env.example .env  # ensure NEXT_PUBLIC_API_BASE points to backend (default http://localhost:4000)
npm i
npm run dev  # runs on :3000
```

### Admin Login
- Email: `admin@larivera.test`
- Password: `Admin@123`

---

## Deploy (your old way)
- Deploy **backend** Node app (port 4000) on private EC2, connect to **RDS** (MySQL).
- Put **ALB (HTTPS)** in front; allow **frontend** (on 3000) or a static host to call backend via HTTPS.
- Set `FRONTEND_ORIGIN=https://your-frontend-domain` and `NODE_ENV=production` on backend to set cookies `secure: true`.
- For frontend, build with `npm run build && npm start` and serve behind ALB as well.

## Notes
- Cookies are same-site across ports on `localhost`. In production across domains, keep HTTPS and set `FRONTEND_ORIGIN` correctly.
- Replace the in-memory rate-limits with Redis if you scale out.
```
