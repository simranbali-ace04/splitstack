<div align="center">

# SplitStack

**Shared expenses, settled simply.**

Track what everyone in a group spends, see who owes what, and settle up with the fewest payments possible.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20HTTP--only%20cookies-blue)
![Status](https://img.shields.io/badge/status-in%20development-orange)

</div>

---

## Overview

Group trips, shared flats and club events all have the same problem: everyone pays for something, and nobody can say who owes whom. A plain ledger ends up with a tangle of debts where A owes B, B owes C, and C owes A.

SplitStack gives every group one shared record of expenses with clear access control, and is built around a **debt-simplification engine** that collapses those debts into the minimum number of payments needed to square everyone up.

**How it works**

1. **Create a group** and add the people sharing costs.
2. **Log expenses** as they happen: who paid, how much, and who it's split between.
3. **See balances** for every member of the group.
4. **Settle up** with the smallest set of payments, then record them.

---

## Features

### Available now
- **Accounts and sessions:** register, log in and log out. Passwords are hashed, and sessions use a signed token held in an HTTP-only cookie.
- **Groups:** create groups, view the groups you belong to, and see members and their roles.
- **Roles and permissions:** every member is an `admin` or a `member`. Admins manage membership, and members can't reach admin actions.
- **Expense tracking:** add, view, edit and delete expenses inside a group. Edits and deletes are limited to the person who created the expense or a group admin.
- **Private by design:** a group's data is only visible to its members, and one group can never read or change another's expenses.
- **Request logging and consistent errors** across the API.

### Coming next
- **Balances:** each member's contributions, share and net position
- **Smart settlement:** minimum-payment debt simplification
- **Settlement tracking:** record payments and keep a history
- **Group management:** remove members, rename and delete groups
- **Web app:** React and Tailwind CSS interface
- **Receipts:** attach a photo to any expense

**Settlement example (in development)**

Four friends on a trip: Ace pays ₹8,000 for the hotel, Riya ₹3,000 for food, Kunal ₹2,000 for cabs, and Dev ₹1,600 for activities. Total ₹14,600, so ₹3,650 each. Instead of a web of pairwise debts, SplitStack will produce just two payments: Dev pays Ace ₹2,050 and Kunal pays Ace ₹1,650.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / framework | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens, bcrypt, cookie-parser |
| Configuration | dotenv |
| API testing | Postman |
| Web app (planned) | React, Tailwind CSS |

---

## Architecture

The API is layered so that each part has a single responsibility.

```
Client
  ↓  HTTP + JSON (session cookie sent automatically)
Express
  ↓
verifyToken            authenticate: who is this user?
  ↓
verifyGroupMember      is this user in the group? loads the group and their role
  ↓
requireGroupAdmin      admin-only routes
  ↓
Routes → Controllers   request and response logic
  ↓
Mongoose → MongoDB
```

```
backend/
├── config/            database connection
├── models/            User, Group, Expense schemas
├── middlewares/       authentication, group membership and role checks, request logger
├── controllers/       request handlers
├── routes/            URL to controller mapping
├── postman/           API collection
└── server.js          application entry point
```

**Data model**

```
User ──< Group.members [{ user, role: admin | member }]
Group ──< Expense (groupId, paidBy, createdBy, splitAmong)
```

---

## Security

- **Password storage:** passwords are salted and hashed with bcrypt and never stored in plain text.
- **Session handling:** tokens are kept in an `httpOnly` cookie with `sameSite` set, so page scripts can't read them. The `secure` flag is turned on in production.
- **No account enumeration:** an unknown email and a wrong password return the same response.
- **Clear status semantics:** `401` means not signed in and `403` means signed in but not permitted.
- **Tenant isolation:** every group route passes through membership middleware, and expense lookups filter by both expense and group, which blocks cross-group access by id guessing.
- **Secrets management:** the database URI and signing secret come from environment variables and are never committed.

---

## API Reference

All routes except `/api/auth/*` require a valid session cookie.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and set the session cookie |
| POST | `/api/auth/logout` | Sign out and clear the cookie |

### Groups
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/groups` | Signed in | Create a group (creator becomes admin) |
| GET | `/api/groups` | Signed in | List your groups |
| GET | `/api/groups/:groupId` | Member | Group details and members |
| PATCH | `/api/groups/:groupId/members` | Admin | Add members |

### Expenses
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/groups/:groupId/expenses` | Member | Create an expense |
| GET | `/api/groups/:groupId/expenses` | Member | List the group's expenses |
| GET | `/api/groups/:groupId/expenses/:expenseId` | Member | Get one expense |
| PATCH | `/api/groups/:groupId/expenses/:expenseId` | Creator / admin | Update fields |
| PUT | `/api/groups/:groupId/expenses/:expenseId` | Creator / admin | Replace an expense |
| DELETE | `/api/groups/:groupId/expenses/:expenseId` | Creator / admin | Delete an expense |

**Example**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "ace@example.com", "password": "yourpassword" }
```

```http
HTTP/1.1 200 OK
Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600

{ "message": "Login successful" }
```

---

## Run Locally

**Prerequisites:** Node.js 18+ and MongoDB (local, or an Atlas connection string).

```bash
git clone https://github.com/simranbali-ace04/splitstack.git
cd splitstack/backend
npm install
```

Create `backend/.env`:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/splitstack
JWT_SECRET=replace_with_a_long_random_string
NODE_ENV=development
```

Start the API:

```bash
node server.js
```

The API runs at `http://localhost:8000`. Import the collection from [`backend/postman`](backend/postman) to try every endpoint. Register and sign in first, and Postman will send the session cookie automatically.

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on (default `8000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign sessions. Keep it private |
| `NODE_ENV` | Set to `production` to enable secure cookies |

---

## Roadmap

- [x] Accounts, sessions and secure cookie-based authentication
- [x] Groups with admin and member roles
- [x] Group-scoped expense management with cross-group isolation
- [ ] Complete group management (remove members, rename, delete)
- [ ] Balance calculation
- [ ] Minimum-payment settlement engine
- [ ] Settlement recording and history
- [ ] Automated test suite
- [ ] React web app
- [ ] Receipt uploads
- [ ] Hosted deployment and public API documentation

---

## Author

Built by **Simran Bali** · [GitHub](https://github.com/simranbali-ace04)
