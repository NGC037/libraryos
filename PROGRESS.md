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
- Phase 9a: Acquisitions pipeline (§4.7, part 1) — schema (vendors, budget_allocations,
  acquisition_requests, acquisition_votes, acquisition_quotes, acquisition_approvals,
  purchase_orders, purchase_order_lines, receipts) + acquisitionsRouter covering the full
  request → vote → quote → approval → PO → receive flow. Approval stage count is
  org-configurable via organizations.settings.acquisitionApprovalStages (default 1).
  Budget is checked and row-locked (`for("update")`) at PO creation, not after. PO creation
  and receiving are both idempotency-keyed and transaction-wrapped, matching the
  circulation checkout/return pattern. Partial receiving creates one append-only receipt
  row per shipment rather than mutating a single flag. First Vitest integration suite in
  the repo (tests/acquisitions/), run against a real Postgres db per DATABASE_URL, covering:
  duplicate-vote rejection, reject-requires-reason, over-budget PO rejection, PO-creation
  idempotency (no double-commit), and partial-then-full receiving (idempotent, budget
  settles spent/committed correctly on completion).

## Known gaps / deferred

- No recall workflow yet (staff-initiated early return request)
- No finance module (beyond per-allocation budget tracking added in Phase 9a)
- Acquisitions lifecycle actions not yet built: accessioning ledger, stocktake, condition
  checks, repair, relocation, withdrawal, donation, disposal, loss investigation — this is
  Phase 9b, the second half of §4.7, deliberately split out
- Receiving a PO line that has no `editionId` yet (a brand-new title, not yet cataloged)
  does not auto-accession — it updates quantityReceived and the budget, but skips copy
  creation. Cataloging must happen first, then a future lifecycle-phase step will need to
  reconcile "received but not yet shelved" quantities. Named here rather than silently
  skipped.
- Receiving with condition = "damaged" intentionally does not create copies (a damaged
  unit isn't put into circulation), but there's currently no "damaged receiving" queue or
  vendor-claim workflow — it's just recorded on the receipt row and otherwise dead-ends.
- No notifications
- Circulation desk UI is unstyled (no §15 design system yet); no UI for holds/renewals/
  transfers/acquisitions yet, only the API
- Duplicate credential issuance not prevented (test artifact, harmless)
- `drizzle/meta` was previously gitignored, which silently breaks migration numbering on
  a fresh clone (`drizzle-kit generate` restarts at 0000 instead of continuing from your
  real migration history). Fixed as part of Phase 9a — confirm `drizzle/meta/_journal.json`
  and the numbered snapshot files are tracked in git going forward.

## Next planned phase

Phase 9b: Acquisitions lifecycle actions (§4.7, part 2) — accession/label/shelve as an
append-only `lifecycle_actions` ledger (mirroring circulation_events), condition checks,
repair, relocation, then stocktake sessions (bulk scan → expected-vs-observed reconciliation,
missing-during-stocktake enters an investigation state rather than being deleted), withdrawal,
donation, and disposal.
