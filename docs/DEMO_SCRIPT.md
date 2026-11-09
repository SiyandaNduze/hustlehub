# Demonstration video script (about 8 to 10 minutes)

Record the screen with your voice over it. Use the Docker stack so the video also proves containerisation.

## Before recording
```bash
cp .env.example .env        # set JWT_SECRET and ADMIN_PASSWORD; add LOG_HTTP_URL / LOG_HTTP_TOKEN for cloud logs
docker compose up -d --build --wait
```
Have these open: the app at https://localhost:8443, a terminal, your cloud log dashboard (Live tail), and the GitHub Actions page.

## Script
1. **Intro (20 s)** Show the architecture diagram. Say what HustleHub+ is.
2. **Containers (30 s)** Run `docker compose ps`: both services **healthy**. Mention HTTPS, non-root backend.
3. **Registration and validation (45 s)** Register a freelancer. First try a weak password and the password `Password123` to show the validation and common-password messages. Then register with a valid password. Mention bcrypt.
4. **Login and lockout (45 s)** Log in. In a private window, fail a login 5 times for the same e-mail, then use the right password to show the lockout message. Mention the `Retry-After` header and that unknown e-mails behave identically.
5. **Gig creation (45 s)** As the freelancer create a gig (try `<script>alert(1)</script>` in the title and show it is stripped / rendered as text). Edit the price, show the gig list.
6. **Booking (60 s)** Register or log in as a client in a second browser, search for the gig, book it with notes. Show the confirmation with the transaction reference.
7. **Transaction recording (45 s)** Show the client's bookings. As the freelancer open **Bookings** and **Income**: the booking and transaction appear with the client's name.
8. **Income and tax dashboard (90 s)** On **Income**: summary cards, monthly chart, donut, bracket table, the insight text, the tax-year selector and the *How this estimate works* section. Optional: run `npm run seed:demo` first (or in the container: `docker compose exec backend node scripts/seedDemo.js`) so the charts have a full year of data. Explain one worked example (R150,000 -> R9,180).
9. **Access control (45 s)** Show that a client cannot open `/my-gigs` or `/income` (redirected), and in Postman/Newman or the browser console that another freelancer's gig returns **403**.
10. **Admin and ledger (60 s)** Log in as admin: users (no hashes), all transactions, **Verify ledger** shows intact. Then edit an amount in the volume's `transactions.json` (or locally in `src/data`) and verify again to show the tamper detection.
11. **Logout revocation (30 s)** Copy a token, log out, show `401` when reusing it.
12. **Logging (75 s)** `docker compose logs backend` and the cloud dashboard: show `auth.login.failure`, `auth.login.lockout`, `booking.created`, `transaction.created`, and `access.denied`. Point out masked e-mails and no secrets. Explain why these logs matter.
13. **Tests and pipeline (75 s)** Run `npm run test:api` (or show the report), then the GitHub Actions run: backend, frontend, docker-stack jobs green, and the CodeQL page. Show a red run if you recorded one.
14. **Wrap-up (20 s)** Summarise the security features and limitations.

Tips: keep the browser zoom large, avoid showing real secrets (blur the token and `.env`), and keep each segment short.
