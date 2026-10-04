# Invoisify: design of the completed app

Invoisify lets a freelancer or a small business create invoices, send them to
customers and see what has been paid. It began as a personal project of the
team in December 2024. This document describes the completed version.

## 1. Where the project stands

The first version has accounts with Google login, a form that creates an
invoice with a PDF download, a history page, a dashboard, templates and
reviews.

| Problem | Effect |
|---|---|
| The dashboard, the invoice form and the history open without a login; the check of the session is commented out | Pages that fail or show nothing for a visitor |
| The dashboard shows fixed numbers and a made-up activity list | Nothing on it is true |
| An invoice can only be created | It cannot be opened again, changed, deleted or marked as paid; its status never changes |
| There are two invoice forms; one posts to a route that does not exist | One of them can never work |
| A logo is required and the server fails without one | An invoice cannot be created without an image |
| The server trusts the total the browser sends | The stored total can be anything |
| The history page calls `localhost:3000` and treats "no invoices" as an error | It works on the developer's machine only |
| Anyone can create templates and reviews without logging in | Open to spam |
| Verification and reset pages are rendered by the server from templates | They do not look like the app and break behind a separate web host |
| Uploaded images were committed | Removed from the history of the new repository |
| No tests | Nothing guards the behaviour |

## 2. What the completed app does

A user signs up, fills in the details of their business once, and creates,
sends and tracks invoices. A visitor can try everything with a demo account
that already has invoices in it.

### Decisions

| Topic | Decision |
|---|---|
| Repository | New repository `invoisify` under samirsuroshe18, team history kept, uploaded images and the Google client id removed from every commit |
| Sign-in | Email accounts with verification and password reset, and a demo login. Google login is removed |
| Invoices | Full life cycle: create, open, edit a draft, duplicate, delete, download as PDF, draft → sent → paid, overdue shown automatically |
| Sending | Email to the customer with a link to a public read-only page of the invoice |
| Templates | Become a business profile for each user |
| Reviews | Kept on the landing page; only verified users post, one each |
| Dashboard | Real figures and a chart from the user's own invoices |
| Look | The current look is kept; what is broken is fixed |
| Out of scope | Online payment, recurring invoices, a saved client list, several users for one business |
| Delivery | Two stages (section 12) |

## 3. Accounts

- Sign-up with name, email and password (at least 8 characters). A
  verification link is sent by email and is valid for 10 minutes; the app has
  a page that receives it. An account that is not verified can log in and is
  told to verify, with a button to send the link again; it cannot create or
  send anything until it is verified.
- Login keeps the session in an httpOnly cookie for 7 days. Logout, a password
  change and a password reset end every session of the account.
- A second verification link can be asked for a minute after the first, and
  an account can ask for five in fifteen minutes.
- "Forgot password" sends a reset link, valid for 10 minutes, to a page of
  the app. The answer is the same whether or not the address has an account.
- Sign-up, login and password reset are limited per visitor and per
  connecting address. Sign-up and password reset are also limited per email
  address. Wrong passwords are counted per account and visitor, and more
  widely per account, so guessing from one place does not lock the owner out
  elsewhere; a login that succeeds is not counted. An IPv6 visitor is counted
  by network.
- The whole site sends at most `DAILY_MAIL_LIMIT` mails a day (default 250).
- **Demo account**: `demo@invoisify.demo`, password `Demo@123`, behind a
  button on the login page. Nobody can sign up with an `@invoisify.demo`
  address. The demo account sends no email, stores no files, cannot change
  its password and cannot post a review. Its business profile and invoices
  are rebuilt when the server starts (`SEED_ON_START=true`), which undoes
  what visitors did.

## 4. Business profile

One for each user, in Settings:

| Field | Rule |
|---|---|
| Company name | Required before the first invoice; at most 120 characters |
| Email, phone, address | Optional; address at most 300 characters |
| Logo | Optional. JPEG, PNG or WebP, at most 1 MB, recognised by its content and not by its name, stored on Cloudinary. Without Cloudinary settings the profile works and the logo is not stored |
| Accent colour | A `#rrggbb` colour for the invoice heading; default `#2563eb` |
| Default currency | One of `INR`, `USD`, `EUR`, `GBP`; default `INR` |
| Default tax rate | 0 to 100 per cent, at most two decimals; default 0 |
| Payment details | Optional free text shown at the bottom of an invoice (bank account, UPI id); at most 500 characters |

