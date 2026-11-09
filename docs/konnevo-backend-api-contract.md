# konnevo backend API contract (new and changed endpoints)

For the backend developer. Written from the frontend code in step 13 (`konnevo-step13-core-analytics.zip`), so every path, field name and error code below is what the frontend **already sends and expects**. The JSON examples were produced by running the frontend's own mock API (the same mock the frontend self-test checks with Zod), so they match the code exactly. Companion file: `konnevo-api-examples.json` (all examples, machine readable).

Base architecture: Architecture v3.1 (Node 24, Express, TypeScript, Better Auth, Prisma, Neon PostgreSQL, Cloudinary). Anything here that is not in v3.1 is marked **NEW**; anything where this file and v3.1 disagree is marked **CHANGE**.

---

## 0. Conventions (apply to every endpoint)

| Topic | Rule |
|---|---|
| Format | JSON in and out (`Content-Type: application/json`), except file uploads (`multipart/form-data`) and the CSV export. |
| Session | httpOnly, Secure, SameSite=Lax cookie. The frontend sends `credentials: "include"` on every call. |
| Same site (important) | The web app and the API must be on the **same site** (one parent domain such as `app.konnevo.com` and `api.konnevo.com`, or a Next.js `/api` rewrite). Reason: the `/core/*` pages check the role **on the Next.js server**, which calls `GET /api/auth/me` with the browser's cookie. If the cookie is not sent to the Next.js server, nobody can open the Core admin. |
| Dates | Instants: ISO-8601 UTC with `Z`, e.g. `2026-10-30T07:42:01.548Z`. Dates: `YYYY-MM-DD`. Months: `YYYY-MM`. Week start: Monday, UTC. |
| IDs | Opaque strings (UUID or any string). The frontend never parses them. |
| Empty values | Optional fields are **left out** or `null` (the frontend accepts both for the fields marked `nullish`/`?`). Never send `""` for an unset URL. |
| Field naming | **Responses are always camelCase.** Request bodies follow the existing groups: student-side older endpoints use `snake_case` (`current_password`, `event_id`, `my_role`, `member_ids`), the Core endpoints and experience use `camelCase` (`clubId`, `keepId`, `startMonth`). Each endpoint below states its exact body; do not "normalise" them. |
| Errors | Always `{ "error": { "code": "snake_case_code", "message": "Human sentence", "fields": { "fieldName": "message" } } }`. `fields` is `{}` when not a form error. The frontend shows `message`, and puts `fields.x` under the input called `x`. |
| Status codes used | 200, 201 (created), 204 (success, no body), 401 `unauthenticated`, 403 `forbidden`, 404 `not_found`, 409 (conflict, see per endpoint), 422 `validation_error`, 429 `rate_limited`. |
| Core pagination | `?page=1&pageSize=10`. `page` is 1-based, `pageSize` default 10, **max 200** (the frontend asks for 200 to fill dropdowns and to find duplicate college names). Response: `{ "items": [], "page": 1, "pageSize": 10, "total": 41 }`. CHANGE: the message said "page and limit"; the frontend sends `pageSize`. Either accept `pageSize` (preferred, no frontend change) or tell us and we change one line in `src/lib/services/superadmin.ts`. |
| Privacy | Core and club-admin endpoints return **counts and labels only**: no student emails, phone numbers, certificates or proof URLs. |

### Error codes the frontend knows

| Code | Status | Used by |
|---|---|---|
| `unauthenticated` | 401 | any call without a valid session |
| `forbidden` | 403 | wrong role, e.g. a student calling `/api/superadmin/*` |
| `not_found` | 404 | unknown id, or not yours |
| `validation_error` | 422 | bad body; fill `fields` |
| `invalid_credentials` | 401 | login (wrong email, wrong password or wrong role: same message, never say which) |
| `admin_not_approved` | 403 | club-admin login for an email not on `admin_allowlist` |
| `club_has_admin` | 409 | add admin to a club that has one |
| `email_already_admin` | 409 | that email already administers another club |
| `event_expired` | 409 | interested / create team on a past event |
| `already_in_team` | 409 | a second team for the same event |
| `team_full` | 422 | more than 6 people in a team |
| `not_a_match` | 422 | inviting someone who is not a match for that event |
| `no_password` | 409 | **NEW** password change on an account that has no password yet |
| `rate_limited` | 429 | **NEW** too many attempts |

---

## 1. Answers to the questions in the message (A to I)

These are the decisions the frontend is built on. Change one and tell us which, and we change the frontend.

**A. Access**
1. **Core list.** `CORE_ADMIN_EMAILS` (comma separated, lower-case compare) is the source of truth. It is also stored as `users.role = 'core'`. On every successful sign-in, set `role = 'core'` if the verified email is in the list, and set it back to `student` if it is not (so removing an email from the settings demotes at the next sign-in). The `/api/superadmin/*` guard must **also** re-check the list on every request, so removing an email takes effect at once, even for a signed-in session.
2. **`GET /api/auth/me`** returns `user.role` as `student | club_admin | core` (section 3.1).
3. **Backend is the real protection.** Every `/api/superadmin/*` route: no session → `401 unauthenticated`; any role other than core → `403 forbidden` (404 also acceptable; the frontend shows its normal 404 page to non-core either way). Add a test for every route (section 6).
4. **Verified emails only.** Google: `email_verified === true`. GitHub: use the **primary verified** email from `GET /user/emails`, never the public profile email. If not verified, reject the sign-in. This applies to the core and club-admin allowlist checks too. Password sign-up users must have verified their email before role promotion.

**B. Endpoint paths.** All guesses are kept as written (see index in section 2). The three that differ from the message are listed in section 1.1.

**C. Overview numbers.** "Profiles completed": **add a field**: `profiles.completed_at TIMESTAMPTZ NULL`, set by the existing `POST /api/profile/complete` (the onboarding "finish" call). Count = rows where it is not null. Definitions of every number are in section 3.15.

**D. Events.** Columns, filters, CSV and the funnel are as in sections 3.17 to 3.19. Past and upcoming events are both included.

**E. Reports.**
- Type and target come from `target_type` (`event | user | project`) and `target_id`. The API returns a readable `target` string (event title, student name, project title) or `null` if it no longer exists.
- Statuses: `open`, `reviewing`, `resolved`, `dismissed` (the frontend uses these; if yours differ, send the list).
- **Store the note and the status history**: new table `report_status_history` (section 4). The detail page shows it.
- Deleted reporter or target: keep the report, set the reference to NULL, API returns `null`; the frontend prints "Deleted user".

