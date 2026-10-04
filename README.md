# Invoisify

Invoisify lets a freelancer or a small business create invoices, send them to
customers and see what has been paid.

We started it as a personal project in December 2024. It is being completed
in two stages; [docs/design.md](docs/design.md) describes the whole design.

| Part | State |
|---|---|
| Email accounts with verification and password reset, and a demo account | Done |
| Business profile: details, logo, colour, currency and tax | Done |
| Invoices: create, edit, duplicate, delete, draft → sent → paid, overdue | Done |
| Invoice list with search, status filter and pages; PDF download | Done |
| Sending by email, the public invoice page, dashboard figures, reviews | Next |

## Run it

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5178>. The web app forwards `/api` to the server on
port 3004. With `SEED_ON_START=true` the demo account is built when the
server starts; the login page has a button for it.

## Tests

```bash
cd backend
npm test
```

The tests start their own in-memory database. They never send email and never
store a file.

## Team

Built by team Tech Forge: Samir Suroshe
([@samirsuroshe18](https://github.com/samirsuroshe18)), Tanishq Kulkarni
([@TanishqMSD](https://github.com/TanishqMSD)) and Mohit Dhangar
([@mohit45v](https://github.com/mohit45v)).
