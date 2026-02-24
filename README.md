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
```bash

What’s inside (quick map)
la-rivera-monorepo/
├─ frontend/
│  ├─ app/                  # Next.js App Router pages
│  │  ├─ (home, login, signup, catalog, checkout, account, orders, wishlist, addresses)
│  │  └─ admin/             # Admin UI (products, discounts, orders)
│  ├─ next.config.mjs
│  ├─ package.json
│  ├─ .env.example          # NEXT_PUBLIC_API_BASE (defaults to http://localhost:4000)
│  └─ app/globals.css       # design tokens + styles
└─ backend/
   ├─ prisma/
   │  ├─ schema.prisma      # Users, Products, Cart, Orders, Discounts, Wishlist, Addresses, Payments
   │  └─ seed.js            # seeds products, discount codes, and an Admin user
   ├─ server.js             # Express API (CORS + cookie auth)
   ├─ package.json
   └─ .env.example          # DATABASE_URL, JWT_SECRET, FRONTEND_ORIGIN, PORT



⭐ 1. OVERALL AWS ARCHITECTURE (RECOMMENDED)
                 ┌─────────────────────┐
                 │      Route53        │
                 │ (your domain, e.g.) │
                 │  larivera.in        │
                 └─────────┬───────────┘
                           ▼
                ┌─────────────────────┐
                │   Application Load   │
                │     Balancer (ALB)   │
                ├──────────────────────┤
 HTTPS :443 --->│  Listener : 443      │
                │   - /api/* → TG-API  │──▶ Backend EC2 (port 4000)
                │   - /*     → TG-FE   │──▶ Frontend EC2 (port 3000)
                └──────────────────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     RDS MySQL     │
                 │  (private subnet) │
                 └───────────────────┘


⭐ 2. EC2 INSTANCES & PORTS
You will create two EC2 instances:
A) Backend EC2





























PropertyValuePurposeNodeJS Express + Prisma APIPort open internally4000Public accessNO (private subnet)Target group port4000Inbound SGAllow traffic ONLY from ALB SG → 4000

B) Frontend EC2





























PropertyValuePurposeNext.js frontend (SSR)Port open internally3000Public accessNO (private subnet)Target group port3000Inbound SGAllow traffic ONLY from ALB SG → 3000

⭐ 3. TARGET GROUP SETUP (VERY IMPORTANT)
You will create TWO target groups:

🔵 Target Group 1 — TG-API (Backend)

































SettingValueNametg-backend-apiTarget typeInstancesProtocolHTTPPort4000Health check path/healthHealth check porttraffic-port
📌 Attach: Backend EC2 instance

🟢 Target Group 2 — TG-FE (Frontend)

































SettingValueNametg-frontendTarget typeInstancesProtocolHTTPPort3000Health check path/Health check porttraffic-port
📌 Attach: Frontend EC2 instance

⭐ 4. APPLICATION LOAD BALANCER (ALB)
Listeners
Set up listeners like this:
1) HTTPS :443 (recommended)

Add SSL certificate from ACM
Default rule → TG-FE
Add advanced routing rule for API


ALB Routing Rules
Under Listener: HTTPS:443
Rule 1 — /api → Backend
IF Path starts with /api
FORWARD to: tg-backend-api

Rule 2 — / → Frontend
Default rule
FORWARD to: tg-frontend


⭐ 5. DOMAIN & ROUTE53 SETUP
Assuming domain:
www.larivera.in
api.larivera.in  (optional)

1) Create A record
Type: A
Name: larivera.in
Value: ALB DNS name
Routing: Simple

(Optional) API Subdomain
Type: A
Name: api.larivera.in
Value: ALB DNS name

(If you use subdomain routing, add host-header rule in ALB too.)

⭐ 6. ENV VARIABLES FOR PRODUCTION
Backend .env
NODE_ENV=production
PORT=4000
DATABASE_URL="mysql://DBUSER:DBPASS@your-rds-endpoint:3306/larivera"
JWT_SECRET="super_long_random_64_char_secret"
FRONTEND_ORIGIN="https://larivera.in"

✔ Correct Database URL format
For Amazon RDS MySQL:
DATABASE_URL="mysql://admin:yourpassword@larivera-db.xxxxx.ap-south-1.rds.amazonaws.com:3306/larivera"


Frontend .env
NEXT_PUBLIC_API_BASE="https://larivera.in/api"

Then:
npm run build
npm start


⭐ 7. SECURITY GROUPS
SG-ALB
Inbound:

443 (HTTPS) → 0.0.0.0/0

Outbound:

Allow to SG-Backend:4000
Allow to SG-Frontend:3000


SG-Backend
Inbound:

4000 → from SG-ALB

Outbound:

3306 → RDS SG


SG-Frontend
Inbound:

3000 → from SG-ALB


SG-RDS
Inbound:

3306 → from SG-Backend only

(NEVER open MySQL to 0.0.0.0)

⭐ 8. BACKEND SERVICE STARTUP
SSH into backend EC2:
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run start

Make sure it shows:
Backend listening on :4000


⭐ 9. FRONTEND SERVICE STARTUP
SSH into frontend EC2:
cd frontend
npm install --production
npm run build
npm start


⭐ 10. FINAL CHECKLIST
✔ Target groups healthy

TG-API → health shows /health
TG-FE → health shows /

✔ HTTPS works

https://larivera.in
https://larivera.in/api/health

✔ Admin login works

admin@larivera.test
Admin@123

✔ CORS + cookies work
You MUST keep:
FRONTEND_ORIGIN=https://larivera.in

and run ALB in HTTPS.

```