**F. Clubs and admins.**
- Add admin = one `admin_allowlist` row. **One admin per club: refuse** with `409 club_has_admin` (to change the admin, remove then add). If the email already administers another club: `409 email_already_admin`.
- Email that has not signed up yet: **allowed**. Store the row; the person becomes `club_admin` at their first verified sign-in with the club-admin option. If a student account with that email already exists, set `role = 'club_admin'` and `club_id` immediately.
- Remove access: delete the row, set the person back to `student`, **delete their sessions** so the old cookie stops working. **The club and all its events stay** (events belong to the club, not to the admin).

**G. Colleges.**
- Duplicate highlighting is decided by the **frontend** (`src/lib/core/logic.ts`, `duplicateGroups`). The backend only returns the list. The frontend loads up to 200 colleges in one call for this.
- Merge rules (final): one database transaction; every student (`profiles.college_id`) and every club (`clubs.college_id`) of the merged colleges moves to the kept college; the merged college rows are deleted; **cannot be undone** (no un-merge). Recommended extra: keep the merged names as `college_aliases(name_key → college_id)` so a student who later types "PES" lands on the kept college.

**H. Audit.** Read-only. Filters: `actor` (email contains), `action` (exact), `from`/`to` (dates, inclusive). Action names: see section 1.1, item 2.

**I. Not included.** Confirmed: no suspending users, event approval, core notifications, or core edit/delete of events. Core is view-only except the five audited writes (add admin, remove admin, merge colleges, change report status, export CSV).

### 1.1 Differences between the message and the code (please read)

1. **Pagination parameter:** code sends `pageSize`, message said `limit` (see section 0).
2. **Audit action names:** the code uses `admin_added`, `admin_removed`, `colleges_merged`, `report_status_updated`, `events_exported`. The message listed `club_admin_added` and `club_admin_removed`. **Use the code names** unless the frontend is changed. Store them as plain text, not a database enum, so new actions can be added.
3. **Register-link clicks:** the frontend now calls `POST /api/events/:id/register-click` (new in step 13, section 3.7). Before this, the count could not be filled.

---

## 2. Endpoint index

| # | Method and path | Who | New / changed |
|---|---|---|---|
| 3.1 | `GET /api/auth/me` | any signed-in | CHANGE: `role` can be `core` |
| 3.2 | `POST /api/auth/login` | everyone | CHANGE: core signs in here too |
| 3.3 | `POST /api/auth/password/change` | signed-in with password | NEW |
| 3.4 | `GET /api/blocks`, `DELETE /api/blocks/:userId` | student | NEW (list, unblock) |
| 3.5 | `DELETE /api/account` | student | NEW |
| 3.6 | `GET/POST/PATCH/DELETE /api/experience[/:id]` | student | CHANGE: edit and delete added |
| 3.7 | `POST /api/events/:id/register-click` | student | NEW |
| 3.8 | `GET /api/teams` | student | CHANGE: `{ teams, invites }` |
| 3.9 | `POST /api/teams` | student | CHANGE: body fields |
| 3.10 | `PATCH /api/teams/:id`, `POST /api/teams/:id/respond` | student | NEW |
| 3.11 | `POST /api/events/:id/proof` | student | CHANGE: multipart, returns `attendanceId` |
| 3.12 | `GET /api/proofs/:attendanceId/url` | owner only | NEW |
| 3.13 | `GET /api/admin/overview` | club admin | CHANGE: not in v3.1 |
| 3.14 | `PATCH /api/admin/reports/:id` | club admin | NEW |
| 3.15 | `GET /api/superadmin/overview` | core | NEW |
| 3.16 | `GET /api/superadmin/analytics` | core | NEW (dashboards) |
| 3.17 | `GET /api/superadmin/events` | core | NEW |
| 3.18 | `GET /api/superadmin/events/export` | core | NEW |
| 3.19 | `GET /api/superadmin/events/:id` | core | NEW |
| 3.20 | `GET /api/superadmin/reports`, `GET/PATCH /api/superadmin/reports/:id` | core | NEW |
| 3.21 | `GET /api/superadmin/clubs` | core | NEW |
| 3.22 | `POST /api/superadmin/admins`, `DELETE /api/superadmin/admins/:id` | core | NEW |
| 3.23 | `GET /api/superadmin/colleges`, `POST /api/superadmin/colleges/merge` | core | NEW |
| 3.24 | `GET /api/superadmin/audit` | core | NEW |
| 3.25 | `POST /api/reports`, `POST /api/blocks/:userId` | student | in v3.1, frontend not wired yet (shape proposed here) |

Route order: register `GET /api/superadmin/events/export` **before** `GET /api/superadmin/events/:id`.

---

## 3. Endpoint details

### 3.1 `GET /api/auth/me`  (CHANGE)
Auth: any session. No body.

`200`, student:
```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Priya",
    "email": "student@konnevo.test",
    "role": "student",
    "hasPassword": true,
    "onboardingComplete": true
  }
}
```
`200`, club admin (has `clubName`):
```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000002",
    "name": "Tech Club",
    "email": "admin@techclub.test",
    "role": "club_admin",
    "hasPassword": true,
    "onboardingComplete": true,
    "clubName": "Tech Club"
  }
}
```
`200`, core:
```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000003",
    "name": "Core team",
    "email": "core@konnevo.test",
    "role": "core",
    "hasPassword": true,
    "onboardingComplete": true
  }
}
```
No session: `401` `unauthenticated`.

Rules: `role` is read from `users.role` (core is re-checked against `CORE_ADMIN_EMAILS`). `hasPassword` is false after a first Google/GitHub login until the person sets one. `onboardingComplete` = `profiles.completed_at IS NOT NULL` (students only; send `true` for club admin and core). `photoUrl` and `clubName` are left out when empty. Never return password hashes, tokens or provider ids.

### 3.2 `POST /api/auth/login`  (CHANGE)
Body: `{ "email": "string", "password": "string", "intent": "student" | "admin" }`

Success `200`: `{ "user": <same shape as 3.1> }` and `Set-Cookie`.

Example response (student):
```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Priya",
    "email": "student@konnevo.test",
    "role": "student",
    "hasPassword": true,
    "onboardingComplete": true
  }
}
```
Rules:
- A **core** user signs in with the normal form; `intent` is ignored for core. The login screen never offers a "core" choice.
- `intent: "admin"` for an email not on `admin_allowlist` (and not core): `403 admin_not_approved`.
- Wrong email, wrong password, or the account's role does not match `intent` (and is not core): `401 invalid_credentials`, same message every time.
- Rate limit by IP and by email (`429 rate_limited`).

### 3.3 `POST /api/auth/password/change`  (NEW)
Auth: signed in. Body (snake_case):
```json
{ "current_password": "old secret", "password": "new secret (min 8 characters)" }
```
`204` no body.

