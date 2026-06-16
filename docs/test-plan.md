# Test Plan — Aadikarta Astro App

**Date:** 2026-04-30 | **Branch:** staging | **Status:** No existing automated tests

---

## 1. Scope

Full coverage across: Web app (React), Admin dashboard (React), Mobile app (Capacitor/Android), and Backend API (FastAPI/PostgreSQL).

---

## 2. Test Strategy

| Layer | Approach | Tooling (Recommended) |
|---|---|---|
| API unit/integration | Endpoint contracts, DB state, auth guards | `pytest` + `httpx` + test DB |
| Backend services | Business logic isolation | `pytest` + mocks |
| Frontend components | Render + interaction | `Vitest` + `Testing Library` |
| End-to-end | Critical user journeys | `Playwright` |
| Mobile | Native features on Android | `Appium` or `Detox` |
| Security | Auth, CSRF, injection | Manual + `OWASP ZAP` |
| Performance | Load on chat/WebSocket | `Locust` |

---

## 3. Module-by-Module Test Cases

---

### 3.1 Authentication & Authorization

| # | Test Case | Type | Priority |
|---|---|---|---|
| A-1 | User signs up with valid email, phone, password | E2E | P0 |
| A-2 | Signup fails with duplicate email | API | P0 |
| A-3 | Login returns JWT with correct `role` claim | API | P0 |
| A-4 | Login fails with wrong password | API | P0 |
| A-5 | Forgot password sends OTP to registered email | API | P0 |
| A-6 | OTP verification accepts valid token, rejects expired | API | P0 |
| A-7 | Password reset invalidates old token after use | API | P1 |
| A-8 | JWT with expired `exp` is rejected on protected routes | API | P0 |
| A-9 | Admin-only endpoints reject SEEKER role token | API | P0 |
| A-10 | ASTROLOGER cannot access SEEKER-only endpoints | API | P1 |
| A-11 | CSRF token missing on state-mutating request is rejected | API | P1 |
| A-12 | CSRF exemption paths (`/login`, `/signup`, webhook) are not blocked | API | P1 |
| A-13 | `get_current_user_optional` allows unauthenticated access to public routes | API | P1 |
| A-14 | Frontend redirects unauthenticated users to `/login` | E2E | P0 |
| A-15 | Token persists across page refresh (localStorage / Capacitor Preferences) | E2E | P1 |

---

### 3.2 User Registration & Profile

| # | Test Case | Type | Priority |
|---|---|---|---|
| U-1 | Seeker can update profile: name, DOB, time/place of birth, gender | API | P0 |
| U-2 | Profile photo upload persists correctly | API | P1 |
| U-3 | Incomplete profile triggers `ProfileCompletionModal` in dashboard | E2E | P1 |
| U-4 | FCM device token registers and replaces old token | API | P1 |
| U-5 | Seeker cannot update another user's profile | API | P0 |
| U-6 | Admin can reset a user's password | API | P1 |
| U-7 | Admin can update user status (active/inactive) | API | P1 |
| U-8 | Admin can delete a user (soft/hard delete behavior) | API | P1 |

---

### 3.3 Astrologer Onboarding & Profile

| # | Test Case | Type | Priority |
|---|---|---|---|
| AST-1 | Astrologer signup via OTP sends code to phone/email | API | P0 |
| AST-2 | Onboarding completes and creates `AstrologerProfile` record | API | P0 |
| AST-3 | Unapproved astrologer cannot be listed publicly | API | P0 |
| AST-4 | Admin approves astrologer and they appear in public listing | E2E | P0 |
| AST-5 | Astrologer updates bio, rates, availability, languages | API | P1 |
| AST-6 | Astrologer toggles online/offline status | API | P1 |
| AST-7 | `/astrologers` list supports sorting (by rating, price) and pagination | API | P1 |
| AST-8 | Individual astrologer profile page shows correct data | E2E | P1 |
| AST-9 | Admin can edit astrologer details from admin panel | E2E | P1 |

---

### 3.4 Consultation Flow (Core Business Logic)

