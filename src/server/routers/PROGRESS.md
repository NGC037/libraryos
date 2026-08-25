# LibraryOS — Build Progress

## Stack
Next.js 16 (App Router) + TypeScript + tRPC + Drizzle + PostgreSQL (Docker, port 5433) + pnpm
Auth.js (Credentials provider, dev-only email lookup)

## Completed phases
- Phase 1: Tenancy + identity/access schema, auth, org-scoped tRPC context
- Phase 2: Catalog (works/editions), copies, structured shelf locations, locateCopy/search
- Phase 3: Circulation (checkout/return), idempotency keys, circulation_events ledger
- Phase 4: Policy engine (policies/policy_versions), loan limits, eligibility checks
- Phase 5: Onboarding lifecycle, credentials (issue/revoke/replace), member log card + permission filtering
- Phase 6: Minimal staff UI (circulation desk, member log card timeline) via tRPC React
- Phase 7: Holds/waitlist, queue auto-advances on return

## Known gaps / deferred
- No renewals, transfers, or recalls yet
- No finance module
- No acquisitions
- No spaces/equipment booking
- No notifications
- Circulation desk UI is unstyled (no §15 design system yet)
- Duplicate credential issuance not prevented (4 QR codes exist for test person — harmless test artifact)

## Environment notes
- Postgres runs on port 5433 (5432 conflicted with a native Windows install)
- pnpm dev must stay in its own terminal tab; use a second tab for all testing
- Session cookie testing: use DevTools → Network → right-click request → Copy as PowerShell → gives working $session object
- .env.local is git-ignored correctly

## Next planned phase
Renewals + transfers (finish circulation) → then acquisitions → finance → spaces → notifications → UI polish (§15) → analytics → AI Copilot → testing/hardening pass