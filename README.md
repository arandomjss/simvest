<div align="center">
  <img src="./frontend/public/vite.svg" alt="SimVest Logo" width="80" />
  <h1>SimVest Paper Trading Platform</h1>
  <p>
    <em>A real-time paper trading platform for Indian markets with virtual portfolio management</em>
  </p>

  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)](https://nodejs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-success?logo=supabase)](https://supabase.com/)
  [![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)](https://vitejs.dev/)
</div>

<hr />

## 🚀 Overview

**SimVest** is a robust, full-stack paper trading ecosystem focused on Indian markets (like the **NIFTY 50**). Built with modern web technologies, it offers a risk-free environment to practice trading strategies, monitor real-time stock charts, track virtual P&L, and manage a simulated portfolio.

Whether you're testing an automated trading bot or learning the ropes of the stock market, SimVest offers the perfect blend of real-world data and virtual capital.

---

## ✨ Features

- 💹 **Real-Time Market Data**: Live stock price updates, historical charting, and order book simulations powered by WebSockets.
- 📈 **Yahoo Finance & Upstox Integrations**: Flexible market data providers including Yahoo Finance API for quotes, news, algorithms, and Upstox for OAuth & trade execution.
- 💵 **Paper Trading Engine**: Execute virtual buy/sell market and limit orders without risking real money.
- 📊 **Advanced Charting**: Interactive lightweight charts for technical analysis.
- 🏛️ **Portfolio Management**: Auto-calculated holdings, live P&L tracking, and comprehensive portfolio performance metrics.
- 📜 **Order History & Export**: View your complete lifecycle of placed, executed, and rejected orders, and export them natively to XML.
- 🧩 **XML-Driven Components**: Dynamic app footer driven by external XML data parsing.
- 🛠 **Mock Data Mode**: Smooth local development experience using robust mock data without needing any exchange api credentials.

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) & [Recharts](https://recharts.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-time Engine**: [Socket.io](https://socket.io/)
- **Market Data Services**: [Yahoo Finance API](https://www.npmjs.com/package/yahoo-finance2)

### Database & Auth
- **Provider**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)

---

## 📋 Prerequisites

To run this project locally, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase** account (The free tier is perfectly adequate)
- *(Optional)* Upstox API credentials if you want to swap out the mock/Yahoo data with a live broker.

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "simvest v1"
```

### 2. Database Setup

You will need a Supabase project established.

1. Navigate to your Supabase SQL Editor.
2. Copy and execute the contents of `database/schema.sql` to generate your tables, functions, and row-level security policies.

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Market Data
USE_MOCK_DATA=true

# Supabase Auth & Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional: Upstox API integration
UPSTOX_API_KEY=your_api_key_here
UPSTOX_API_SECRET=your_api_secret_here
UPSTOX_REDIRECT_URI=http://localhost:3000/auth/callback

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 4. Frontend Setup

```bash
# Return to the root folder, then go to the frontend directory
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory (these MUST be prefixed with `VITE_`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## 🚀 Running the Application

Once your dependencies are installed and `.env` files are configured, open two terminal tabs.

**Tab 1: Backend Server**
```bash
cd backend
npm run dev
```
> The backend will start on `http://localhost:3000`. WebSocket connections will also be established on this port.

**Tab 2: Frontend App**
```bash
cd frontend
npm run dev
```
> The frontend will start on `http://localhost:5173`. Open this URL in your browser to start trading!

---

## 📝 API Endpoints Overview

The backend exposes several routes for retrieving market data and managing trades.

### Market & Yahoo Finance (`/api/yahoo/...`)
- `GET /api/yahoo/quote/:symbol` - Single stock quote
- `POST /api/yahoo/quotes` - Batch multiple stock quotes
- `GET /api/yahoo/historical/:symbol` - Historical candlestick data
- `GET /api/yahoo/search` - Search ticker symbols
- `GET /api/yahoo/profile/:symbol` - Company profile, sector, summary
- `GET /api/yahoo/news/:symbol` - Company related news

### Trading & Upstox (`/api/trade/...` & `/auth/...`)
- `GET /auth/upstox` - Upstox OAuth Login
- `POST /api/trade/execute` - Execute a market/limit trade
- `GET /api/trade/portfolio` - Secure portfolio fetch
- `GET /api/trade/orders/history` - User specific order history
- `GET /api/trade/orders/history/xml` - Export user order history in XML format
- `GET /api/market/instruments` - Get standard NIFTY 50 / pre-loaded instrument lists

*(See the `backend/src/routes/` directory for full implementation details)*

---

## 📁 Project Structure

```text
simvest v1/
├── backend/                  # Express API Backend
│   ├── src/
│   │   ├── config/           # App and integration configurations
│   │   ├── routes/           # REST Route modules (Auth, Trade, Yahoo)
│   │   ├── services/         # Business logic & 3rd-party services
│   │   └── server.js         # Entrypoint & Express configurations
│   └── package.json
│
├── frontend/                 # Vite + React Frontend
│   ├── src/
│   │   ├── components/       # Reusable interactive UI components
│   │   ├── pages/            # Page-level components & Routings
│   │   ├── services/         # API clients (Axios, Supabase, WebSockets)
│   │   ├── stores/           # Zustand state management
│   │   ├── utils/            # Shared helper functions
│   │   └── App.tsx           # Global React Contexts & Layouts
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
└── database/                 # Remote Services Scripts
    └── schema.sql            # Supabase init schema definition
```

---

## 🤝 Contributing

Contributions are always welcome! Whether it is a feature request, bug fix, or refactoring – simply fork the repository and submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Acknowledgements

- This project is licensed under the MIT License.
- **Data Integrations**: Uses Yahoo Finance API / NIFTY 50 Lists. Upstox API implementation exists for verified live environments.
- **Database & Auth**: Handled entirely through the excellent Supabase platform.
