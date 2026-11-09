# Evidence checklist

Save screenshots in `docs/evidence/` using these names, then reference them from the README if you wish.

| File | What to capture | Proves (rubric area) |
|---|---|---|
| `01-ci-green.png` | GitHub Actions run with backend, frontend, docker-stack and ci-passed all green | CI/CD pipeline: tests, builds, stack |
| `02-ci-red.png` | A run that fails because of a deliberately broken test or lint rule | Pipeline fails when checks do not pass |
| `03-eslint-clean.png` | Terminal: `npm run lint` finishing with no output | Static analysis (ESLint security) |
| `04-codeql.png` | Security -> Code scanning page | Static analysis (CodeQL) |
| `05-npm-audit.png` | `npm run audit:prod` result | Dependency scanning |
| `06-unit-tests.png` | `npm run test:unit` showing 55 passing | Backend tests |
| `07-newman.png` | `npm run test:api:docker` summary (all passing) or the HTML report | Backend API/security tests with Newman |
| `08-frontend-tests.png` | `npm run test:client` showing all tests passing | Frontend tests |
| `09-compose-ps.png` | `docker compose ps` with both services healthy | Docker / Compose |
| `10-app-8443.png` | The app running at https://localhost:8443 | Containerised stack |
| `11-dashboard.png` | Income page with charts and the bracket table | Final features: tax + income dashboard |
| `12-cloud-logs.png` | Cloud log dashboard showing login failure, lockout, booking, transaction and error events | Logging with a cloud platform |
| `13-log-file.png` | `docker compose exec backend tail -n 20 /logs/app.log` | Structured logging |
| `14-ledger-ok.png`, `15-ledger-tamper.png` | Admin ledger check before and after editing a transaction | Extra security feature |
| `16-lockout.png` | Lockout message after five failed logins | Extra security feature |
| `17-headers.png` | Browser dev tools or `curl -kI` showing CSP and security headers | Security headers |

Also record the demonstration video (script: `docs/DEMO_SCRIPT.md`) and paste the link in the README (section 15).
