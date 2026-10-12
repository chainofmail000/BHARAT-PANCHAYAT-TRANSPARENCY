# Nagrik Kothamangalam integration plan

## Goal

Add a public, ward-first civic transparency experience for Kothamangalam Municipality (33 wards) without replacing the existing Bharat Panchayat Transparency application. The existing application remains the project/feedback workflow until its authentication and publication controls are hardened.

## Integration approach

**Keep the current stack for the first release:** React (Create React App) + FastAPI + SQLAlchemy. Do not introduce a second database or rewrite the frontend during the initial integration. Introduce a repository/service boundary before any later database migration.

### Public experience

- Municipality landing page with clear scope, data freshness, and links to source records.
- Ward finder for the 33 wards; ward names and boundaries must come from an official/source-verified dataset, not guessed labels.
- Ward pages: councillor details, contact channels, meeting/minutes links, and works/tenders.
- Work record: title, location/ward, administrative department, sanctioned amount, tender/award reference, contractor, dates, status, progress, source URL/document, and last verified date.
- Explicit states for verified, needs review, and unavailable; do not present missing data as zero or as a negative finding.
- Citizen feedback/reporting as a separate workflow from official project records.

### Restricted workspaces

- **Citizen:** submit a report and view only their own submission status once authenticated; public reports require moderation and privacy review.
- **Official:** create/update records only within an explicitly assigned municipality/ward scope; publish only after review.
- **Contractor:** view assigned works and submit progress/evidence updates; cannot publish public records or alter award/budget fields.
- **Administrator/reviewer:** manage roles, source verification, moderation, and audit history.

Role selection in the current React app is a UI convenience, not authorization. Every privileged API action must be protected server-side before these workflows are exposed publicly.

## Proposed phases

### Phase 1 — foundation (this branch)
- Make frontend API origin configurable for local, preview, and production environments.
- Document the current application boundaries and security blockers.
- Preserve existing routes and the current database while the new public portal is designed.

### Phase 2 — verified data model
Add municipality/ward and source records with migrations (not production-time create_all). Every public-facing work/tender/councillor record should carry provenance, verification state, and timestamps. Prefer stable source identifiers and retain historical values for auditability.

### Phase 3 — read-only public portal
Build the landing page, ward directory, councillor profiles, and works/tenders views using read-only, published records. Add search and filters only after canonical data is imported and checked. No write actions should be available from anonymous public endpoints.

### Phase 4 — secure workflows
Implement authentication, server-side role/scope checks, audit events, moderation, rate limits, upload validation, and private evidence storage. Migrate existing officer/contractor PIN flows before treating them as secure accounts.

### Phase 5 — data ingestion and launch
- Collect official ward/councillor and tender/award sources.
- Record the source URL, retrieval date, and reviewer for each import.
- Reconcile duplicates and ambiguous names manually.
- Run accessibility, privacy, authorization, backup/restore, and deployment checks.
- Publish a data policy and correction request process.

## Data contract principles
- Amounts are numeric values with explicit currency (INR) and must distinguish sanctioned, awarded, released, and spent amounts.
- Dates use ISO 8601 on the API boundary.
- Unknown values are null, never fabricated defaults.
- Public-facing records should include source_url, source_label, source_checked_at, verification_status, and last_updated_at.
- Personal phone numbers, citizen submissions, exact reporter coordinates, and unreviewed evidence must not be exposed by public list endpoints.

## Acceptance criteria
1. The existing app continues to work with its default local API URL.
2. Deployments can configure the API origin without editing source code.
3. A ward page cannot display a councillor or tender as verified unless a source and verification state exist.
4. Public endpoints return published/approved fields only.
5. Citizen, officer, and contractor access is enforced by the backend, not by React state.
6. Database changes are delivered as reviewed migrations with a backup/rollback plan.
7. No public launch claim is made until the 33-ward dataset and source links are verified.

## Known blockers from the existing codebase
- The current frontend presents role selection, but the role is held in client-side React state.
- Contractor PINs are stored and compared as plaintext; the model supplies a default PIN of 0000.
- Several contractor and project mutation endpoints have no visible server-side authentication/authorization dependency.
- Uploaded evidence is exposed by a static /uploads mount.
- The database connection is hard-coded to local SQLite and schema creation runs at application import.
- The public project API currently reflects the existing project schema; it is not yet a source-verified tender registry.

These blockers must be addressed before production use of restricted workflows. This integration branch does not claim to solve them all.
