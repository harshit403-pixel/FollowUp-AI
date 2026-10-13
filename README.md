# FollowUp AI

Healthcare follow-up coordination MVP: clinician instructions → AI-drafted, source-linked plan → human approval → tasks on an interactive calendar with persistent checklists. **Synthetic demo data only.**

## Status

| Phase | State |
|---|---|
| 2. Server foundation (models, auth, API, seed) | Written, **not yet installed/type-checked/run** |
| 3. Client UI (pages, calendar, checklist, dashboard) | Files present; **never installed, built or opened in a browser** |
| 4. UI ↔ API wiring | Services call the real API; **untested** |
| 5. Gemini plan generation | Not started (`POST /generate` returns 501) |
| 6. End-to-end testing | Not started |

## Server setup

```bash
cd server
cp .env.example .env        # fill in MONGODB_URI (Atlas) and a long JWT_SECRET
npm install
npm run seed                # WIPES the database, loads synthetic demo data
npm run dev                 # http://localhost:4000/api/v1
npm run typecheck && npm test
```

Demo logins (password `Demo#Pass123`): `coordinator@demo.test` (can approve plans and close tasks), `staff@demo.test`.

## Design notes

- Task status (Upcoming / Due Today / Overdue / Completed / Needs Review / Closed) is **derived** from stored fields, never stored, so counts cannot drift. Today's date uses `APP_TIMEZONE` (default `Asia/Kolkata`).
- Tasks without a confirmed date are never placed on the calendar; they appear in `needsScheduling`.
- `originalInstructions` is immutable. Approval snapshots the draft into `approvedVersions` and creates tasks atomically-claimed (no double approval).
- Only coordinators can approve plans or close tasks. Drafts with open flags need `acknowledgeFlags: true` to approve.

## API (all under `/api/v1`, Bearer JWT except login)

`POST /auth/login` · `GET /auth/me` · `GET /dashboard` · `POST|GET /patients` · `GET /patients/:id` · `POST /patients/:id/contact-attempts` · `POST /follow-up-plans` · `GET /follow-up-plans/:id` · `PUT /follow-up-plans/:id/draft` · `POST /follow-up-plans/:id/generate` (Phase 5) · `POST /follow-up-plans/:id/approve` · `POST /follow-up-plans/:id/notes` · `GET /follow-up-tasks?status&patientId&planId&q` · `PATCH /follow-up-tasks/:id` · `GET /calendar?month=YYYY-MM`

## Client setup

```bash
cd client
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run typecheck && npm run dev   # http://localhost:3000
```
