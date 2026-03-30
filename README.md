# StockSense AI v2.5.0

> AI-powered inventory intelligence for small businesses.
> Mobile-first PWA (installable on Android & iOS) + REST API backend.

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS v3, Recharts           |
| PWA       | vite-plugin-pwa, Workbox (offline-first caching)    |
| Backend   | Node.js, Express 4, MongoDB + Mongoose, JWT         |
| Auth      | bcryptjs password hashing, JWT (7d expiry)          |
| Design    | Material Design 3 dark theme, Inter + Manrope fonts |

---

## Project Structure

```
stocksense/
├── backend/
│   ├── config/db.js                ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       ← register, login, profile
│   │   ├── productController.js    ← CRUD + sale + restock
│   │   ├── billingController.js    ← checkout, invoices, refund
│   │   └── analyticsController.js ← dashboard, insights, alerts
│   ├── middleware/
│   │   ├── authMiddleware.js       ← JWT protect
│   │   ├── roleMiddleware.js       ← requireRole(admin|staff)
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js, Product.js, Movement.js, Invoice.js
│   ├── routes/
│   │   ├── authRoutes.js, productRoutes.js, billingRoutes.js, analyticsRoutes.js
│   ├── utils/aiEngine.js           ← business logic AI (OpenAI-ready)
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/ui.jsx       ← ALL shared UI primitives
        ├── context/
        │   ├── AuthContext.jsx     ← JWT session, localStorage
        │   └── AppContext.jsx      ← global state, API calls
        ├── hooks/useToast.js, useDebounce.js
        ├── pages/
        │   ├── Login.jsx           ← register + sign in
        │   ├── Dashboard.jsx       ← stats, charts, fast movers
        │   ├── Inventory.jsx       ← products, sale/restock modals
        │   ├── Billing.jsx         ← POS cart + checkout
        │   ├── Sales.jsx           ← invoice history + refund
        │   ├── Alerts.jsx          ← auto-generated stock alerts
        │   ├── Movements.jsx       ← stock movement audit log
        │   └── Settings.jsx        ← profile, financials, AI config
        ├── services/
        │   ├── api.js              ← axios + JWT interceptor
        │   ├── authService.js, productService.js
        │   ├── billingService.js, analyticsService.js
        ├── utils/ai.js             ← client-side AI engine
        └── styles/global.css
```

---

## Quick Start (Local)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET

npm install
npm run dev
# → Running on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173 (proxies /api → :5000)
```

---

## Production Deployment

### Backend → Render / Railway

1. Push `backend/` to a GitHub repo
2. Create a new Web Service on Render
3. Set environment variables:
   - `MONGO_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (64-char random string)
   - `CLIENT_URL` (your frontend URL)
   - `NODE_ENV=production`
4. Build command: `npm install`
5. Start command: `node server.js`

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build
# Upload dist/ to Vercel or Netlify
```

Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## Install as App on Phone (PWA)

After deploying the frontend to a public HTTPS URL:

**Android (Chrome):**
1. Visit your site in Chrome
2. Tap the three-dot menu → "Add to Home Screen" or "Install App"
3. App appears on home screen with full-screen mode

**iOS (Safari):**
1. Visit your site in Safari
2. Tap the Share button → "Add to Home Screen"
3. Confirm → app icon appears on home screen

**The PWA works offline** — product data and recent movements are cached by the service worker.

---

## Build APK with Capacitor (Optional)

If you want a real `.apk` for Android, install Android Studio first, then:

```bash
# 1. Install Capacitor in the frontend directory
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Build the web app
npm run build

# 3. Initialize Capacitor
npx cap init "StockSense AI" "ai.stocksense.app" --web-dir dist

# 4. Add Android platform
npx cap add android

# 5. Sync built files
npx cap sync android

# 6. Open in Android Studio
npx cap open android
# Then: Build → Generate Signed Bundle/APK
```

---

## Business Logic Rules

| Rule | Implementation |
|------|---------------|
| Cart does NOT reduce stock | Stock only deducted on `POST /billing/checkout` |
| Refund restores stock | `billingController.refundInvoice` adds qty back + logs movement |
| All alerts auto-generated | `generateAlerts()` in `utils/ai.js` from live product data |
| AI insights are client-side | `computeInsights()` runs instantly without API call |
| JWT auto-refresh | 401 response clears token + redirects to login |
| Per-user data | All DB queries filter by `createdBy: req.user._id` |
| Role protection | Admin-only: create/edit/delete products, access analytics |

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile

GET    /api/products
POST   /api/products          (admin only)
PUT    /api/products/:id      (admin only)
DELETE /api/products/:id      (admin only)
POST   /api/products/:id/sale
POST   /api/products/:id/restock
GET    /api/products/movements/all

POST   /api/billing/checkout
GET    /api/billing/invoices
GET    /api/billing/invoices/:id
POST   /api/billing/invoices/:id/refund

GET    /api/analytics/dashboard
GET    /api/analytics/insights
GET    /api/analytics/alerts
```

---

## Plugging in OpenAI (Future)

The AI engine at `backend/utils/aiEngine.js` is structured for easy OpenAI integration:

```js
// In aiEngine.js, add:
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getAIRecommendation = async (productData) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Given this inventory data: ${JSON.stringify(productData)}, 
                provide 3 specific reorder recommendations in JSON format.`
    }]
  });
  return completion.choices[0].message.content;
};
```

---

*StockSense AI · Built for real small business operators*
