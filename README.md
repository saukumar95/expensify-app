# Expensify — AI-Powered Expense Management App

A full-stack, production-grade expense tracking application with AI-powered categorization, spending insights, budget management, and monthly reports.

---

## Tech Stack

**Frontend**
- React 18 (Create React App)
- React Router v6
- Recharts (charts)
- Lucide React (icons)
- React Hot Toast (notifications)
- Custom CSS with CSS variables (dark/light mode)

**Backend**
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT authentication (access + refresh tokens)
- Joi validation
- Helmet + express-rate-limit

**Testing**
- Jest + Supertest
- mongodb-memory-server (in-process MongoDB for tests)

---

## Features

- **Auth** — register, login, logout with access + refresh token rotation
- **Dashboard** — monthly summary cards, income vs expense bar chart, category pie chart, recent transactions
- **Transactions** — full CRUD, search, filter by type/category/date range, pagination, CSV export
- **Budgets** — set monthly spending limits per category with live progress tracking and over-budget alerts
- **Reports** — annual income/expense bar chart, net balance trend line, monthly breakdown table, CSV export
- **AI Insights** — rule-based auto-categorization, month-over-month spending alerts, savings rate, 50/30/20 budget suggestions
- **Dark / Light mode** — persisted to localStorage
- **Responsive** — mobile sidebar, works on all screen sizes

---

## Project Structure

```
expensify-app/
├── backend/
│   └── src/
│       ├── config/          # env config, MongoDB connection
│       ├── controllers/     # thin request handlers
│       ├── middlewares/     # auth, validation, error handler, rate limiter, logger
│       ├── models/          # Mongoose schemas (User, Transaction, Category, Budget, RefreshToken)
│       ├── routes/          # Express routers
│       ├── services/        # business logic layer
│       ├── tests/           # Jest integration tests
│       ├── utils/           # AppError, asyncHandler, jwt, logger, pagination
│       ├── validations/     # Joi schemas
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout/      # sidebar + topbar
        │   ├── TransactionForm/
        │   └── UI/          # Button, Modal, StatCard, Badge, EmptyState
        ├── context/         # AuthContext, ThemeContext
        ├── pages/           # Dashboard, Transactions, Budgets, Reports, AIInsights, Login
        └── services/        # axios API calls per domain
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI

### 1. Clone the repo

```bash
git clone <repo-url>
cd expensify-app
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and change JWT secrets
npm install
npm run dev        # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api  (already set)
npm install
npm start          # starts on http://localhost:3000
```

### 4. Run tests

```bash
cd backend
npm test
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/expensify` | MongoDB connection string |
| `MONGO_URI_TEST` | `mongodb://localhost:27017/expensify_test` | Test database URI |
| `JWT_SECRET` | — | Access token secret (**change in production**) |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (**change in production**) |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

### Frontend — `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## API Reference

All routes except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <accessToken>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Get current user profile |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | List with filters + pagination |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Monthly income/expense totals |
| GET | `/api/transactions/trend` | Monthly trend (last N months) |
| GET | `/api/transactions/breakdown` | Category breakdown for a month |

### Budgets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/budgets` | List budgets with actual spending |
| POST | `/api/budgets` | Create or update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List all (default + user-created) |
| POST | `/api/categories` | Create custom category |
| DELETE | `/api/categories/:id` | Delete custom category |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/categorize` | Auto-categorize by description |
| GET | `/api/ai/insights` | Spending insights for current month |
| GET | `/api/ai/budget-suggestions` | 50/30/20 rule suggestions |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/monthly` | Annual monthly summary |
| GET | `/api/reports/export` | Export transactions as CSV |

---

## Sample API Requests

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

**Create a transaction**
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"type":"expense","amount":45.50,"category_id":"<id>","description":"Grocery run","date":"2025-05-01"}'
```

**AI categorize**
```bash
curl -X POST http://localhost:5000/api/ai/categorize \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Netflix subscription"}'
# → { "category": "Entertainment", "type": "expense", "confidence": "high" }
```

**Export CSV**
```bash
curl "http://localhost:5000/api/reports/export?start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer <accessToken>" \
  -o transactions.csv
```

---

## Database Models

**User** — name, email (unique, indexed), password (bcrypt, select:false), role

**Transaction** — userId, type, amount, categoryId, description, date, tags[], notes — indexed on `(userId, date)`, `(userId, type)`, `(userId, categoryId)`

**Category** — name, type, color, icon, userId (null for defaults), isDefault — 13 default categories seeded on first start

**Budget** — userId, categoryId, amount, year, month — unique on `(userId, categoryId, year, month)`

**RefreshToken** — userId, token (unique), expiresAt — TTL index auto-deletes expired tokens

---

## License

MIT
