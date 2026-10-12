# Security baseline before public launch

This is a deployment gate, not a claim that the current application is secure.

## Must-fix blockers

1. **Server-side identity and authorization.** The React `role` state is not authentication. Protect every write endpoint and every restricted read with a verified identity and a server-side role/scope check. Deny by default.
2. **Contractor credentials.** The current model defaults PIN to `0000` and stores PINs as plaintext. Replace this with a one-way password hash, remove default credentials, add rate limiting/lockout, and migrate existing accounts safely. Do not expose a contractor list with private fields to unauthenticated users.
3. **Project mutation endpoints.** Project create/update/delete and contractor assignment/update routes need authorization checks and explicit validation of allowed fields.
4. **Evidence uploads.** Validate file size, extension, MIME/content signature, and image decoding; generate server-side filenames; prevent path traversal; store files outside the public web root or behind authenticated download endpoints. Do not expose bills or unmoderated evidence through a blanket static directory.
5. **Database lifecycle.** Replace import-time schema creation with reviewed migrations for production. Configure the database URL through environment variables and exclude local database files and real uploads from source control.
6. **CORS and deployment secrets.** Configure allowed origins per environment; never use wildcard origins with credentials. Store secrets in deployment secret storage, not source control.
7. **Public data minimization.** Separate public, reviewed fields from internal data. Never return citizen contact details, private submissions, precise reporter coordinates, or unreviewed evidence from public endpoints.
8. **Audit trail.** Record actor, action, target record, timestamp, and relevant before/after changes for privileged mutations. Restrict audit log access.

## Release checks

- Test unauthenticated requests against every write endpoint; expect 401/403.
- Test cross-ward and cross-contractor access; expect 403/404 without leaking data.
- Verify public endpoints expose only approved records and fields.
- Verify upload validation and private-file access controls.
- Test migration on a copy of the database and rehearse backup restoration.
- Set production CORS origins explicitly and verify HTTPS.
- Review dependencies and run frontend build plus backend tests in CI.
- Publish a correction/contact policy and privacy notice before accepting citizen reports.

## Scope of this integration branch

The branch adds environment-based API/CORS configuration and integration documentation. It does **not** implement the full authentication, authorization, private upload, migration, or moderation system. Do not treat it as production-ready until those items are implemented and tested.