Validation error `422` (both fields wrong, example):
```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the form.",
    "fields": {
      "current_password": "That is not your current password",
      "password": "Use at least 8 characters"
    }
  }
}
```
Rules: `current_password` must match; `password` min 8 chars. If the account has no password yet (Google/GitHub only): `409 no_password` (the frontend uses `POST /api/auth/password/create` for that). Rate limit (suggest 5 per 15 minutes per user). On success, end all **other** sessions of that user and keep the current one. Never log either password.

### 3.4 `GET /api/blocks`, `DELETE /api/blocks/:userId`  (NEW)
Auth: student.

`GET` → `200`:
```json
{
  "blocked": [
    {
      "id": "10000000-0000-4000-8000-000000000006",
      "name": "Dev Gupta",
      "college": "SRM Institute of Science and Technology"
    }
  ]
}
```
`college` is left out if that person hides their college. Order: most recently blocked first.

`DELETE /api/blocks/:userId` → `204`. `404 not_found` when that person is not in your block list.

(Creating a block is `POST /api/blocks/:userId`, `204`, in v3.1; the frontend button is added later. A block hides both people from each other everywhere: people lists, suggestions, matches.)

### 3.5 `DELETE /api/account`  (NEW)
Auth: student only. Body: `{ "confirm": "DELETE" }` (the exact word, upper case).