An invoice copies the business details when it is created or edited as a
draft. An invoice that was sent keeps the details it was sent with.

## 5. Invoices

### Content

| Field | Rule |
|---|---|
| Number | `INV-0001`, `INV-0002`, …: the next number of that user, given by the server when the invoice is created; never reused |
| Customer | Name required (at most 120); email optional but required to send; address optional (at most 300) |
| Issue date, due date | Calendar days; the due date is not before the issue date |
| Currency | One of the four; from the profile by default |
| Items | 1 to 50. Description (1 to 200 characters), quantity (above 0, at most three decimals), rate (0 or more, at most two decimals) |
| Discount | 0 to 100 per cent of the subtotal, at most two decimals |
| Tax | 0 to 100 per cent, applied after the discount |
| Notes | Optional, at most 1,000 characters |

A quantity is at most 100,000, a rate at most 100,000,000, and the total of an
invoice at most a million million. An account holds at most 2,000 invoices
(`MAX_INVOICES`); the demo account 200.

### Totals

The server calculates them, in hundredths so they are exact, and stores them
with the invoice. What the browser sends as a total is ignored.

- line amount = quantity × rate, rounded to two decimals
- subtotal = sum of the line amounts
- discount amount = subtotal × discount %, rounded
- tax amount = (subtotal − discount amount) × tax %, rounded
- total = subtotal − discount amount + tax amount

### Status

| Status | Meaning | What can be done |
|---|---|---|
| `draft` | Being written | Edit, send, mark as sent, delete, duplicate |
| `sent` | Given to the customer | Mark as paid, send again, back to draft, delete, duplicate |
| `paid` | Paid on a day the user gives (today by default, not before the issue date, not in the future) | Mark as unpaid (back to `sent`), duplicate |

`overdue` is not stored: an invoice is overdue when it is `sent` and its due
date is before today. "Today" is the day in the time zone set by
`BUSINESS_UTC_OFFSET_MINUTES` (default 330, India).

Only a draft can be edited or have its status changed to sent; a paid invoice
cannot be deleted before it is marked unpaid. A duplicate is a new draft with
a new number, today as its issue date and the same number of days until its
due date.

### List

The History page becomes "Invoices": the user's own invoices, newest first,
20 to a page, with a search in number and customer name and a filter by
status (all, draft, sent, overdue, paid).

### PDF

The page of an invoice has "Download PDF", which makes the PDF in the
browser from what is on screen, as now. The file is named after the invoice
number.

## 6. Sending

- "Send" on a draft or a sent invoice emails the customer: who the invoice is
  from, its number, total and due date, and a link.
- The link opens a public page that shows that one invoice, read-only, with
  "Download PDF". The address carries a random code of 32 hex characters
  made when the invoice is first sent or shared. The page shows nothing else
  about the user.
- A draft becomes `sent` when the email was accepted for delivery. If it was
  not, the user is told and the invoice stays as it was.
- "Copy link" gives the same link without sending an email.
- "Stop sharing" makes a new code, so the old link stops working.
- A user can send 20 emails a day (`DAILY_SEND_LIMIT`). The demo account's
  sends are simulated: the invoice becomes `sent` and no email goes out.
- Email goes through the Brevo HTTPS API when `BREVO_API_KEY` is set,
  otherwise SMTP.

## 7. Dashboard

From the user's own invoices; drafts are not counted in amounts.

| Figure | Meaning |
|---|---|
| Invoiced | Sum of the totals of sent and paid invoices |
| Paid | Sum of the totals of paid invoices |
| Outstanding | Sum of the totals of sent invoices |
| Overdue | The part of outstanding that is overdue |
| Counts | Number of invoices in each status, overdue counted on its own |
| By month | For each of the last six months: invoiced (by issue date) and paid (by paid date) |
| Recent | The five latest invoices |

Amounts in different currencies are never added together. The figures are
given for each currency the user has invoices in; the dashboard shows the
default currency first and lets the user switch.

## 8. Reviews

