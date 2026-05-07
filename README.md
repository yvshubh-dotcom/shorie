# Shortie — Link Monetization Platform

A full-featured SaaS link monetization platform. Shorten URLs, earn money on every click, manage withdrawals.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Views:** EJS templates
- **Styling:** Tailwind CSS (CDN)
- **Auth:** express-session + bcrypt + connect-mongo
- **Security:** helmet, express-rate-limit

## Features

- ✅ User signup/login/logout with bcrypt hashed passwords
- ✅ Session-based auth with MongoDB session store
- ✅ URL shortener with custom short code support
- ✅ Click counting (all clicks, no device restriction)
- ✅ 5-second timer redirect flow with ad placeholder
- ✅ CPM-based earnings system
- ✅ Dashboard with analytics cards
- ✅ Withdrawal system (UPI, PayPal, Binance)
- ✅ Admin panel (users, links, traffic, approvals, CPM)
- ✅ Mobile responsive with hamburger sidebar
- ✅ Dark premium glassmorphism UI
- ✅ Rate limiting + bot detection
- ✅ Helmet security headers

---

## Quick Start

### 1. Clone / Extract

```bash
cd shortie
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/shortie
SESSION_SECRET=your-super-secret-key-here
PORT=3000
```

### 4. Run

```bash
npm start
```

Visit: `http://localhost:3000`

---

## Admin Setup

To make a user an admin, run this in MongoDB shell or Compass:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isAdmin: true } }
)
```

Or use this one-time script:

```bash
node scripts/make-admin.js your@email.com
```

---

## Deployment on Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `SESSION_SECRET` → a long random string
   - `NODE_ENV` → `production`

### MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist IP `0.0.0.0/0` (allow all) for Render
4. Copy the connection string to `MONGO_URI`

---

## Folder Structure

```
shortie/
├── app.js                  # Entry point
├── package.json
├── .env.example
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   ├── auth.js             # requireAuth, requireAdmin, redirectIfAuth
│   └── rateLimiter.js      # Rate limiting configs
├── models/
│   ├── User.js
│   ├── Link.js
│   ├── Withdrawal.js
│   └── Settings.js
├── routes/
│   ├── index.js            # Landing page
│   ├── auth.js             # Login, signup, logout
│   ├── dashboard.js        # Dashboard + settings
│   ├── links.js            # CRUD for links
│   ├── earnings.js         # Earnings + withdrawals
│   ├── redirect.js         # Short link redirect flow
│   └── admin.js            # Admin panel
├── views/
│   ├── index.ejs           # Landing page
│   ├── 404.ejs
│   ├── error.ejs
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── sidebar.ejs
│   │   └── navbar.ejs
│   ├── auth/
│   │   ├── login.ejs
│   │   └── signup.ejs
│   ├── dashboard/
│   │   ├── index.ejs
│   │   ├── create-link.ejs
│   │   ├── links.ejs
│   │   ├── analytics.ejs
│   │   ├── earnings.ejs
│   │   ├── withdraw.ejs
│   │   └── settings.ejs
│   ├── redirect/
│   │   ├── step1.ejs       # 5-second timer page
│   │   └── step2.ejs       # Continue + auto-redirect
│   └── admin/
│       ├── index.ejs
│       ├── users.ejs
│       ├── links.ejs
│       ├── withdrawals.ejs
│       ├── layout-top.ejs
│       └── layout-bottom.ejs
└── scripts/
    └── make-admin.js
```

---

## Redirect Flow

```
User visits /r/:code
      ↓
  Step 1 (5-sec timer + ad placeholder)
      ↓
  POST /r/:code/continue  ← click counted + earnings added here
      ↓
  Step 2 (continue button + ad + 3-sec auto-redirect)
      ↓
  GET /r/:code/go  ← final redirect to originalUrl
```

## CPM Earnings

- Default CPM: **$2.00 per 1,000 clicks**
- Admin can change global CPM rate
- Admin can set per-user custom CPM
- Earnings credited immediately on click
- Minimum withdrawal: $5.00 (configurable)

---

## License

MIT
