# Security Specification — MittiMitra - SoilGuard Firestore Rules

## 1. Data Invariants
1. Every document in `/responses/{responseId}` must belong to an authenticated, email-verified user (`authorUid == request.auth.uid`) and start in `status == 'pending'`.
2. Respondent roles are strictly constrained to `'Student'`, `'Teacher'`, or `'Other'`, with bounded string lengths on every text field (`message`, optional `advice`, optional `problemsFaced`, and optional `whatCanBeDone` <= 500 chars; optional compressed `problemImage` and `ecoActionImage` <= 160,000 chars matching image base64 pattern) and integer bounds `1..5` on `soilAwarenessRating`.
3. `createdAt` and `updatedAt` must always equal `request.time`; `authorUid` and `createdAt` are immutable after creation.
4. Once an admin marks a response `status == 'reviewed'`, the original author can no longer edit it (Terminal State Locking).
5. Non-admin users can only `get` or `list` their own `/responses` documents (`resource.data.authorUid == request.auth.uid`); only verified admins (`radhaggar2008@gmail.com` or `/admins/{uid}`) can list and review all responses across students, teachers, and others.
6. Public aggregate counts in `/stats/summary` contain zero PII and can only be incremented atomically alongside a newly created `/responses/{lastResponseId}` document (`existsAfter(...)`).

## 2. Adversarial "Dirty Dozen" Test Payloads
1. **Unauthenticated Create**: `{ name: "Riya", role: "Student", ... }` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Admin email `radhaggar2008@gmail.com` with `email_verified: false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing**: User A sends `authorUid: "user-B"` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Valid payload + `isVerified: true` -> `PERMISSION_DENIED` (`hasOnly` check rejects ghost field).
5. **Pre-Approved Status Escalation**: Create with `status: "reviewed"` by student -> `PERMISSION_DENIED`.
6. **Client Timestamp Tampering**: Create with `createdAt: "2020-01-01"` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: Document ID > 128 chars or containing `$` / `/` -> `PERMISSION_DENIED` (`isValidId`).
8. **Message Resource Exhaustion**: `message` string > 500 chars -> `PERMISSION_DENIED`.
9. **Blanket List Scraping**: Non-admin executes `getDocs(collection(db, 'responses'))` without `where('authorUid', '==', uid)` -> `PERMISSION_DENIED`.
10. **Cross-User Read**: Student A calls `getDoc(doc(db, 'responses', studentBDocId))` -> `PERMISSION_DENIED`.
11. **Post-Review Edit Bypass**: Student updates `message` after `status == 'reviewed'` -> `PERMISSION_DENIED`.
12. **Fake Counter Inflation**: Increment `/stats/summary` without creating a matching `/responses/{lastResponseId}` in the same batch -> `PERMISSION_DENIED` (`existsAfter` check fails).