- The landing page shows the reviews: name, rating (1 to 5), comment (at most
  500 characters), newest first, with the average.
- A logged-in, verified user who is not the demo account can post one review,
  and edit or delete it. The name shown is the user's name.
- Text with offensive words is refused.

## 9. Pages

| Page | Who | Content |
|---|---|---|
| Landing | Everyone | Hero, features, reviews |
| Login, Register, Forgot password, Reset password, Verify email | Everyone | Accounts; the login page has the demo button |
| Dashboard | Logged in | Section 7 |
| Invoices | Logged in | The list of section 5 |
| New invoice, Edit invoice | Verified | One form with a live preview beside it (under it on a phone) |
| Invoice | Logged in | The invoice, its status and its actions |
| Settings | Logged in | Business profile, change password |
| Public invoice | Everyone with the link | Section 6 |
| Not found | Everyone | |

Pages that need a login send a visitor to the login page and back to where
they were going. Every page that loads data has a loading, an empty and an
error state. The layout works on a phone without sideways scrolling.

## 10. API

All routes are under `/api/v1` and answer
`{ statusCode, data, message, success }`. Unexpected failures say only
"Internal server error".

| Route | Purpose |
|---|---|
| `POST /users/register`, `POST /users/login`, `POST /users/demo-login`, `GET /users/me`, `POST /users/logout` | Accounts |
| `POST /users/resend-verification`, `POST /users/forgot-password`, `POST /users/change-password` | |
| `GET /verify/verify-email`, `GET /verify/reset-password`, `POST /verify/reset-password` | Links from emails |
| `GET /business`, `PUT /business` | Business profile (logo as form field `logo`) |
| `GET /invoices`, `POST /invoices` | List (`page`, `search`, `status`) and create |
| `GET /invoices/:id`, `PUT /invoices/:id`, `DELETE /invoices/:id` | One invoice |
| `POST /invoices/:id/duplicate` | A new draft from it |
| `PATCH /invoices/:id/status` | `{ status, paidDate? }` |
| `POST /invoices/:id/send`, `POST /invoices/:id/share`, `DELETE /invoices/:id/share` | Email, link, stop sharing |
| `GET /public/invoices/:code` | The public page's invoice |
| `GET /dashboard` | Section 7 |
| `GET /reviews`, `PUT /reviews/mine`, `DELETE /reviews/mine` | Reviews |

A user reaches only their own invoices and profile; another user's id gives
"not found". Writes are limited per user.

## 11. Structure, settings and tests

```
backend/src/   app.js, index.js, controllers/, models/, routes/, middlewares/,
               utils/ (totals, numbers, mail, uploads, limits), scripts/ (demo data)
backend/tests/
frontend/src/  api/, components/, pages/, redux/, lib/
docs/design.md
```

The web app calls `/api` on its own address; the dev server and the host
forward it to the server.

`backend/.env`: `MONGODB_URI`, `PORT`, `SERVER_HOST`, `FRONTEND_URL`,
`ACCESS_TOKEN_SECRET`, `NODE_ENV`, SMTP settings or `BREVO_API_KEY` and `MAIL_FROM`,
Cloudinary settings (optional), `SEED_ON_START`, `DAILY_SEND_LIMIT`,
`BUSINESS_UTC_OFFSET_MINUTES`, `CONNECTION_IP_HEADER` (on hosts whose own
proxies sit in front of the server). The web app needs none.

Server tests run against an in-memory database and never send email or store
a file. They cover accounts, who may reach what, the totals (with numbers
checked by hand), the numbering under simultaneous requests, every status
change, sending and its limit, the public page, the dashboard figures, the
reviews and the demo data. The web app is checked by building it, linting it
and walking through every page in a browser on a desktop and a phone width.

## 12. Stages

1. **Accounts, business profile and invoices**: sections 3 to 5, the demo
   account with its sample invoices, and the pages for them.
2. **Sending, dashboard and reviews**: sections 6 to 8, the public invoice
   page, the landing page and the README.

Each stage has its own plan, tests, review and pull request.

## 13. Deployment

Server on Render, web app on Vercel, database on MongoDB Atlas, email through
Brevo, logos on Cloudinary. `frontend/vercel.json` forwards `/api` to the
server.
