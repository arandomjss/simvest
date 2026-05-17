# SimVest Comprehensive Test Plan

## 1. Introduction
This document outlines the comprehensive test plan for the SimVest platform, covering functional, non-functional, integration, and regression testing scenarios.

## 2. Test Environment
- **Backend:** Node.js (v18+), Express, Supabase Staging Database.
- **Frontend:** React, Vite, TailwindCSS.
- **Data:** Mock Yahoo Finance data, Mock Upstox WebSockets, seeded test users.
- **Browsers:** Chrome, Firefox, Safari, Edge.
- **Devices:** Desktop (1080p), Tablet (iPad size), Mobile (iPhone 13 size).

---

## 3. Test Cases

### 3.1 Authentication & Authorization
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_AUTH_001 | Verify successful user registration | App running, DB accessible | 1. Navigate to `/register` 2. Enter valid email and password 3. Submit | `test@example.com`, `StrongPass1!` | User account is created. Redirect to login with verification prompt. | Functional - Positive | High |
| TC_AUTH_002 | Verify registration with existing email | User already exists | 1. Navigate to `/register` 2. Enter existing email 3. Submit | Existing email | Generic error message displayed. No account created. | Functional - Negative | High |
| TC_AUTH_003 | Verify password validation rules | App running | 1. Navigate to `/register` 2. Enter short/weak password 3. Submit | `weak` | Validation error shown. Strength meter reflects weak password. | Functional - Negative | Medium |
| TC_AUTH_004 | Verify successful login | User is verified | 1. Navigate to `/login` 2. Enter valid credentials 3. Submit | Valid credentials | User logged in, redirected to dashboard, session token saved. | Functional - Positive | High |
| TC_AUTH_005 | Verify login with incorrect password | User exists | 1. Navigate to `/login` 2. Enter incorrect password 3. Submit | Valid email, wrong password | Generic 'Invalid email or password' error. Login fails. | Functional - Negative | High |
| TC_AUTH_006 | Verify protected route redirection | User not logged in | 1. Navigate to `/dashboard` directly | None | Redirected to `/login` page. | Security | High |
| TC_AUTH_007 | Verify logout functionality | User is logged in | 1. Click 'Sign Out' | None | Session destroyed. Redirected to landing page. Protected routes become inaccessible. | Security | High |

### 3.2 Market Data & WebSockets
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_MKT_001 | Verify NIFTY 50 instruments load | Backend online | 1. Open Dashboard | None | 50 instruments load with valid keys, symbols, sectors, and prices. | Integration | High |
| TC_MKT_002 | Verify WebSocket live price updates | WS connected | 1. Subscribe to an instrument 2. Wait for mock tick | `RELIANCE` | Real-time price updates on UI without full page refresh. | Integration | High |
| TC_MKT_003 | Verify fallback when WS fails | Network disconnected | 1. Disconnect network 2. Observe UI | None | Reconnection attempts occur. UI shows offline status or falls back gracefully. | Reliability | Medium |
| TC_MKT_004 | Verify historical chart data loads | Chart modal open | 1. Select a timeframe (e.g., 1M) | `TCS` | Historical OHLCV candles load and chart renders correctly. | Functional - Positive | High |
| TC_MKT_005 | Verify market news feed | Dashboard open | 1. Check news widget | None | Latest business news items display with title, source, and time. | Functional - Positive | Low |

### 3.3 Trading Engine (Execution & Lifecycle)
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_TRD_001 | Verify BUY MARKET order execution | Market open, sufficient balance | 1. Open Terminal 2. Select Stock 3. Enter Qty 4. Select Market 5. Submit | `RELIANCE`, Qty: 10 | Order status EXECUTED. Cash deducted. Holding created/updated. | Functional - Positive | High |
| TC_TRD_002 | Verify BUY LIMIT order (Pending) | Market open | 1. Set Limit Price below current 2. Submit | Limit: Current - 5% | Order status PENDING. Cash reserved. Holding not updated yet. | Functional - Positive | High |
| TC_TRD_003 | Verify SELL MARKET order execution | Owns holdings | 1. Select owned stock 2. Enter Qty <= owned 3. Submit | Qty: 5 | Order EXECUTED. Holdings reduced. Cash balance increased by execution price. | Functional - Positive | High |
| TC_TRD_004 | Verify insufficient balance rejection | Low balance | 1. Submit BUY order exceeding balance | Huge Qty | Order rejected. Validation error shown. No cash deducted. | Functional - Negative | High |
| TC_TRD_005 | Verify insufficient holdings rejection | Owns 5 shares | 1. Submit SELL for 10 shares | Qty: 10 | Order rejected. Error shown. Holdings unchanged. | Functional - Negative | High |
| TC_TRD_006 | Verify market closed rejection | Out of hours | 1. Submit any trade | Any | Trade rejected with "Market Closed" message. | Functional - Negative | High |
| TC_TRD_007 | Verify pending order cancellation | Pending order exists | 1. Go to Orders 2. Cancel pending order | Pending Order ID | Order status CANCELLED. Reserved cash or holdings fully refunded. | Functional - Positive | High |
| TC_TRD_008 | Verify concurrent trade execution race condition | Sufficient balance for 1 trade | 1. Send 2 identical BUY requests simultaneously | Same payload | Only 1 trade succeeds. Balance does not go negative. | Security / Concurrency | High |
| TC_TRD_009 | Verify pending limit order auto-match | Pending Limit Buy exists | 1. Wait for WS price tick <= limit price | WS tick | Background process marks order EXECUTED. Grants holdings. | Integration | High |

