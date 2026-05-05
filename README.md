# Shortie — Link Monetization Platform

A production-ready link shortener with multi-step monetization flow, user authentication, and analytics dashboard.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **MongoDB** running locally or a MongoDB Atlas connection string

---

### 1. Install Dependencies

```bash
cd shortie
npm install
```

---

### 2. Configure Environment

Edit the `.env` file (already created):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shortie
SESSION_SECRET=your_super_secret_key_here
NODE_ENV=development
```

> **MongoDB Atlas** users: replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://user:pass@cluster.mongodb.net/shortie`

---

### 3. Start MongoDB (local)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

---

### 4. Run the App

```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

App runs at: **http://localhost:3000**

---

## 📁 Project Structure

```
shortie/
├── app.js                  # Main entry point
├── .env                    # Environment config
├── package.json
├── models/
│   ├── User.js             # User schema (email + hashed password)
│   └── Link.js             # Link schema (slug, clicks, user_id)
├── routes/
│   ├── auth.js             # /login /signup /logout
│   └── link.js             # / /api/create /l/:slug /dashboard
└── views/
    ├── partials/
    │   ├── head.ejs         # HTML head + CSS
    │   ├── navbar.ejs       # Navigation bar
    │   └── footer.ejs       # Footer + scripts
    ├── index.ejs            # Landing + link shortener
    ├── login.ejs            # Login form
    ├── signup.ejs           # Signup form
    ├── dashboard.ejs        # User dashboard (protected)
    ├── 404.ejs              # Error page
    └── steps/
        ├── step1.ejs        # 5-second timer step
        ├── step2.ejs        # Info/verify step
        └── step3.ejs        # Human checkbox + final redirect
```

---

## 🔐 Auth System

| Route | Method | Description |
|-------|--------|-------------|
| `/login` | GET/POST | Email + password login |
| `/signup` | GET/POST | Register new account |
| `/logout` | GET | Destroy session |

- Passwords hashed with **bcrypt** (salt rounds: 10)
- Sessions stored in **MongoDB** via `connect-mongo`
- Protected routes check `req.session.userId`

---

## 🔗 Link System

| Route | Method | Description |
|-------|--------|-------------|
| `/api/create` | POST | Creates short link (JSON API) |
| `/l/:slug` | GET | Step 1 — begins redirect flow |
| `/l/:slug/step1` | POST | Completes step 1 |
| `/l/:slug/step2` | GET/POST | Step 2 |
| `/l/:slug/step3` | GET/POST | Step 3 + final redirect |
| `/dashboard` | GET | User link analytics |

**Anti-skip protection**: Each step validates session flags before proceeding. Jumping directly to step 2 or 3 redirects back to step 1.

---

## 🎨 Design

- **Dark theme** — slate-900/950 base
- **Glassmorphism** cards with blur + border
- **Gradient buttons** — blue → purple
- **Fonts**: Syne (display) + DM Sans (body)
- **Fully responsive** — mobile first

---

## ⚙️ Tech Stack

| Layer | Tech |
|-------|------|
| Server | Node.js + Express |
| Templates | EJS |
| Styling | Tailwind CSS (CDN) |
| Database | MongoDB + Mongoose |
| Sessions | express-session + connect-mongo |
| Auth | bcrypt |
| IDs | nanoid (7-char slugs) |

---

## 🐛 Troubleshooting

**MongoDB connection refused**
- Ensure MongoDB service is running: `mongod --dbpath /data/db`

**Port already in use**
- Change `PORT=3001` in `.env`

**Session not persisting**
- Make sure `SESSION_SECRET` is a long random string
- Check MongoDB is running (sessions stored there)
