# StyleHub

StyleHub is a premium, fully-responsive, Myntra-inspired fashion e-commerce web application. Built as a monorepo, it features a React.js (Vite) frontend with Tailwind CSS and a Node.js/Express backend powered by a SQLite database.

## 🚀 Features

- **Authentication System:** Secure registration and login using JWT and bcrypt.
- **Dynamic Product Catalog:** Real-time search autocomplete, category filtering, trending products, and new arrivals.
- **Shopping Bag & Wishlist:** Fully integrated cart and wishlist with stock validation, coupon application, and immediate cross-synchronization.
- **Multi-Step Checkout:** Seamless address selection and simulated payment processing (Card, UPI, COD).
- **User Profiles & Orders:** Complete order history with visual status, and manageable user profiles.
- **Responsive Design:** A premium UI built with Tailwind CSS that works beautifully on mobile, tablet, and desktop.
- **Interactive UI:** Micro-animations, toast notifications, loading states, and skeleton loaders.

## 🛠 Tech Stack

**Frontend:**
- React 18 (Vite)
- React Router DOM
- Tailwind CSS
- Context API (State Management)
- Axios (HTTP Client)
- Lucide React (Icons)
- React Hot Toast (Notifications)

**Backend:**
- Node.js & Express.js
- Better-SQLite3 (Database)
- JSON Web Token (JWT)
- Bcrypt.js (Password Hashing)
- Helmet & Morgan & Express-Rate-Limit (Security & Logging)

## 📁 Folder Structure

```text
stylehub/
├── client/                     # React Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, ProtectedRoute, etc.)
│   │   ├── context/            # Context API files (Auth, Cart, Wishlist)
│   │   ├── pages/              # Route pages (Home, Login, Register, Cart, etc.)
│   │   ├── utils/              # Helper utilities (Axios api instance)
│   │   ├── App.jsx             # Main Router and Providers
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js      # Tailwind v4 configuration
│   └── vite.config.js          # Vite config (includes proxy to backend)
├── server/                     # Node.js Backend
│   ├── controllers/            # Route handler logic (auth, products, cart, etc.)
│   ├── middleware/             # Express middlewares (auth protection)
│   ├── routes/                 # API route definitions
│   ├── utils/                  # Helper utilities (Standardized JSON responses)
│   ├── db.js                   # Database connection setup
│   ├── schema.sql              # SQLite schema definitions
│   ├── seed.js                 # Database seeder (65+ products, coupons, user)
│   ├── server.js               # Main Express application
│   ├── package.json
│   └── .env.example
├── README.md                   # Project documentation
├── start.bat                   # Windows startup script
└── start.sh                    # Mac/Linux startup script
```

## 📋 Prerequisites

- **Node.js** (v18.x or v20.x recommended)
- **npm** (comes with Node.js)

## ⚙️ Setup and Run Instructions

### Option 1: Automated (Recommended)
You can launch the entire application with a single click or command. The startup script checks for dependencies, installs them if missing, seeds the database automatically, boots both servers, and opens your browser.

**For Windows:**
Double-click the `start.bat` file in the root directory, or run in terminal:
```bash
./start.bat
```

**For Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Configure Environment Variables**
   Inside the `server` directory, rename `.env.example` to `.env`. (By default, `PORT=5000` and `JWT_SECRET` are set).

3. **Seed Database**
   Generate the SQLite database and populate it with initial data.
   ```bash
   cd server
   npm run seed
   ```

4. **Start the Servers**
   Open two separate terminal windows:
   - **Terminal 1 (Backend):** `cd server && npm run dev`
   - **Terminal 2 (Frontend):** `cd client && npm run dev`

5. **View Application**
   Open your browser to [http://localhost:5173](http://localhost:5173).

## 🔑 Demo Credentials

- **Email:** `demo@stylehub.com`
- **Password:** `Demo@123`

## 🔌 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/api/auth/login` | Authenticate user & receive JWT | ❌ |
| **POST** | `/api/auth/register` | Create a new user account | ❌ |
| **GET** | `/api/auth/me` | Get logged-in user profile | ✅ |
| **GET** | `/api/products` | Get products (search, filter, pagination) | ❌ |
| **GET** | `/api/products/:id` | Get product details & reviews | ❌ |
| **GET** | `/api/products/suggestions`| Live search autocomplete | ❌ |
| **GET** | `/api/cart` | Get current user's cart | ✅ |
| **POST** | `/api/cart` | Add item to cart | ✅ |
| **GET** | `/api/wishlist` | Get user's wishlist | ✅ |
| **POST** | `/api/coupons/apply` | Apply coupon code (e.g. `WELCOME10`) | ✅ |
| **POST** | `/api/orders` | Checkout cart to create an order | ✅ |
| **GET** | `/api/orders` | Get user's order history | ✅ |

## 🗄️ Database Schema Overview

StyleHub uses an embedded SQLite database (`better-sqlite3`).
- **users:** id, name, email, password_hash, phone, gender
- **products:** id, name, brand, category, price, discount_percent, rating, stock, images
- **cart_items / wishlist_items:** maps user to products
- **addresses:** shipping locations for users
- **orders / order_items:** snapshot of purchased products and financial summaries
- **coupons / reviews:** promotional codes and user ratings

## 🔮 Future Improvements

- Fully functional Product Listing page with deep filtering logic mapped to the UI.
- Comprehensive Admin Dashboard for inventory management.
- Implementation of a real payment gateway (Stripe/Razorpay).
- Email notifications for order confirmations.