| # | Test Case | Type | Priority |
|---|---|---|---|
| CON-1 | Seeker with sufficient wallet balance can request consultation | E2E | P0 |
| CON-2 | Consultation request rejected if wallet balance < minimum | API | P0 |
| CON-3 | Astrologer receives consultation request (status: REQUESTED) | API | P0 |
| CON-4 | Consultation transitions: REQUESTED → ACCEPTED → ONGOING | API | P0 |
| CON-5 | Astrologer can REJECT a consultation request | API | P1 |
| CON-6 | Seeker wallet is deducted per-minute during ONGOING consultation | API | P0 |
| CON-7 | Consultation auto-ends (AUTO_ENDED) when wallet balance hits zero | API | P0 |
| CON-8 | Consultation can be PAUSED and RESUMED (package scenario) | API | P1 |
| CON-9 | Completed consultation appears in history for both seeker and astrologer | API | P0 |
| CON-10 | Astrologer earnings are credited after consultation completes | API | P0 |
| CON-11 | Seeker can submit rating (1–5) and review after consultation | E2E | P1 |
| CON-12 | Duplicate review submission is rejected | API | P1 |
| CON-13 | Missed consultation (no astrologer response) changes status to MISSED | API | P1 |
| CON-14 | Consultation detail endpoint returns correct messages and metadata | API | P1 |
| CON-15 | Billing loop crash recovery on server restart resumes active consultations | API | P0 |

---

### 3.5 Chat / WebSocket

| # | Test Case | Type | Priority |
|---|---|---|---|
| CHAT-1 | WebSocket connection requires valid JWT token in query param | API | P0 |
| CHAT-2 | Seeker and astrologer both receive messages in real-time | E2E | P0 |
| CHAT-3 | Message persisted to DB and retrievable via `/consultations/{id}/messages` | API | P0 |
| CHAT-4 | Third user cannot connect to consultation WebSocket they don't belong to | API | P0 |
| CHAT-5 | WebSocket disconnection is handled gracefully (no crash) | API | P1 |
| CHAT-6 | HTTP fallback `POST /chat/send` delivers message when WS unavailable | API | P2 |
| CHAT-7 | Chat history loads correctly for completed consultation | E2E | P1 |
| CHAT-8 | Billing deduction event is emitted per-minute via billing loop | API | P0 |

---

### 3.6 Wallet & Payment

| # | Test Case | Type | Priority |
|---|---|---|---|
| PAY-1 | Razorpay order is created with correct amount | API | P0 |
| PAY-2 | Payment verification validates HMAC-SHA256 signature | API | P0 |
| PAY-3 | Invalid Razorpay signature is rejected | API | P0 |
| PAY-4 | Successful payment adds correct amount to user wallet | API | P0 |
| PAY-5 | Razorpay webhook `payment.captured` also credits wallet (idempotent) | API | P0 |
| PAY-6 | Duplicate webhook event does not double-credit wallet | API | P0 |
| PAY-7 | Wallet balance displayed correctly in dashboard | E2E | P0 |
| PAY-8 | Transaction history shows DEPOSIT, CHAT_DEDUCTION, REFUND entries | API | P1 |
| PAY-9 | Admin can add money to user wallet directly | API | P1 |
| PAY-10 | Package purchase deducts from wallet and sets `package_seconds_remaining` | API | P1 |
| PAY-11 | `PaymentModal` renders and completes Razorpay flow in browser | E2E | P1 |

---

### 3.7 Kundli Generator

| # | Test Case | Type | Priority |
|---|---|---|---|
| KUN-1 | Only ASTROLOGER role can call `POST /kundli/generate` | API | P0 |
| KUN-2 | Valid birth details produce a kundli report via Vedic Rishi API | API | P0 |
| KUN-3 | Invalid place name returns a meaningful error (geocoding failure) | API | P1 |
| KUN-4 | Geocoding fallback (without country filter) retries on failure | API | P1 |
| KUN-5 | Kundli report is stored and retrievable by `report_id` | API | P1 |
| KUN-6 | Seeker's kundli history accessible to the astrologer in their consultation | API | P1 |
| KUN-7 | `KundliChart` component renders chart SVG without crashing | Component | P1 |
| KUN-8 | `KundliGenerator` page submits form and displays result | E2E | P1 |

---

### 3.8 CMS — Blog Posts, Pages & Horoscopes

