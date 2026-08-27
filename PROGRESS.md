## Completed phases

- Phase 1: Tenancy + identity/access schema, auth, org-scoped tRPC context
- Phase 2: Catalog (works/editions), copies, structured shelf locations, locateCopy/search
- Phase 3: Circulation core (checkout/return), idempotency keys, circulation_events ledger
- Phase 4: Policy engine (policies/policy_versions), loan limits, eligibility checks
- Phase 5: Onboarding lifecycle, credentials (issue/revoke/replace), member log card + permission filtering
- Phase 6: Minimal staff UI (circulation desk, member log card timeline) via tRPC React
- Phase 7: Holds/waitlist, queue auto-advances on return
- Phase 8: Renewals (blocked by waiting holds), inter-branch transfers (initiate/receive)
  → §4.5 circulation is now feature-complete: checkout, return, renew, hold, transfer

## Known gaps / deferred

- No recall workflow yet (staff-initiated early return request)
- No finance module
- No acquisitions
- No spaces/equipment booking
- No notifications
- Circulation desk UI is unstyled (no §15 design system yet); no UI for holds/renewals/transfers yet, only the API
- Duplicate credential issuance not prevented (test artifact, harmless)

## Next planned phase

Acquisitions & lifecycle (§4.7) — requests, votes, approvals, purchase orders, receiving,
then stocktake/withdrawal/disposal