### 3.4 Portfolio & Holdings
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_PRT_001 | Verify portfolio P&L calculation | Owns holdings | 1. Open Portfolio 2. Verify math | Mock holding | Total Value, Investment, P&L, and P&L% match mathematical expectations. | Functional - Positive | High |
| TC_PRT_002 | Verify sector allocation chart | Diverse holdings | 1. View Portfolio charts | Mixed sectors | Sector distribution chart accurately reflects invested value per sector. | Functional - Positive | Medium |
| TC_PRT_003 | Verify "Close Position" action | Owns holding | 1. Click "Close Position" 2. Choose 100% 3. Confirm | Owned stock | Pre-fills SELL MARKET order. Execution successfully liquidates holding. | Functional - Positive | High |
| TC_PRT_004 | Verify empty portfolio state | New user | 1. Open Portfolio | None | Empty state illustration and "Start Trading" CTA displayed. | Usability | Medium |

### 3.5 Orders & Trade Journal
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_ORD_001 | Verify order history pagination | User has >50 orders | 1. Scroll/paginate orders table | None | Next set of orders load correctly. Limit and offset work. | Functional - Positive | Medium |
| TC_ORD_002 | Verify XML export functionality | Orders exist | 1. Click "Export XML" | None | `.xml` file downloads. Valid XML format. Contains trade history. | Integration | Medium |
| TC_ORD_003 | Verify XML escaping for malicious notes | Order with `< > &` | 1. Create order with malicious notes 2. Export XML | Notes: `<script>` | Notes are properly escaped (`&lt;script&gt;`). XML remains valid. | Security | High |
| TC_JRN_001 | Verify journal statistics | Trades with strategies | 1. Open Journal | None | Total trades, strategy coverage %, and notes count are accurate. | Functional - Positive | Medium |
| TC_JRN_002 | Verify journal search and filtering | Mixed journal entries | 1. Search symbol 2. Filter by strategy | `TCS`, `Breakout` | List filters instantly to match criteria. | Functional - Positive | Medium |

### 3.6 AI Advisor & Signals
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_ADV_001 | Verify AI stock analysis generation | Logged in | 1. Open Advisor 2. Search stock | `RELIANCE` | Loads profile, calculates indicators, generates AI verdict and thesis. | Integration | High |
| TC_ADV_002 | Verify fallback on insufficient history | Mock limited history | 1. Analyze new/limited stock | Stock with <50 days | AI returns "Awaiting Data" limited analysis without crashing. | Reliability | Medium |
| TC_ADV_003 | Verify market signals list | Backend online | 1. Open Dashboard signals | None | Displays RSI, MACD, EMA crossover signals sorted by strength. | Functional - Positive | Medium |

### 3.7 Non-Functional Testing (Security, Performance, UI)
| Test Case ID | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Type | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC_SEC_001 | Verify Row Level Security (RLS) | User A and B exist | 1. Use User A token to fetch User B's portfolio via API | User A token, User B ID | Request rejected (Empty or 403/404). Cross-user access prevented. | Security | High |
| TC_SEC_002 | Verify API Rate Limiting | App running | 1. Send 150 API requests in 1 min | Script | API returns 429 Too Many Requests. Frontend handles gracefully. | Security / Performance | High |
| TC_PRF_001 | Verify initial load time | Empty cache | 1. Load dashboard | None | Core UI renders within 2 seconds. LCP < 2.5s. | Performance | Medium |
| TC_CMP_001 | Verify mobile responsiveness | Mobile viewport | 1. Open Terminal, Portfolio, Journal | Viewport 390x844 | Layout adapts. Tables scroll horizontally. Modals fit screen. | Compatibility | High |
| TC_ACC_001 | Verify keyboard navigation | App loaded | 1. Use `Tab`, `Enter`, `Esc` | None | Focus visible. Modals can be closed via `Esc`. Forms submittable via keyboard. | Accessibility | Medium |

---

## 4. Test Execution & Reporting
- **Test Runs:** Tests should be executed locally first, then on a staging environment identical to production.
- **Defect Tracking:** Any `Actual Result` deviating from the `Expected Result` must be logged as an issue with steps to reproduce, environment details, and severity (Blocker, Critical, Major, Minor).
- **Automation:** Regression candidates (TC_TRD_*, TC_SEC_*, TC_PRT_*) should be automated using Jest (Backend) and Playwright (Frontend/E2E).