| # | Test Case | Type | Priority |
|---|---|---|---|
| CMS-1 | Admin can create, edit, publish, and delete a blog post | E2E | P1 |
| CMS-2 | DRAFT post is not visible on public `/public/posts` endpoint | API | P0 |
| CMS-3 | PUBLISHED post is returned by slug via `/public/posts/:slug` | API | P0 |
| CMS-4 | Static page renders at `/:slug` using CMS content | E2E | P1 |
| CMS-5 | Horoscope CRUD for each of 12 zodiac signs × 4 periods | API | P1 |
| CMS-6 | Admin can view contact inquiries and change their status | E2E | P1 |
| CMS-7 | Contact form submission creates `ContactInquiry` record | API | P1 |
| CMS-8 | Rich text editor (Quill) in admin saves HTML content correctly | E2E | P2 |
| CMS-9 | SEO meta tags (`<title>`, `<description>`) populated on blog post page | E2E | P1 |

---

### 3.9 Education Platform

| # | Test Case | Type | Priority |
|---|---|---|---|
| EDU-1 | TUTOR role can create a course | API | P0 |
| EDU-2 | Non-TUTOR cannot create a course | API | P0 |
| EDU-3 | Tutor can create a batch under a course | API | P1 |
| EDU-4 | Student can enroll in a batch (with wallet deduction) | API | P1 |
| EDU-5 | Tutor can create a class session and it generates a MiroTalk room | API | P1 |
| EDU-6 | Enrolled student gets valid join URL for session | API | P0 |
| EDU-7 | Unenrolled user cannot join a session | API | P0 |
| EDU-8 | MiroTalk webhook records attendance (join/leave timestamps) | API | P1 |
| EDU-9 | Tutor can upload and list course materials (PDF/video/link) | API | P1 |
| EDU-10 | `Classroom` page embeds MiroTalk room in iframe | E2E | P1 |
| EDU-11 | Admin `EduReports` page shows enrollment and session statistics | E2E | P2 |
| EDU-12 | Session status transitions: UPCOMING → ONGOING → COMPLETED | API | P1 |

---

### 3.10 Disputes

| # | Test Case | Type | Priority |
|---|---|---|---|
| DIS-1 | Seeker can raise a dispute on a completed consultation | API | P1 |
| DIS-2 | Duplicate dispute on the same consultation is rejected | API | P1 |
| DIS-3 | Admin can list all open disputes | API | P1 |
| DIS-4 | Admin can resolve dispute with a refund amount and notes | API | P1 |
| DIS-5 | Dispute resolution triggers wallet transaction (CHAT_REFUND) | API | P1 |
| DIS-6 | Admin disputes page renders and allows status updates | E2E | P2 |

---

### 3.11 Admin Dashboard

| # | Test Case | Type | Priority |
|---|---|---|---|
| ADM-1 | Admin login redirects to dashboard; non-admin is rejected | E2E | P0 |
| ADM-2 | Dashboard stats endpoint returns user count, revenue, consultation count | API | P1 |
| ADM-3 | Admin can approve a pending astrologer | E2E | P0 |
| ADM-4 | Payout generation calculates correct earnings for period | API | P0 |
| ADM-5 | Admin marks payout as PROCESSED | API | P1 |
| ADM-6 | Admin can verify a user account | API | P1 |
| ADM-7 | Audit logs are created for sensitive admin actions | API | P1 |
| ADM-8 | File upload via `/admin/upload` stores file and returns URL | API | P1 |
| ADM-9 | Admin can view full wallet transaction history for any user | API | P1 |

---

### 3.12 Packages (Chat Packages)

| # | Test Case | Type | Priority |
|---|---|---|---|
| PKG-1 | Admin can create and deactivate a chat package | API | P1 |
| PKG-2 | Public endpoint lists only active packages | API | P1 |
| PKG-3 | Seeker can checkout a package; wallet is debited, `package_seconds_remaining` set | API | P0 |
| PKG-4 | Consultation using package deducts from `package_seconds_remaining` first | API | P1 |
| PKG-5 | Package expiry/exhaustion falls back to per-minute billing | API | P1 |

---

### 3.13 Notifications

| # | Test Case | Type | Priority |
|---|---|---|---|
| NOT-1 | FCM notification sent to astrologer on new consultation request | API | P1 |
| NOT-2 | FCM notification sent to seeker when consultation is accepted | API | P1 |
| NOT-3 | Graceful fallback (mock log) when Firebase not initialized | API | P1 |
| NOT-4 | Device token is associated with correct user and platform | API | P2 |