`204` and clear the session cookie. Wrong or missing word:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Type DELETE to confirm.",
    "fields": {
      "confirm": "Type DELETE to confirm"
    }
  }
}
```
Club admins and core get `403 forbidden` (they are removed from the Core admin screens, not here).

Delete in one transaction, then clean files in a background job:
- Delete: user, profile, skills, projects (and Cloudinary images), experience, swipes, matches, event interests, register clicks, blocks (both directions), notification settings, sessions, attendance rows (and the private proof files in Cloudinary).
- Team membership: remove the person from teams. If they were the only accepted member, delete the team. Pending invites to them are deleted.
- **Reports stay.** Set `reports.reporter_id = NULL` where they reported, and `reports.target_id = NULL` where they were the target (keep `target_type`). The Core screens then show "Deleted user".
- Audit log rows are never deleted.

### 3.6 Experience  (CHANGE: edit and delete added)
Auth: student; every call only touches the caller's own rows (someone else's id → `404 not_found`).

Body for POST **and** PATCH (camelCase), the same full object:

| Field | Rule |
|---|---|
| `type` | `hackathon` \| `internship` \| `event` \| `other` |
| `title` | 2 to 80 characters |
| `organisation` | **required**, 2 to 100 characters |
| `startMonth` | `YYYY-MM` |
| `endMonth` | optional `YYYY-MM`, not before `startMonth`. **Left out = ongoing** |
| `description` | 0 to 500 characters (`""` allowed) |

- `GET /api/experience` → `200 { "experience": [ ... ] }`, newest `startMonth` first.
- `POST /api/experience` → `201 { "experience": { "id": "...", ...fields } }`
- `PATCH /api/experience/:id` → `200 { "experience": { ... } }`. **PATCH is a full replace**: the frontend always sends all fields. If `endMonth` is not in the body, set it to NULL (the person cleared it).
- `DELETE /api/experience/:id` → `204`.

POST example response:
```json
{
  "experience": {
    "type": "hackathon",
    "title": "Smart India Hackathon",
    "organisation": "Govt of India",
    "startMonth": "2026-03",
    "description": "Finalist.",
    "id": "94e8671c-4db0-4c59-b0a9-7a3292f176b1"
  }
}
```
PATCH example response:
```json
{
  "experience": {
    "type": "hackathon",
    "title": "Smart India Hackathon",
    "organisation": "Govt of India",
    "startMonth": "2026-03",
    "description": "Finalist, team lead.",
    "id": "94e8671c-4db0-4c59-b0a9-7a3292f176b1",
    "endMonth": "2026-04"
  }
}
```
Validation error `422` (field names are camelCase here):
```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the form.",
    "fields": {
      "organisation": "Enter the organisation or event"
    }
  }
}
```

### 3.7 `POST /api/events/:id/register-click`  (NEW)
Auth: student. No body. `204`.
Called (fire and forget) when a student taps **Register** on an event card or page; the link opens in a new tab regardless of the result.
- Upsert `event_register_clicks (event_id, user_id)`: create with `click_count = 1`, or increment.
- No session or not a student: `401`/`403`, harmless (the frontend ignores failures; for visitors it does not call at all).
- Unknown event: `404 not_found`. Past event: still count (`204`).
- **What "register-link clicks" means in every Core number:** the number of **distinct students** (rows) who clicked. `click_count` is kept only as a raw total. This keeps the rates (clicks ÷ interested) at or below 100%.

### 3.8 `GET /api/teams`  (CHANGE)
Auth: student. Returns my accepted teams and my pending invites together.
```json
{
  "teams": [],
  "invites": [
    {
      "id": "f1a47039-c36e-4544-b9bb-819469ac885f",
      "teamName": "Byte Benders",
      "event": {
        "id": "ux-open-house",
        "title": "UX Open House",
        "startDate": "2027-02-20"
      },
      "invitedBy": {
        "id": "10000000-0000-4000-8000-000000000050",
        "name": "Vikram Iyer"
      },
      "role": "Frontend"
    }
  ]
}
```
Accepted team (shape of `teams[]`; this one is the result of accepting the invite above):
```json
{
  "team": {
    "id": "f1a47039-c36e-4544-b9bb-819469ac885f",
    "name": "Byte Benders",
    "event": {
      "id": "ux-open-house",
      "title": "UX Open House",
      "startDate": "2027-02-20"
    },
    "myRole": "Frontend",
    "members": [
      {
        "id": "10000000-0000-4000-8000-000000000050",
        "name": "Vikram Iyer",
        "role": "Backend",
        "accepted": true
      },
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Priya",
        "role": "Frontend",
        "accepted": true
      }
    ],
    "status": "registered",
    "proof": "none"
  }
}
```
Field rules:
- `teams[]` = teams where I am an **accepted** member. `invites[]` = teams where I am invited and have not answered. `invites[].id` is the **team id** (used in `/respond`).
- `status`: only `registered` or `attended`. The **API** decides: `attended` once I have uploaded proof for that event. The frontend never computes it.
- `proof`: `none` | `uploaded` | `confirmed` (my own proof). `attendanceId` is present only once something is uploaded.
- `members[].accepted` is false while an invite is waiting. `endDate` left out when the event is one day.

### 3.9 `POST /api/teams`  (CHANGE)
Auth: student. Body (snake_case):
```json
{ "name": "Byte Benders", "event_id": "ux-open-house", "my_role": "Frontend", "member_ids": ["<matched user id>"] }
```
`201 { "team": <team as above> }`. The creator is an accepted member with `my_role`; every `member_ids` person becomes a **pending invite** with role `Teammate` and `invitedBy` = creator. Notify them (in-app and email).

Rules and errors:
| Check | Result |
|---|---|
| `name` 2 to 60 chars, `my_role` 2 to 40 chars | `422 validation_error`, `fields.name` / `fields.my_role` |
| event not found | `404 not_found` |
| event already over | `409 event_expired` |
| creator already in a team for that event | `409 already_in_team` |
| more than 5 `member_ids` (team max 6 with creator) | `422 team_full`, `fields.member_ids` |
| any id is not one of my **matches for this event** | `422 not_a_match`, `fields.member_ids` |
| one person may be in only one team per event | `409 already_in_team` when they accept (see 3.10) |

### 3.10 `PATCH /api/teams/:id` and `POST /api/teams/:id/respond`  (NEW)
`PATCH` Body (snake_case, both optional): `{ "name": "Byte Benders 2", "my_role": "Backend" }` → `200 { "team": ... }`. Any accepted member may rename; `my_role` changes only the caller's own role. Not an accepted member: `404 not_found`. Same length rules as 3.9.

`POST /api/teams/:id/respond` Body `{ "accept": true | false }`. Caller must have a pending invite (else `404 not_found`).
- accept → `200 { "team": ... }` (`409 already_in_team` if I am already in another team for that event).
- decline → `200 {}` and delete the pending membership.

### 3.11 `POST /api/events/:id/proof`  (CHANGE: multipart)
Auth: student. `multipart/form-data` with one part named **`file`**.

- Allowed: JPG, PNG, WebP or PDF; max 10 MB. Check the **file contents** (magic bytes), not just the declared type.
- Stores the file in **private** Cloudinary, upserts `attendance (event_id, user_id)`, sets the attendance to attended (v1 rule: **an upload marks the student as attended**, which also makes their teams for that event `attended`).
- A new upload **replaces** the old file and keeps the same `attendanceId`; delete the old Cloudinary asset.

`201`:
```json
{ "proof": "uploaded", "attendanceId": "string" }
```
Errors: `404 not_found` (event), `422 validation_error` with `fields.file` (missing, wrong type, too big), `401`.
Return the file error as a message the person can read ("Use a JPG, PNG, WebP image or a PDF.", "The file must be under 10 MB.").

### 3.12 `GET /api/proofs/:attendanceId/url`  (NEW)
Auth: **only the student who uploaded it.** `200 { "url": "<signed link valid about 5 minutes>" }`. Everyone else, including club admins and core: `403 forbidden`. Unknown id: `404`. Certificates are private; never put a public URL in any response.

### 3.13 `GET /api/admin/overview`  (CHANGE: not in v3.1)
Auth: club admin (role `club_admin`; anyone else `403`). The v3.1 architecture only lists `/api/admin/events`; the club dashboard needs this one call. No body. `200` (events trimmed to 1 here):
```json
{
  "clubName": "Tech Club",
  "stats": {
    "events": 2,
    "upcoming": 1,
    "interested": 51
  },
  "events": [
    {
      "id": "open-source-meetup",
      "title": "Open Source Meetup",
      "type": "meetup",
      "mode": "online",
      "startDate": "2026-10-02",
      "place": "Online",
      "registrationUrl": "https://example.com/open-source-meetup",
      "description": "Learn how to make your first open source contribution.",
      "clubName": "Tech Club",
      "interestedCount": 9,
      "expired": true
    }
  ],
  "reports": [
    {
      "id": "report-1",
      "reason": "This project is not the person's own work.",
      "subject": "Project: PlantPal",
      "createdAt": "2026-10-30T07:43:42.169Z",
      "status": "open"
    }
  ]
}
```
- `clubName`: the admin's club.
- `stats.events` = all events of the club; `upcoming` = events with `endDate ?? startDate` today or later; `interested` = total interested across the club's events.
- `events`: the club's events, **soonest first, past ones included**. Event shape is the same `EventItem` used by `GET /api/events/:id` (`id, title, type, mode, startDate, endDate?, place, registrationUrl, description, posterUrl?, clubName, interestedCount, expired`).
- `reports`: reports this club should see (reports about its events; the mock also shows a project report). Status shown to a club admin is only `open` or `resolved`: map `open` and `reviewing` → `open`; `resolved` and `dismissed` → `resolved`. `subject` is a readable label such as `Event: HackFest 2026` or `Project: PlantPal`.
- Club admin event writes stay in v3.1: `POST /api/admin/events` (multipart), `PATCH /api/admin/events/:id` (multipart), `DELETE /api/admin/events/:id`. Form parts: `title, type, mode, start_date, end_date?, place, registration_url, description, poster?` (file). Events publish at once: no approval.
- There are **no admin proof endpoints** (the old "admin proofs" screen was removed).

### 3.14 `PATCH /api/admin/reports/:id`  (NEW)
Auth: club admin, only for reports about their own club's events (else `404`). Body `{ "status": "resolved" }` → `204`. Write a `report_status_history` row (by = the club admin's email).

### 3.15 `GET /api/superadmin/overview`  (NEW)
Auth: core. No query.
```json
{
  "totals": {
    "users": 1350,
    "newUsersThisWeek": 61,
    "profilesCompleted": 1067,
    "colleges": 8,
    "clubs": 10,
    "liveEvents": 27,
    "interestedClicks": 5643,
    "registerClicks": 2736,
    "teamsFormed": 477,
    "matches": 2123,
    "proofsUploaded": 345,
    "proofsConfirmed": 243,
    "openReports": 3
  },
  "topEvents": [
    {
      "id": "ev-19",
      "title": "Startup Pitch Night Edition 2",
      "interested": 245
    },
    {
      "id": "ev-38",
      "title": "Robotics Challenge Edition 3",
      "interested": 239
    }
  ],
  "recentAudit": [
    {
      "id": "aud-1",
      "at": "2026-10-20T10:02:00Z",
      "actor": "core@konnevo.test",
      "action": "admin_added",
      "target": "tech@college.edu → Tech Club"
    },
    {
      "id": "aud-2",
      "at": "2026-10-20T10:05:00Z",
      "actor": "core@konnevo.test",
      "action": "admin_added",
      "target": "ai@techuni.edu → AI Club"
    }
  ]
}
```
(`topEvents` and `recentAudit` trimmed to 2 here; return **5** of each.)

Definitions:

| Field | Definition |
|---|---|
| `users` | students: `users` where `role = 'student'` (not club admins, not core) |
| `newUsersThisWeek` | students created since Monday 00:00 UTC of this week |
| `profilesCompleted` | `profiles.completed_at IS NOT NULL` |
| `colleges`, `clubs` | row counts |
| `liveEvents` | events whose `COALESCE(end_date, start_date) >= today` |
| `interestedClicks` | rows in `event_interests` (all events) |
| `registerClicks` | rows in `event_register_clicks` (distinct student-event pairs, see 3.7) |
| `teamsFormed` | rows in `teams` |
| `matches` | rows in `matches` |
| `proofsUploaded` | attendance rows with a proof file |
| `proofsConfirmed` | attendance rows with `status = 'confirmed'`. In v1 uploads count as attended and there is no confirmation step, so this may be `0`; **see open decision 1 in section 7** |
| `openReports` | reports with status `open` |
| `topEvents` | 5 events by interested count, highest first |
| `recentAudit` | the 5 newest audit rows |

### 3.16 `GET /api/superadmin/analytics`  (NEW, the dashboards page)
Auth: core. Query (all optional):

| Param | Values | Default |
|---|---|---|
| `weeks` | `4`, `8`, `12` (anything else behaves as 8) | `8` |
| `college` | a college id | all |
| `type` | `hackathon` `meetup` `conference` `workshop` | all |

Response (arrays trimmed in this example; `byCollege` has one row per college, `events` has one row per event in scope):
```json
{
  "filters": {
    "weeks": 4,
    "college": null,
    "type": null
  },
  "kpis": [
    {
      "key": "students",
      "label": "Students",
      "unit": "count",
      "value": 1350,
      "previous": 1089,
      "spark": [
        62,
        80,
        58,
        61
      ]
    },
    {
      "key": "signups",
      "label": "New students",
      "unit": "count",
      "value": 261,
      "previous": 291,
      "spark": [
        62,
        80,
        58,
        61
      ]
    },
    {
      "key": "interested",
      "label": "Interested clicks",
      "unit": "count",
      "value": 1320,
      "previous": 1151,
      "spark": [
        339,
        410,
        290,
        281
      ]
    },
    {
      "key": "registerRate",
      "label": "Register-click rate",
      "unit": "percent",
      "value": 51,
      "previous": 47.6,
      "spark": [
        35.4,
        42.9,
        66.9,
        65.1
      ]
    },
    {
      "key": "matchRate",
      "label": "Match rate",
      "unit": "percent",
      "value": 39,
      "previous": 34.5,
      "spark": [
        38.3,
        31.2,
        50.3,
        39.5
      ]
    },
    {
      "key": "attendanceRate",
      "label": "Attendance rate",
      "unit": "percent",
      "value": 11.9,
      "previous": 13.1,
      "spark": [
        15.8,
        11.9,
        8.8,
        12.6
      ]
    }
  ],
  "trend": [
    {
      "weekStart": "2026-10-05",
      "signups": 62,
      "interested": 339,
      "registerClicks": 120,
      "matches": 130
    },
    {
      "weekStart": "2026-10-12",
      "signups": 80,
      "interested": 410,
      "registerClicks": 176,
      "matches": 128
    },
    {
      "weekStart": "2026-10-19",
      "signups": 58,
      "interested": 290,
      "registerClicks": 194,
      "matches": 146
    },
    {
      "weekStart": "2026-10-26",
      "signups": 61,
      "interested": 281,
      "registerClicks": 183,
      "matches": 111
    }
  ],
  "funnel": [
    {
      "key": "interested",
      "label": "Interested",
      "value": 5643
    },
    {
      "key": "register",
      "label": "Register-link clicks",
      "value": 2736
    },
    {
      "key": "teams",
      "label": "Teams formed",
      "value": 477
    },
    {
      "key": "attended",
      "label": "Attended (certificate uploaded)",
      "value": 345
    }
  ],
  "byType": [
    {
      "type": "hackathon",
      "events": 11,
      "interested": 1697,
      "registerClicks": 837
    },
    {
      "type": "meetup",
      "events": 10,
      "interested": 1409,
      "registerClicks": 673
    },
    {
      "type": "conference",
      "events": 10,
      "interested": 1363,
      "registerClicks": 667
    },
    {
      "type": "workshop",
      "events": 10,
      "interested": 1174,
      "registerClicks": 559
    }
  ],
  "byMode": [
    {
      "mode": "offline",
      "events": 27,
      "interested": 3679
    },
    {
      "mode": "online",
      "events": 14,
      "interested": 1964
    }
  ],
  "byCollege": [
    {
      "id": "col-3",
      "name": "PES University, Bengaluru",
      "students": 332,
      "events": 8,
      "interested": 1165
    },
    {
      "id": "col-2",
      "name": "Tech University",
      "students": 366,
      "events": 8,
      "interested": 1121
    },
    {
      "id": "col-1",
      "name": "Sample College, Bengaluru",
      "students": 412,
      "events": 9,
      "interested": 1101
    },
    {
      "id": "col-7",
      "name": "XYZ College",
      "students": 54,
      "events": 4,
      "interested": 686
    },
    {
      "id": "col-6",
      "name": "Metro College",
      "students": 26,
      "events": 4,
      "interested": 676
    },
    {
      "id": "col-8",
      "name": "xyz college of engg",
      "students": 12,
      "events": 4,
      "interested": 456
    },
    {
      "id": "col-5",
      "name": "City Institute",
      "students": 148,
      "events": 4,
      "interested": 438
    }
  ],
  "heatmap": {
    "rows": [
      {
        "id": "col-3",
        "name": "PES University, Bengaluru"
      },
      {
        "id": "col-2",
        "name": "Tech University"
      },
      {
        "id": "col-1",
        "name": "Sample College, Bengaluru"
      },
      {
        "id": "col-7",
        "name": "XYZ College"
      },
      {
        "id": "col-6",
        "name": "Metro College"
      },
      {
        "id": "col-8",
        "name": "xyz college of engg"
      }
    ],
    "cols": [
      "hackathon",
      "meetup",
      "conference",
      "workshop"
    ],
    "cells": [
      [
        280,
        312,
        385,
        188
      ],
      [
        0,
        679,
        0,
        442
      ],
      [
        475,
        221,
        120,
        285
      ],
      [
        366,
        0,
        320,
        0
      ],
      [
        314,
        0,
        362,
        0
      ],
      [
        0,
        197,
        0,
        259
      ]
    ]
  },
  "events": [
    {
      "id": "ev-1",
      "title": "HackFest 2026",
      "type": "hackathon",
      "interested": 60,
      "registerClicks": 19,
      "teams": 4
    },
    {
      "id": "ev-2",
      "title": "Founders Meetup 2026",
      "type": "meetup",
      "interested": 188,
      "registerClicks": 61,
      "teams": 15
    }
  ],
  "monthly": [
    {
      "month": "2026-09",
      "events": 7
    },
    {
      "month": "2026-10",
      "events": 8
    },
    {
      "month": "2026-11",
      "events": 7
    },
    {
      "month": "2026-12",
      "events": 8
    },
    {
      "month": "2027-01",
      "events": 8
    },
    {
      "month": "2027-02",
      "events": 3
    }
  ],
  "reportsByStatus": [
    {
      "status": "open",
      "count": 2
    },
    {
      "status": "reviewing",
      "count": 2
    },
    {
      "status": "resolved",
      "count": 1
    },
    {
      "status": "dismissed",
      "count": 1
    }
  ],
  "clubCoverage": {
    "withAdmin": 7,
    "withoutAdmin": 3
  }
}
```
Exact meaning of every block (all counts, no personal data):

| Block | Definition |
|---|---|
| `filters` | echo of what was applied (`college`/`type` are `null` when not set) |
| `kpis` | **Always these 6, in this order and with these keys and labels**: `students` "Students", `signups` "New students", `interested` "Interested clicks", `registerRate` "Register-click rate" (`unit: "percent"`), `matchRate` "Match rate" (`percent`), `attendanceRate` "Attendance rate" (`percent`). `value` = this period (the last `weeks` weeks); `previous` = the `weeks` weeks right before. For `students`: `value` = total students now, `previous` = total minus new students in the period. Percent values: one decimal, e.g. `49.4`. `spark` = one number per week of the period (counts, or the weekly percent). |
| Rates | `registerRate` = register clicks ÷ interested clicks; `matchRate` = matches ÷ interested clicks; `attendanceRate` = attended (proofs uploaded) ÷ register clicks. All counted by the date the row was created, over the events in scope; 0 when the divisor is 0. |
| `trend` | exactly `weeks` rows, oldest first, **one row for every week even if all zero**. `weekStart` = Monday `YYYY-MM-DD`. `signups` (students created), `interested`, `registerClicks`, `matches` created that week. |
| `funnel` | always 4 rows, in order: `interested` "Interested", `register` "Register-link clicks", `teams` "Teams formed", `attended` "Attended (certificate uploaded)". **All time**, events in scope. |
| `byType` | always 4 rows in the order hackathon, meetup, conference, workshop (zeros included): `events`, `interested`, `registerClicks`. Events in scope. |
| `byMode` | always 2 rows in the order `offline`, `online`: `events`, `interested`. |
| `byCollege` | one row per college, **ignores the `college` filter** (so a bar can be clicked to choose one) but respects `type`. Sorted by `interested` descending. `students` = students of that college; `events` = events of clubs in that college. |
| `heatmap` | `rows` = up to 6 colleges from `byCollege` (in that order) that have at least one event; `cols` = always the 4 types in the order above; `cells[row][col]` = interested clicks for that college and type, over all events (ignores both filters). |
| `events` | every event in scope (not paged): `id, title, type, interested, registerClicks, teams`. If you ever have more than 500, return the top 500 by `interested`. |
| `monthly` | events in scope grouped by **start month**, oldest first, **`month` is `YYYY-MM`** (the screen formats it). Months without events are left out. |
| `reportsByStatus` | always 4 rows in the order open, reviewing, resolved, dismissed; **ignores both filters**. |
| `clubCoverage` | clubs with and without an admin; respects `college`, ignores `type`. |

An event belongs to a college through its club (`events.club_id → clubs.college_id`). If a filter matches nothing, return the same shape with zeros and empty `events`/`monthly` (never an error).

### 3.17 `GET /api/superadmin/events`  (NEW)
Auth: core. Query: `q` (title contains, case-insensitive), `college` (id), `club` (id), `type`, `mode`, `from`, `to` (`YYYY-MM-DD`, compared with the event's start date, inclusive), `page`, `pageSize`. Unknown `type`/`mode` value: `422`. Sorted by `startDate` newest first. Includes past and upcoming.
```json
{
  "items": [
    {
      "id": "ev-41",
      "title": "Mobile Dev Day Edition 3",
      "club": "Tech Club",
      "college": "Sample College, Bengaluru",
      "type": "hackathon",
      "mode": "offline",
      "startDate": "2027-02-12",
      "endDate": "2027-02-13",
      "interested": 198,
      "registerClicks": 89,
      "teams": 15
    },
    {
      "id": "ev-37",
      "title": "Web3 Workshop Edition 3",
      "club": "Open Source Guild",
      "college": "PES University, Bengaluru",
      "type": "hackathon",
      "mode": "online",
      "startDate": "2027-01-27",
      "endDate": "2027-01-28",
      "interested": 165,
      "registerClicks": 91,
      "teams": 22
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 11
}
```
`interested` = interested count; `registerClicks` as in 3.7; `teams` = teams for that event. `endDate` is `null` for one-day events.

### 3.18 `GET /api/superadmin/events/export`  (NEW)
Auth: core. Same filters as 3.17 (no `page`). Response is **not JSON**:
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="konnevo_events_YYYY-MM-DD.csv"` (date = today, server date)
- Header row, exactly: `Title,Club,College,Type,Mode,Start date,End date,Interested,Register-link clicks,Teams formed`
- One row per matching event (all pages), same column order.

Example (first lines):
```
Title,Club,College,Type,Mode,Start date,End date,Interested,Register-link clicks,Teams formed
HackFest 2026,Tech Club,"Sample College, Bengaluru",hackathon,online,2026-09-05,2026-09-06,60,19,4
Startup Pitch Night 2026,DS Club,Metro College,hackathon,offline,2026-09-21,2026-09-22,81,51,8
```
Rules: quote cells containing `,` `"` or a newline and double the quotes. **CSV injection:** if a text cell starts with `=`, `+`, `-` or `@`, prefix it with a single quote `'` (club admins type these titles). No personal data. Write an audit row `events_exported`, target `"<N> events"`.

### 3.19 `GET /api/superadmin/events/:id`  (NEW)
Auth: core. `404 not_found` for an unknown id.
```json
{
  "id": "ev-1",
  "title": "HackFest 2026",
  "club": "Tech Club",
  "college": "Sample College, Bengaluru",
  "type": "hackathon",
  "mode": "online",
  "startDate": "2026-09-05",
  "endDate": "2026-09-06",
  "place": "https://meet.example.org/konnevo",
  "registrationUrl": "https://events.example.org/register/1",
  "posterUrl": null,
  "funnel": {
    "interested": 60,
    "registerClicks": 19,
    "teams": 4,
    "matches": 13,
    "proofsUploaded": 2,
    "proofsConfirmed": 2
  }
}
```
`funnel` = counts only: `interested`, `registerClicks`, `teams`, `matches` (mutual matches for this event), `proofsUploaded`, `proofsConfirmed` (see 3.15). `posterUrl` is `null` or a public poster URL. **No names, no proof links.**

### 3.20 Reports  (NEW)
`GET /api/superadmin/reports` Query: `type` (`event|user|project`), `status`, `page`, `pageSize`. Newest first.
```json
{
  "items": [
    {
      "id": "rep-6",
      "createdAt": "2026-10-10T08:15:00Z",
      "type": "project",
      "target": "Smart Attendance",
      "reason": "Offensive description",
      "status": "open",
      "reporter": "Dev S."
    },
    {
      "id": "rep-1",
      "createdAt": "2026-10-09T09:12:00Z",
      "type": "event",
      "target": "AI Build Sprint 2026",
      "reason": "Wrong date shown",
      "status": "open",
      "reporter": "Arjun K."
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 3
}
```
- `target`: readable label (event title, student name, project title) or `null` if deleted. `reporter`: the reporter's display name, or `null` if they deleted their account.

`GET /api/superadmin/reports/:id` → `200`, same row plus `targetSummary` and `history`:
```json
{
  "id": "rep-2",
  "createdAt": "2026-10-08T17:40:00Z",
  "type": "event",
  "target": "Data Science Day 2026",
  "targetSummary": "Event by DS Club, Metro College",
  "reason": "Looks like spam",
  "status": "reviewing",
  "reporter": "Meera R.",
  "history": [
    {
      "status": "open",
      "at": "2026-10-08T17:40:00Z",
      "by": "Meera R."
    },
    {
      "status": "reviewing",
      "at": "2026-10-09T08:00:00Z",
      "by": "core@konnevo.test",
      "note": "Checking the club page"
    }
  ]
}
```
- `targetSummary`: e.g. `Event by AI Club, Tech University`, `Project on a student profile`, or `null` when deleted.
- `history`: oldest first. First entry = the report being created (`by` = reporter name, or `"Deleted user"`). Later entries: `by` = the core user's **email**; `note` is left out when there is none.

`PATCH /api/superadmin/reports/:id` Body:
```json
{ "status": "reviewing", "note": "Checking with the club" }
```
`status` required, one of `open | reviewing | resolved | dismissed`; `note` optional, trimmed, max 500 characters. Any status may move to any status; every PATCH appends a history row. `200` returns the full detail (same as GET :id):
```json
{
  "id": "rep-1",
  "createdAt": "2026-10-09T09:12:00Z",
  "type": "event",
  "target": "AI Build Sprint 2026",
  "targetSummary": "Event by AI Club, Tech University",
  "reason": "Wrong date shown",
  "status": "reviewing",
  "reporter": "Arjun K.",
  "history": [
    {
      "status": "open",
      "at": "2026-10-09T09:12:00Z",
      "by": "Arjun K."
    },
    {
      "status": "reviewing",
      "at": "2026-10-30T07:43:42.199Z",
      "by": "core@konnevo.test",
      "note": "Checking with the club"
    }
  ]
}
```
Bad status → `422` `fields.status`:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the form.",
    "fields": {
      "status": "Choose a status"
    }
  }
}
```
Audit: `report_status_updated`, target `"Report <id> → <status>"`.

### 3.21 `GET /api/superadmin/clubs`  (NEW)
Auth: core. Query `page`, `pageSize`. Order: by club name.
```json
{
  "items": [
    {
      "id": "club-1",
      "name": "Tech Club",
      "college": "Sample College, Bengaluru",
      "admin": {
        "id": "adm-1",
        "email": "tech@college.edu"
      },
      "eventsCount": 5
    },
    {
      "id": "club-2",
      "name": "AI Club",
      "college": "Tech University",
      "admin": {
        "id": "adm-2",
        "email": "ai@techuni.edu"
      },
      "eventsCount": 4
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 10
}
```
`admin` is `null` when the club has none; `admin.id` is the `admin_allowlist` row id (used by DELETE in 3.22). `eventsCount` = all events of the club.

### 3.22 Admins  (NEW)
`POST /api/superadmin/admins` Body (camelCase):
```json
{ "clubId": "club-6", "email": "robotics@techuni.edu" }
```
`201 { "id": "<admin_allowlist id>" }`:
```json
{
  "id": "adm-103"
}
```
Rules: trim and lower-case the email; valid email, max 254 chars; unknown `clubId` → `404 not_found`; the person's account (if it exists) becomes `club_admin` for that club at once, otherwise at first verified sign-in. An email that is in `CORE_ADMIN_EMAILS` → `422` with `fields.email`.
Club already has an admin:
```json
{
  "error": {
    "code": "club_has_admin",
    "message": "This club already has an admin.",
    "fields": {}
  }
}
```
Email already administers another club:
```json
{
  "error": {
    "code": "email_already_admin",
    "message": "That email is already an admin of another club.",
    "fields": {}
  }
}
```
Form error:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the form.",
    "fields": {
      "clubId": "Choose a club",
      "email": "That does not look like an email address"
    }
  }
}
```
Audit: `admin_added`, target `"<email> → <club name>"`.

`DELETE /api/superadmin/admins/:id` → `204`. Unknown id: `404`. Effects: delete the allowlist row, set the user to `student` (and clear their club link), **delete their sessions**. The club and its events stay. Audit: `admin_removed`, target `"<email> from <club name>"`.

### 3.23 Colleges  (NEW)
`GET /api/superadmin/colleges` Query `page`, `pageSize` (frontend asks 200 for the duplicate check). Order: newest first.
```json
{
  "items": [
    {
      "id": "col-1",
      "name": "Sample College, Bengaluru",
      "nameKey": "sample college bengaluru",
      "students": 412,
      "clubs": 2,
      "createdAt": "2026-06-02"
    },
    {
      "id": "col-2",
      "name": "Tech University",
      "nameKey": "tech university",
      "students": 366,
      "clubs": 2,
      "createdAt": "2026-06-03"
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 8
}
```
`nameKey` = the stored lower-case key used to match typed names; `students` = profiles in that college; `clubs` = clubs in that college; `createdAt` = ISO date or instant.

`POST /api/superadmin/colleges/merge` Body (camelCase):
```json
{ "keepId": "col-3", "mergeIds": ["col-4"] }
```
`200 { "studentsMoved": 31, "clubsMoved": 1 }`:
```json
{
  "studentsMoved": 31,
  "clubsMoved": 1
}
```
Rules: ignore `keepId` if it is also in `mergeIds`; `keepId` unknown, or `mergeIds` empty → `422`; any unknown id in `mergeIds` → `404 not_found` and **nothing changes**. Single transaction. Moves `profiles.college_id` and `clubs.college_id`, deletes the merged colleges, cannot be undone. `studentsMoved`/`clubsMoved` count only what moved. Audit: `colleges_merged`, target `"<merged names, comma separated> → <kept name>"`.
```json
{
  "error": {
    "code": "validation_error",
    "message": "Choose a college to keep and at least one to merge.",
    "fields": {}
  }
}
```

### 3.24 `GET /api/superadmin/audit`  (NEW)
Auth: core. Query: `actor` (email contains, case-insensitive), `action` (exact, one of the five), `from`, `to` (`YYYY-MM-DD`, inclusive, by the UTC date of `at`), `page`, `pageSize`. Newest first. **Read-only: there is no POST/PATCH/DELETE.**
```json
{
  "items": [
    {
      "id": "aud-104",
      "at": "2026-10-30T07:43:42.206Z",
      "actor": "core@konnevo.test",
      "action": "admin_added",
      "target": "robotics@techuni.edu → Robotics Club"
    },
    {
      "id": "aud-6",
      "at": "2026-10-22T12:46:00Z",
      "actor": "backup@konnevo.test",
      "action": "admin_added",
      "target": "cell@city.edu → Startup Cell"
    }
  ],
  "page": 1,
  "pageSize": 2,
  "total": 4
}
```
Action names and `target` texts:

| `action` | When | `target` |
|---|---|---|
| `admin_added` | 3.22 POST | `robotics@techuni.edu → Robotics Club` |
| `admin_removed` | 3.22 DELETE | `old@city.edu from Startup Cell` |
| `colleges_merged` | 3.23 | `PES → PES University, Bengaluru` |
| `report_status_updated` | 3.20 PATCH | `Report rep-2 → reviewing` |
| `events_exported` | 3.18 | `12 events` |

`actor` is the core user's email (store an email snapshot so it survives account deletion). Write the audit row **in the same transaction** as the change.

### 3.25 In v3.1, but the frontend buttons are not wired yet (request shapes below are proposed by the frontend side; confirm)
- `POST /api/reports`  Body (snake_case): `{ "target_type": "event" | "user" | "project", "target_id": "string", "reason": "3 to 500 characters" }` → `201 { "id": "string" }`. Status starts as `open`; also write the first `report_status_history` row (by = the reporter).
- `POST /api/blocks/:userId` → `204`.

### 3.26 The core guard for every `/api/superadmin/*` route (test this)
No session → `401 unauthenticated`. Session of a student or club admin → `403 forbidden`. Core whose email was removed from `CORE_ADMIN_EMAILS` → `403 forbidden`. Same error shape as everywhere. Example:
```json
{
  "error": {
    "code": "forbidden",
    "message": "Not allowed.",
    "fields": {}
  }
}
```

---

## 4. Database additions

| Table / column | Change |
|---|---|
| `users.role` | enum `student | club_admin | core` (add `core`) |
| `profiles.completed_at` | **NEW**, nullable timestamp, set by `POST /api/profile/complete` |
| `colleges.name_key`, `colleges.created_at` | lower-case key (unique), created date |
| `college_aliases` | **NEW, recommended**: `name_key` unique, `college_id`; written by merge |
| `admin_allowlist` | `id`, `email` (unique, lower-case), `club_id` (unique, so one admin per club), `added_by`, `created_at` |
| `reports` | `id`, `reporter_id` NULL on delete, `target_type` (`event|user|project`), `target_id` NULL on delete, `reason`, `status` (`open|reviewing|resolved|dismissed`, default `open`), `created_at` |
| `report_status_history` | **NEW**: `report_id`, `status`, `at`, `by_label` (email or name), `note` NULL. Never deleted with the reporter. |
| `audit_log` | `id`, `at`, `actor_email`, `action` (text), `target` (text). Insert-only. |
| `event_register_clicks` | `event_id`, `user_id` (unique pair), `click_count`, `created_at` |
| `attendance` | `event_id`, `user_id` (unique pair), `status` (`attended|confirmed`), `proof_public_id` (private Cloudinary), `created_at` |
| `blocks` | `blocker_id`, `blocked_id` (unique pair), `created_at` |
| `matches.event_id` | needed for "matches per event" |
| `teams`, `team_members` | `team_members(team_id, user_id, role, status active|invited|left, invited_by, left_at)`; unique (`event_id`, `user_id`) among active members |
| Indexes | `events(club_id, start_date)`, `event_interests(event_id, created_at)`, `event_register_clicks(event_id, created_at)`, `matches(event_id, created_at)`, `users(created_at)`, `audit_log(at desc)`, `reports(created_at desc)` |

---

## 5. Settings

| Name | Meaning |
|---|---|
| `CORE_ADMIN_EMAILS` | comma-separated list, 2 emails (owner and a backup), compared lower-case, only if the provider marks the email verified |
| `WEB_ORIGIN` | the web app address, for CORS (`credentials: true`) if the API is on a different subdomain |
| Cookie | `Secure; HttpOnly; SameSite=Lax; Domain=<shared parent domain>` (or use the Next.js rewrite and leave the domain unset) |

---

## 6. Tests to add (backend)

1. Every `/api/superadmin/*` route: no session `401`; student `403`; club admin `403`; core `200`. Include the CSV export and `analytics`.
2. Core removed from `CORE_ADMIN_EMAILS` while signed in: next request `403`.
3. Unverified provider email never becomes core or club admin.
4. `POST /api/superadmin/admins`: success `201`; second admin on a club `409 club_has_admin`; same email on another club `409 email_already_admin`; unknown email (not signed up) allowed.
5. `DELETE /api/superadmin/admins/:id`: user becomes `student`, old session rejected, **club and events still exist**.
6. Merge: counts correct, merged colleges gone, one failing id changes nothing (transaction), audit row written.
7. Every audited write creates exactly one `audit_log` row with the right action name; reads and failed writes create none.
8. Export: header row exact, filters respected, formula cell is neutralised, file name pattern.
9. Account delete: reports remain with `reporter = null` / `target = null`; proof files deleted; wrong confirm word `422`.
10. Proof: wrong type and over-size rejected on the server; another user (and core) cannot get the signed URL.
11. Analytics: `trend` has exactly `weeks` rows including zero weeks; funnel never increases from one step to the next.
12. Password change: wrong current password `422`; success ends other sessions.

---

## 7. Open decisions for the team (defaults the frontend uses today)

1. **Who confirms attendance?** Frontend: an upload sets attended, no confirmation step. The v3.1 attendance table has a confirm step. Default: upload = attended; `proofsConfirmed` returns the count of `status = 'confirmed'` (0 until a confirm feature exists). The Overview and event detail still show "Proofs confirmed"; the analytics funnel stops at "Attended".
2. **Admin event paths:** frontend writes events at `/api/admin/events` (v3.1) and reads public events at `/api/events`. Kept as is.
3. **Report statuses:** `open, reviewing, resolved, dismissed`. Confirm or send yours.
4. **Page size parameter:** `pageSize` (frontend) or `limit` (message).
5. **Audit action names:** code names (section 1.1) or the message's `club_admin_*`.
6. **Register-link click definition:** distinct students (default) or total taps.
