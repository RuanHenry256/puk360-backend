# 🎓 PUK360 Backend

This is the backend service for **PUK360**, built with **Node.js + Express + Sequelize** and deployed on **Azure**.  
It provides REST API endpoints for authentication, event management, registrations, reviews, and admin features.  

---

## 🚀 Tech Stack
- **Runtime**: Node.js (v22+)
- **Framework**: Express.js
- **Database**: Azure SQL / PostgreSQL (via Sequelize ORM)
- **Auth**: JWT (JSON Web Tokens)
- **Validation**: express-validator / Joi
- **Docs**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier
- **Dev Tools**: Nodemon, Morgan

---

## 📂 Project Structure
```
puk360-backend/
│── src/
│   ├── config/          # DB config, env vars
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation
│   ├── models/          # Sequelize models
│   ├── routes/          # API route definitions
│   ├── utils/           # Helpers
│   ├── server.js        # Entry point
│
│── tests/               # Unit & integration tests
│── .env.example         # Example environment vars
│── package.json
│── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone Repo
```bash
git clone https://github.com/your-org/puk360-backend.git
cd puk360-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` → `.env` and update values:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_pass
DB_NAME=puk360
JWT_SECRET=supersecretkey
```

### 4. Run Migrations & Seed Data
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Start Server
```bash
npm run dev    # with nodemon
npm start      # production
```

Server runs at:  
👉 `http://localhost:5000/api`

---

## 📌 API Endpoints

| Method | Endpoint                | Description                  |
|--------|-------------------------|------------------------------|
| POST   | `/api/auth/register`    | Register user                |
| POST   | `/api/auth/login`       | Login user (JWT)             |
| GET    | `/api/events`           | List all events              |
| POST   | `/api/events`           | Create new event (host)      |
| POST   | `/api/events/:id/join`  | Join event (student)         |
| POST   | `/api/reviews`          | Add review                   |
| GET    | `/api/admin/dashboard`  | Admin analytics              |

📖 Full docs available at: `http://localhost:5000/api/docs`

---

## 👩‍💻 Contribution Guidelines
- Follow **branch naming**: `feature/login-api`, `fix/db-connection`, etc.  
- Use **ESLint + Prettier** before committing:
  ```bash
  npm run lint
  ```
- Write **unit tests** for every new feature:
  ```bash
  npm test
  ```
- Submit PRs → reviewed by Dev 1 before merge.  

---

## ✅ Developer Roles

- **Dev 1 (Lead Architect)** → Project setup, DB schema, coding standards, API contracts.  
- **Dev 2** → Authentication & user management.  
- **Dev 3** → Events CRUD.  
- **Dev 4** → Registrations & RSVP.  
- **Dev 5** → Reviews system.  
- **Dev 6** → Admin panel & analytics.  
- **Dev 7** → CI/CD, monitoring, and deployment automation.  TEST

---

## 📜 License
MIT License © 2025 PUK360 Team
