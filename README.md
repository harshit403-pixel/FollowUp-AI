# FollowUp AI

Healthcare follow-up coordination MVP: clinician instructions → AI-drafted, source-linked plan → human approval → tasks on an interactive calendar with persistent checklists. **Synthetic demo data only.**

## Status

| Phase | State |
|---|---|
| 2. Server foundation (models, auth, API, seed) | Written, **not yet installed/type-checked/run** |
| 3. Client UI (pages, calendar, checklist, dashboard) | Files present; **not yet built or opened in a browser** |
| 4. UI ↔ API wiring | Services call the real API; **untested** |
| 5. Gemini plan generation | Implemented; requires `GEMINI_API_KEY`, not yet runtime-tested |
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

## AI configuration and patient portal

Set `GEMINI_API_KEY` in `server/.env`; `GEMINI_MODEL` defaults to `gemini-3.8-flash`. Creating a plan from clinician instructions attempts generation immediately. Staff can inspect and edit the draft, save changes, and a coordinator must approve it before tasks are activated. If generation fails, the saved plan remains available and staff can retry from the plan page.

The AI is instructed not to invent clinical tasks or dates. The server validates the structured response with Zod, rejects dates unless the exact ISO date appears in the original instructions, verifies each task's source excerpt, retries once, and flags missing dates or unverifiable excerpts for human review. A 20-day horizon is organizational only when the clinician's instructions explicitly ask for it; the model does not create a made-up task for every day. Relative timing stays unscheduled until staff confirm it.

Creating a synthetic patient generates a private read-only `/portal/<token>` link. Share it only with the intended demo patient; anyone possessing the link can view that patient's approved plan. The portal shows approved tasks and dates but cannot change completion status. This token-link approach is for the synthetic MVP, not a substitute for production patient identity verification, access revocation, and a privacy/security review.

## Design notes

- Task status (Upcoming / Due Today / Overdue / Completed / Needs Review / Closed) is **derived** from stored fields, never stored, so counts cannot drift. Today's date uses `APP_TIMEZONE` (default `Asia/Kolkata`).
- Tasks without a confirmed date are never placed on the calendar; they appear in `needsScheduling`.
- `originalInstructions` is immutable. Approval snapshots the draft into `approvedVersions` and creates tasks atomically-claimed (no double approval).
- Only coordinators can approve plans or close tasks. Drafts with open flags need `acknowledgeFlags: true` to approve.

## API (all under `/api/v1`, Bearer JWT except login)

`POST /auth/login` · `GET /auth/me` · `GET /dashboard` · `POST|GET /patients` · `GET /patients/:id` · `POST /patients/:id/contact-attempts` · `POST /follow-up-plans` · `GET /follow-up-plans/:id` · `PUT /follow-up-plans/:id/draft` · `POST /follow-up-plans/:id/generate` (Gemini draft generation) · `POST /follow-up-plans/:id/approve` · `POST /follow-up-plans/:id/notes` · `GET /follow-up-tasks?status&patientId&planId&q` · `PATCH /follow-up-tasks/:id` · `GET /calendar?month=YYYY-MM`

## Client setup

```bash
cd client
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run typecheck && npm run dev   # http://localhost:3000
```
