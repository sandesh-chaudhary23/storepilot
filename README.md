# 🛍️ StorePilot

> A modern inventory & order management SaaS for small businesses — full-stack **MERN** MVP.

StorePilot has **two sides that share one backend and database**:

1. **Staff admin** (`/`) — the business Owner/Employees manage products, inventory, customers, orders, analytics, and AI product copy.
2. **Public storefront** (`/shop/:slug`) — shoppers browse the catalog, add to cart, create an account, and check out. Their orders decrement the same stock and appear in the staff dashboard.

See [`reamde.md`](./reamde.md) for the original product spec.

---

## ✨ What's built (MVP)

| Area | Features |
|------|----------|
| **Auth** | Register (creates owner + business), Login, Logout, JWT in HTTP-only cookie, Forgot/Reset password |
| **Products** | CRUD, SKU, price/cost, category, tags, image upload, low-stock threshold, search |
| **Inventory** | Stock adjustments (add/remove), full inventory history log, low-stock alerts |
| **Customers** | CRUD, search, purchase history + total-spent stats |
| **Orders** | Multi-item orders, live totals/tax, **automatic stock decrement + inventory logging**, status workflow (pending → processing → shipped → delivered / cancelled), cancel restores stock |
| **Dashboard** | Revenue, orders, products, customers, low-stock counts, 7-day revenue chart, orders-by-status chart, recent orders |
| **AI** | Generate product description + tags via **Google Gemini** (mock fallback with no key) |
| **Profile** | Update name/email, change password, upload avatar |
| **Roles** | `owner` (full access) and `employee` (orders/inventory, read-only products) |
| **Storefront** | Public catalog by store slug, search + category filter, product pages, cart (localStorage), shopper signup/login, self-checkout, "My Orders" |

### How the two sides connect
A shopper who signs up becomes a **Customer** record (the same model staff use) with a
password attached — so their orders show in **both** their own *My Orders* and the staff
*Customer detail* view. Staff and storefront orders run through **one shared order service**,
so stock validation, decrement, and inventory logging are identical no matter who orders.
Shopper sessions use a separate `shopToken` cookie, isolated from staff auth.

Each business gets a URL **slug** (e.g. `demo-store`); its storefront lives at
`/shop/<slug>`. The staff Dashboard shows a **"Your storefront is live"** card with a
copyable link.

---

## 🛠 Stack

**Frontend:** React + Vite, Tailwind CSS, React Router, TanStack Query, Axios, Recharts, lucide-react
**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, Multer, Cloudinary, Nodemailer
**AI:** Google Gemini API

---

## 🚀 Quick start

Requires **Node 18+**. Runs out of the box with **zero external accounts** thanks to fallbacks
(in-memory DB, local-disk images, mock AI, Ethereal email).

```bash
# from the project root
npm run install:all      # installs server + client deps
npm run dev              # starts API (:5050) and web (:5173) together
```

Open **http://localhost:5173**.

> On macOS, port **5000** is used by Control Center, so the API runs on **5050**.
> If **5173** is busy, Vite picks the next free port (e.g. 5174) — check the terminal.

### Optional: seed demo data
Only persists with a real database (`MONGODB_URI` set). Then:
```bash
npm run seed
```
This creates:
- **Staff login:** `owner@storepilot.app` / `password123` → dashboard at `/`
- **Shopper login:** `shopper@storepilot.app` / `password123` → storefront at `/shop/demo-store`

Without a seed, just click **Create account** on either the staff login or the storefront.
Re-running `npm run seed` is idempotent (keeps the same `demo-store` slug).

---

## 🔑 Configuration

Copy the example env and fill in only what you need — everything has a working fallback:

```bash
cp server/.env.example server/.env
```

| Variable | Purpose | Fallback when blank |
|----------|---------|---------------------|
| `MONGODB_URI` | MongoDB Atlas connection string | In-memory MongoDB (resets on restart) |
| `JWT_SECRET` | Signs auth tokens | Dev default (change for production) |
| `GEMINI_API_KEY` | Real AI product copy ([get one](https://aistudio.google.com/apikey)) | Deterministic mock response |
| `CLOUDINARY_*` | Hosted image uploads | Local disk under `server/uploads/` |
| `SMTP_*` | Real password-reset emails | Ethereal test inbox (preview URL logged) |

---

## 📁 Structure

```
store_pilot/
├── server/                 # Express API
│   └── src/
│       ├── models/         # User, Business, Product, Category, Customer, Order, InventoryLog
│       ├── controllers/    # auth, product, category, inventory, customer, order, dashboard, ai, profile
│       ├── routes/         # one router per resource
│       ├── middlewares/    # auth (protect/authorize), upload, error
│       ├── services/       # aiService (Gemini), emailService, uploadService (Cloudinary/disk)
│       ├── config/db.js    # Atlas + in-memory fallback
│       └── server.js       # entry
└── client/                 # Vite + React SPA
    └── src/
        ├── pages/          # Login, Register, Dashboard, Products, Inventory, Customers, Orders, Profile, …
        ├── components/     # DashboardLayout (sidebar), ui (Modal/PageHeader/…)
        ├── context/        # AuthContext
        └── lib/            # axios client, formatters
```

---

## 🔌 API overview

All under `/api`, cookie-authenticated (`protect`). Owner-only routes use `authorize('owner')`.

```
POST   /auth/register        POST /auth/login         POST /auth/logout
GET    /auth/me              POST /auth/forgot-password   POST /auth/reset-password/:token
GET/POST/PUT/DELETE  /products      /categories      /customers
GET/POST  /orders            PUT  /orders/:id/status
POST   /inventory/:productId/adjust    GET /inventory/logs    GET /inventory/low-stock
GET    /dashboard            POST /ai/product-content
PUT    /profile             PUT  /profile/password   POST /profile/avatar
GET/PUT  /business           # current store (incl. storefront slug)
```

**Public storefront** under `/api/shop/:slug` (customer-authenticated via `shopToken`):
```
GET   /shop/:slug                       # store info
GET   /shop/:slug/products  /categories  /products/:id
POST  /shop/:slug/auth/register  /auth/login  /auth/logout   GET /auth/me
POST  /shop/:slug/orders    GET /shop/:slug/orders            # place / list own orders
```

---

## ✅ Verified

- Backend boots, all resources CRUD via HTTP, staff + shopper auth cookie flows work.
- Order creation decrements stock and writes an inventory log; over-ordering is rejected; cancelling restores stock.
- **Storefront**: shopper registers → places order → stock decrements → order shows in the shopper's *My Orders* **and** the staff *Customer detail* + orders list (tagged `source: storefront`).
- Dashboard aggregates revenue/orders correctly and shows the storefront link.
- Frontend production build succeeds (all staff + storefront pages compile); API reachable through the Vite proxy.

## 📦 Deployment (per spec)
Frontend → Vercel · Backend → AWS EC2 (PM2 + Nginx) · DB → MongoDB Atlas · Images → Cloudinary.
Set the production env vars above and point the client at your API origin.
