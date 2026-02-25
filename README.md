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

```
http://noel-alb-780957247.ap-south-1.elb.amazonaws.com
```


```
├── 📁 backend
│   ├── 📁 prisma
│   │   ├── 📄 schema.prisma
│   │   └── 📄 seed.js
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   └── 📄 server.js
├── 📁 frontend
│   ├── 📁 app
│   │   ├── 📁 account
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 addresses
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 admin
│   │   │   ├── 📁 discounts
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 orders
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 products
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 catalog
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 checkout
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 login
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 orders
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 signup
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 wishlist
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 Navbar.tsx
│   │   ├── 🎨 globals.css
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📄 next-env.d.ts
│   ├── 📄 next.config.mjs
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   └── ⚙️ tsconfig.json
├── ⚙️ .gitignore
└── 📝 README.md
```