---

### 3.14 Mobile App (Capacitor/Android)

| # | Test Case | Type | Priority |
|---|---|---|---|
| MOB-1 | App loads and renders home page on Android | Manual | P0 |
| MOB-2 | Login/signup flow works on native (Capacitor Preferences stores token) | Manual | P0 |
| MOB-3 | Bottom navigation (`MobileNavBar`) displays and navigates correctly | Manual | P1 |
| MOB-4 | Chat WebSocket functions on mobile (background, foreground) | Manual | P0 |
| MOB-5 | Push notification arrives and taps open the correct screen | Manual | P1 |
| MOB-6 | Razorpay payment modal opens in-app WebView | Manual | P0 |
| MOB-7 | Camera/gallery permission request for profile photo upload | Manual | P2 |
| MOB-8 | App handles network drop in the middle of active consultation | Manual | P1 |

---

### 3.15 Security

| # | Test Case | Type | Priority |
|---|---|---|---|
| SEC-1 | JWT with tampered payload signature is rejected | API | P0 |
| SEC-2 | SQL injection attempts in search/filter params return 422, not 500 | API | P0 |
| SEC-3 | XSS payload in CMS content is sanitized before storage/render | API | P0 |
| SEC-4 | File upload endpoint rejects non-image MIME types | API | P1 |
| SEC-5 | Razorpay webhook without valid signature is rejected with 400 | API | P0 |
| SEC-6 | Rate limiter blocks repeated requests from same IP | API | P1 |
| SEC-7 | Hardcoded AstroAPI token in `vedic_rishi_service.py` must be moved to env var | Code Review | P1 |
| SEC-8 | HSTS, X-Frame-Options, and CSP headers present in all responses | API | P1 |
| SEC-9 | Seeker cannot access another seeker's wallet or chat history | API | P0 |
| SEC-10 | MiroTalk JWT cannot be used for a session the user did not enroll in | API | P1 |

---

### 3.16 Performance

| # | Test Case | Type | Priority |
|---|---|---|---|
| PERF-1 | WebSocket billing loop sustains 50 concurrent consultations without drift | Load | P1 |
| PERF-2 | `/astrologers` paginated list responds in < 200ms at 1000 records | Load | P2 |
| PERF-3 | Kundli generation (external API call) has timeout and does not block others | API | P1 |
| PERF-4 | Dashboard page LCP < 2.5s on 4G network (mobile) | Perf | P2 |
| PERF-5 | Redis crash recovery on startup completes within 5 seconds | API | P1 |

---

## 4. Test Environments

| Environment | Purpose | DB |
|---|---|---|
| Local (Docker Compose) | Developer testing, unit tests | Test Postgres |
| CI (GitHub Actions) | Automated API + component tests | Ephemeral Postgres |
| Staging | Integration, E2E, manual QA | Staging Postgres |
| Production | Smoke tests only after deploy | Production |

---

## 5. Priority Summary

| Priority | Count | Description |
|---|---|---|
| **P0** | ~40 | Must pass before any release — auth, payments, consultation billing, security |
| **P1** | ~55 | Required for full release — all business flows end-to-end |
| **P2** | ~10 | Nice-to-have — analytics, edge cases, performance |

---

## 6. Test Coverage Gaps to Address First

1. **Billing loop crash recovery** (CON-15) — core revenue risk, highest priority to automate
2. **Payment idempotency** (PAY-6) — double-credit bug would be costly
3. **Role-based access control** — every endpoint should have an unauthorized-role test
4. **Hardcoded AstroAPI token** (SEC-7) — should be flagged and rotated before it leaks
5. **WebSocket auth** (CHAT-4) — unauthorized access to other users' chats is a P0 security issue

---

## 7. Recommended Implementation Order

1. Set up `pytest` + `httpx` + a test database fixture for the FastAPI layer
2. Write P0 API tests (auth, consultation billing, payment)
3. Add `Vitest` + `Testing Library` for `Dashboard.tsx` and `Chat.tsx` (largest, highest risk)
4. Add `Playwright` E2E for: signup → top-up wallet → start consultation → end → review
5. Integrate all into CI on every PR to `staging`
