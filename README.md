# SimVest - Paper Trading Platform

A real-time paper trading platform for NIFTY 50 stocks with virtual portfolio management, built with Node.js, React, and Supabase.

## 🚀 Features

- **Real-time Market Data**: Live price updates for NIFTY 50 stocks via WebSocket
- **Paper Trading**: Execute virtual buy/sell orders without real money
- **Portfolio Management**: Track holdings, P&L, and portfolio performance
- **Order History**: View complete trading history
- **Mock Data Mode**: Develop and test without Upstox API credentials

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Upstox API credentials (optional, can use mock data)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "simvest v1"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
# Environment
NODE_ENV=development
PORT=3000

# Mock Data (set to true for development without Upstox)
USE_MOCK_DATA=true

# Upstox API (optional if using mock data)
UPSTOX_API_KEY=your_api_key_here
UPSTOX_API_SECRET=your_api_secret_here
UPSTOX_REDIRECT_URI=http://localhost:3000/auth/callback

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 4. Database Setup

Run the SQL schema in your Supabase project:
```bash
# Execute the SQL in database/schema.sql in your Supabase SQL editor
```

## 🚀 Running the Application

### Start Backend (with Mock Data)

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3000` with mock market data.

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`.

## 📁 Project Structure

```
simvest v1/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── server.js    # Entry point
│   └── package.json
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── services/   # API clients
│   │   └── stores/     # State management
│   └── package.json
│
└── database/           # Database schema
    └── schema.sql
```

## 🔧 Configuration

### Mock Data Mode (Development)

Set `USE_MOCK_DATA=true` in backend `.env` to use simulated market data without Upstox credentials.

### Production Mode (Real Data)

1. Get Upstox API credentials from [Upstox Developer Console](https://account.upstox.com/developer/apps)
2. Set `USE_MOCK_DATA=false` in backend `.env`
3. Add your Upstox credentials to `.env`
4. Visit `http://localhost:3000/auth/upstox` to authenticate

## 🛡️ Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for all available configuration options.

## 📝 API Endpoints

- `GET /health` - Health check
- `GET /auth/upstox` - Upstox OAuth
- `POST /api/trade/execute` - Execute trade
- `GET /api/trade/portfolio` - Get portfolio
- `GET /api/trade/orders/history` - Order history
- `GET /api/market/instruments` - NIFTY 50 stocks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Upstox for market data API
- Supabase for backend services
- NIFTY 50 for stock data
