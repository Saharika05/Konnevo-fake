# konnevo: Frontend

*Find your hack. Find your mate.* Built from the Frontend Build Brief (11 Oct 2026).

**Done so far:** Step 1 (setup, API client, mock API, layout, navbar, Home, About),
Step 2 (login, session, route guards), Step 3 (7-step onboarding and the Profile page),
Step 4 (events list, event page, "I am interested", people), Step 5 (My Work: projects and experience)
and Step 6 (person profile, slide to match, "It is a match" popup).

**New packages since Step 3:** `nuqs` (Step 4), `motion` and `@fontsource-variable/syne` (Step 6, the slider
animation and the display font). Run `pnpm install` again once.

## One-time setup

1. Install **Node.js** 20.9 or newer (the LTS is fine) from https://nodejs.org
2. In a terminal: `npm install -g pnpm`

## Run it

Open the `student-platform` folder in VS Code, open the terminal (Ctrl + `), then:

```
pnpm install
pnpm dev
```

Open http://localhost:3000. Stop with `Ctrl + C`. Later runs need only `pnpm dev`.
`pnpm install` also copies the mock-API worker file into `web/public` (it is a one-off, automatic step).

No backend is needed. With `NEXT_PUBLIC_API_URL` empty, the app talks to a built-in fake API (MSW).
When Vignesh's API is ready, put its address in `web/.env.local` as `NEXT_PUBLIC_API_URL=http://localhost:4000`. No page changes.

## Test logins (mock API only)

| Who | Email | Password |
| --- | --- | --- |
| Student | student@konnevo.test | password123 |
| Club admin | admin@techclub.test | password123 |
| Core team (Step 11) | core@konnevo.test | password123 |

Google and GitHub buttons log in as a brand-new demo student (no password, profile not done).
Any other admin email shows "not on the club admin list".

## Try the whole journey (Steps 1 to 3 linked)

1. Home > **Join as a student** > **Continue with Google**
2. **Create a password** page: use it or **Skip for now**
3. Onboarding, 7 steps. The progress bar shows where you are:
   1 Basics (college suggestions as you type) > 2 Photo > 3 Skills and interests > 4 Links > 5 Your work > 6 Privacy > 7 Review
4. **Finish** lands on Events (placeholder until Step 4). The navbar now shows your name and photo
5. Avatar menu > **Profile** shows everything you entered. The small **Edit** links reopen one step and return to the profile
6. Log out, then log in with `student@konnevo.test` / `password123`: this account already has a finished profile and goes straight to Events

Step 2 of onboarding (photo) is my choice because the brief leaves it open. To change the steps, edit `web/src/lib/onboarding.ts`.

## Steps 4 and 5: what to try

**Events (public, no login needed)**
- Home > "See all events", or the Events link. The list shows 12 events and a **Load more** button (the mock has 14 upcoming)
- Type in the search box, tick types, pick Online/Offline, set From and To. The web address changes, so copy the link, open it in a new tab and the same filters are there. **Clear filters** resets
- Open an event: poster banner, "Posted by", date, place, description, **Register** (new tab), **Share** (copies the link)
- Logged out, the people part says "Log in to see who's going"
- Open a made-up id such as /events/nope: "We could not find that event"

**As a student (login with student@konnevo.test)**
- **I am interested** changes at once and the count moves by one. Refresh: it is still on. Click again to undo
- "Suggested teammates" shows 3 people with a "why you match" line; "Who is interested" shows 20 and **Load more**
- Click a person: a placeholder (their profile and the slide to match arrive in Step 6)
- A club admin sees the event without the interested button and without people

**My Work (student)**
- /my-work has two tabs, **Projects** and **Experience**. The tab is in the address (?tab=experience); the arrow keys switch tabs
- Projects: add, edit (also remove or add screenshots, 3 at most) and delete with a confirm popup
- Experience: Type, What you did, **Organisation or event (required)**, Start, End (empty = Present), Description
- Everything you add also shows on the Profile page

## Step 6: the match screen

Log in as a student, open an event, click anyone under "Suggested teammates" or "Who is interested".

- The profile card is 3D. Drag the round knob and the card leans, slides and glows red (skip) or green (match)
- Let go before 60% of the way and the knob snaps back. Past 60%: the card flies off and the next person arrives
- No mouse? The small **Skip** and **Match** buttons under the slider work, and so do the **left and right arrow keys**
- "Person 3 of 41" and the bar above the card show where you are
- About half the people in the mock match you back: that opens the **It is a match!** popup (confetti, LinkedIn and GitHub buttons when the data has them). **Keep swiping** shows the next person
- After the last person: "You have seen everyone"
- /events/quantum-intro has only 2 people, so it shows "Not enough people yet" instead of the card
- Settings is Step 8, so to see the "matching is off" banner, turn the switch off in onboarding step 6 (or edit your mock profile), then come back: swiping pauses and a button turns it on
- With "reduce motion" switched on in your computer, the card stays flat and nothing flies

The display font for the names and big numbers is **Syne**. To use it elsewhere add the class `font-display`.

## Step 7: My Teams (linked to everything before it)

My Teams has three tabs: **Teams**, **Matches** and **Invites** (the Invites tab and the Create team form are the two "new screens" you approved).

Try it in this order:

1. Log in as the student. Open **My Teams**, then **Invites**. One invite from "Byte Benders" is waiting (the mock adds it the first time, on the last event in the list). A person can be in only one team per event, so use a different event for your own team. The header's My Teams link shows a number while invites wait.
2. **Accept** it. You land on **Teams** and the card shows status **Registered**. Open that event's page: a green bar says you are in the team.
3. There is no certificate or attendance-proof upload any more. The card only shows the status the API sends.
4. Go to an event, open people, slide to match until the popup appears, then press **See my matches**. The new person is on **Matches** with LinkedIn/GitHub buttons when allowed.
5. On a match press **Create team**. The event and person are already ticked. Add a team name and your role, then create it. Invited people show "waiting" until they accept. In the mock, people who had liked you accept the next time you open the page.
6. **Edit** on a team card renames it or changes your role. The bin icon on a match removes it.

How the screens follow the brief: the UI never works out Registered or Attended, it shows what the API sends. Team rules (max 6, one team per event, members must be matches) are not checked in the screens; the API's error messages are shown instead. The mock API does enforce them so you can see those messages.

API guesses to check against the endpoint reference: `GET /api/teams` returns `{ teams, invites }`; `POST /api/teams` takes `name, event_id, my_role, member_ids`; `POST /api/teams/:id/respond` takes `{ accept }`.

## Step 8: Settings, Privacy, Terms, 404 and error pages

**Settings** (`/settings`, sections in the address: `?section=privacy|password|blocked|account`):

- **Privacy:** six switches (show college, skills, LinkedIn, GitHub, show me for matching, hide my profile). Each one saves the moment you flip it, and flips back with a message if the save fails. Turn off "show me to others" and the match screen shows its "Turn on matching" banner (Step 6).
- **Password:** "Change password" if you have one, "Create password" if you signed in with Google or GitHub. Log in with `student@konnevo.test` to see Change, or use the Google button to see Create.
- **Blocked people:** one person is pre-blocked in the mock so you can press Unblock. (A Block button on the person screen is not in the drawn pages, so it is not built.)
- **Account:** Log out, and Delete my account, which needs you to type DELETE. After deleting you land on Home, logged out.

**Privacy and Terms** (`/privacy`, `/terms`) are draft text, marked "Draft" on the page. The core team must replace the wording before launch. The footer links go to them now. **404** and the **error page** use the same dark style.

API guesses: `POST /api/auth/password/change` takes `current_password` and `password`; `GET /api/blocks` returns `{ blocked: [{ id, name, college }] }`; `DELETE /api/account` takes `{ confirm: "DELETE" }`.

## Step 9: club admin

Log in on the Admin login page with `admin@techclub.test` / `password123`. The navbar shows Events, Add event, Admin.

- **Admin overview** (`/admin`): three numbers (events posted, upcoming, people interested), the club's events with **Edit** and **Delete**, and a **Reports** list with **Resolve**. Two demo reports are added the first time an admin opens the page.
- **Add event** (`/admin/events/new`): title (100), type, mode, start date, optional end date, place, registration link, description (2000), optional poster (5 MB). "Posted as Tech Club" is read only. **Publish event** makes it live at once, with no approval step. After publishing you land on the event page; look at Events and Home to see it there too.
- **Edit event** (`/admin/events/[id]/edit`): same form, prefilled. The old address `/admin/add-event` still works and sends you to the new one. On an event page, a club admin sees **Edit event** for their own club's events.
- **No proofs screen for admins.** Club admins do not confirm attendance. There is no attendance proof or confirmation step at all.
- **Events:** a club admin sees no Register button on events. Students do.

A club admin can only edit or delete their own club's events (the mock answers 403 otherwise). The mock keeps a few seeded events under other clubs so you can see that.

API guesses: `GET /api/admin/overview` returns `{ clubName, stats, events, reports }`; events are sent as multipart with `start_date`, `end_date`, `registration_url`, `poster`; there are no proof endpoints.

## Step 10: phones, accessibility and tests

**Phones.** Every page is built mobile-first and switches to the wide layout from 768 px. The navbar becomes a menu button, tab rows scroll sideways instead of overflowing, dialogs fit with a 16 px margin, and the match slider sticks to the bottom with real Skip and Match buttons as an alternative.

**Accessibility.**
- A "Skip to content" link is the first thing the Tab key reaches. Focus rings are visible everywhere.
- Every field has a label, errors are read out by screen readers, and icon-only buttons have names.
- All text colours were checked by hand: at least 4.5 to 1 against their backgrounds (placeholders were raised to match).
- Tab rows, dialogs, switches and the slide-to-match control work from the keyboard (arrow keys on tabs and the slider). Motion is switched off for people who ask their device for reduced motion.

**Tests.** Two kinds, both run on the mock API.

1. `pnpm test:mock` (no browser needed): runs every mock endpoint through the full journey (login, interested, swipe and match, teams, settings, delete account, club admin) and checks every form limit from the brief. It prints `ALL PASSED` for each group.
2. `pnpm test:e2e` (real browser): first run `pnpm exec playwright install chromium` once. It starts the app itself and runs the journeys in `tests/e2e`: login, browse and load more, mark interested, swipe and match, accept an invite (no certificate upload), admin publishes an event, an admin has no proofs page and no Register button, settings switch saves, a student cannot open admin pages, the phone checks (no sideways scrolling, menu works) and automatic accessibility checks (axe).

If a browser test fails, it saves a trace: `pnpm exec playwright show-trace test-results/<folder>/trace.zip`.

## Frontend changes round (from your notes)

| Your note | Done |
| --- | --- |
| Register option is not there | Event cards and the event page show **Register** (opens the event's own link in a new tab) |
| Portfolio and Discord/WhatsApp as optional in About you | Onboarding step 4 and the profile page have Portfolio, Discord and WhatsApp (all optional) |
| Dropdown button for college in Basics (`/onboarding/1`) | The college box has an arrow button that opens the list; typing still narrows it |
| Duplicate projects not removed | Adding or editing a project with the same title (spaces and case ignored) or the same link is stopped with a clear message |
| "Why you match" more accurate | Up to three factual sentences built only from the skills, interests and project of each profile: what they build, how your skills complement theirs (for example a backend person with your React frontend). With too little profile data it says so instead of guessing |
| Remove "the club confirms you attended" line | Removed from About (and the matching line in Terms). Attendance confirmation no longer exists |
| Remove last line of point 2 in Privacy | Removed (the last line of point 2) |
| Animation names and skills (home orbit) | The home orbit shows Aditi, Harsh, Meghna, Yash, Riya, Varun with new skills |
| Remove proofs to confirm in admin | The page, navbar link, overview number and endpoint are gone. The student certificate upload is gone too |
| Remove Register for admin in events | Club admins never see Register on cards or on the event page; they can still browse and open every event. Students still see it |

## Step 11: Core admin (architecture v3.1)

The konnevo team's own section, at `/core`. It is **only** for a user whose role is `core`.

**How someone becomes core (backend, not in this code).** The server reads `CORE_ADMIN_EMAILS` (comma-separated) and sets `users.role = core` for those emails. The frontend never sees that list. There is **no** "Login as core admin" anywhere: the core team signs in with the normal form or Google/GitHub, `GET /api/auth/me` returns `role: "core"`, and the app sends them to `/core`.

**Try it (mock API).** Log in at `/login?as=student` with `core@konnevo.test` / `password123`. You land on `/core`.

| Page | Path | What it does |
| --- | --- | --- |
| Overview | `/core` | Number cards, top events by interest, open reports link, 5 latest audit entries |
| Events | `/core/events` | All events, filters kept in the URL, **Export CSV** of the filtered list (`konnevo_events_YYYY-MM-DD.csv`) |
| Event detail | `/core/events/:id` | Event info and the funnel Interested > Register-link clicks > Teams > Matches |
| Reports | `/core/reports` | Filter by type and status, open a report, change status with an optional note, see the history |
| Clubs and admins | `/core/clubs` | Give or remove club admin access. One admin per club |
| Colleges | `/core/colleges` | Likely duplicates highlighted, tick colleges, pick the name to keep, review, confirm (cannot be undone) |
| Audit log | `/core/audit` | Read-only, newest first, filters for actor, action and dates |

**Rules built in**
- Students, club admins and visitors who open any `/core/...` address get the normal 404 page, never "forbidden". The check is made twice: on the server in `app/(core)/core/layout.tsx` (reads `/api/auth/me` with the person's cookie), and in the page (`CoreGuard`). The API must still refuse every `/api/superadmin` call from a non-core user; the mock does (401 and 403).
- No core link, menu item or text is rendered for other roles (the "Core admin" item in the account menu exists only for role `core`).
- Giving admin access to a club that already has an admin returns **409** (`club_has_admin`). The same email being an admin of another club also returns 409 (`email_already_admin`). The form shows the message under the field.
- **Removing access does not delete the club or its events.** The person goes back to a normal student. The confirmation dialog says so, and the mock keeps the club and its event count.
- Every write (add or remove admin, merge colleges, report status, CSV export) is logged by the backend. The mock does the same so you can see it in the audit log.

**Where the code is**
- `src/app/(core)/core/...` the pages, `src/components/core/...` the screens and the look
- `src/lib/core/schemas.ts` Zod shapes (responses are checked at runtime), `logic.ts` duplicate finder and helpers, `hooks.ts` TanStack Query hooks
- `src/lib/services/superadmin.ts` the API calls, `src/lib/core/server-role.ts` the server-side role read
- `src/lib/mocks/superadmin/` **NEW**, the fake `/api/superadmin` (separate from the older mocks; one import line in `handlers.ts`)

**Switching from mocks to the real API.** Set `NEXT_PUBLIC_API_URL` in `web/.env.local`. The mock folder is then not used and can be deleted along with the one `superadminHandlers` line in `src/lib/mocks/handlers.ts`.
Important for the server-side check: the Next.js server must receive the session cookie. Put the API behind the same site as the web app (a shared parent domain, or a Next.js rewrite for `/api`), otherwise the layout cannot read the cookie and every `/core` visit shows the 404.

**Tests**
- `pnpm test:mock` also runs `core-api` (new): access rules (401/403), response shapes, filters, CSV, the 409 rules, "removing admin keeps the club", merge, audit.
- `pnpm test:unit` (Vitest, new): role guard, CSV export button, merge confirmation, duplicate finder, email rule. Needs `pnpm install` first (adds vitest, jsdom, Testing Library).
- `pnpm test:e2e`: `tests/e2e/core.spec.ts` shows a student, a club admin and a visitor get the 404 on every `/core` page, the login page has no core option, and the core screens work end to end.

### Core admin: assumptions (please confirm)

1. **Look.** The Core admin uses the same dark konnevo design as the student screens (magenta and violet, Syne headings, the animated background, the same buttons, cards and inputs). The supplied screenshots were a light layout, so only their structure and page content were kept. The screenshots show top tabs, the spec asks for a left sidebar, so there is a left sidebar on laptops, a menu button on phones, and a small "Core admin" label at the top.
2. **Screenshot items left out because the spec does not list them:** Remove event, "View public page", the 7/30/90 days toggle, the "New students per week" chart, the bell with a badge (no notifications in v1), the "Send an invite email" checkbox, "new club name / college" in the admin form (there is no endpoint to create clubs), the Active/Invited status column (no data source), and Proofs/Reports columns in the events table (the spec's columns are used).
3. **Added from the screenshots, from data the spec already lists:** "Top events by interest" and "Needs attention" (open reports) on the overview.
4. Core is view-only for events and projects; the only changes are report status, club admin access and college merges.
5. Report statuses: open, reviewing, resolved, dismissed (to be confirmed with Vignesh). Dismiss and Resolve are choices in the status form.
6. Overview numbers are the ones in the spec; the page shows what the API returns.
7. "Switch to student view" is in the sidebar footer. No notifications.
8. Duplicate colleges are flagged in the browser: after removing filler words ("college", "of", "engg"...), one name's words are all inside the other's. It is only a hint. The backend can send its own flag later.
9. Merging asks you to pick the colleges, pick the name to keep, review the summary, then tick "I understand this cannot be undone" before the button works.
10. Lists use Previous/Next pages (10 per page). Colleges and clubs for the dropdowns are read as one page of up to 200.
11. Paths, query names (`page`, `pageSize`, `q`, `college`, `club`, `type`, `mode`, `from`, `to`, `actor`, `action`) and response shapes are my proposal from the spec. Check them against the real API and change `src/lib/core/schemas.ts` and `src/lib/services/superadmin.ts` if they differ.
12. Mock changes live in memory: a full reload restores the sample data.
13. The login page, header and footer of the student site are hidden inside `/core` for core users only.
14. Next.js 16 renamed "middleware" to "proxy". The server check is a server layout instead, which works the same for this purpose.

## Checklist

- [ ] Steps 1 to 3 still work (login, onboarding, profile)
- [ ] Events: filters work and survive a reload, Load more adds the last 2 events
- [ ] Event page: interested toggles and survives refresh; Register opens in a new tab
- [ ] Logged out event page asks to log in; student sees people; admin does not
- [ ] My Work: add, edit and delete both a project and an experience entry
- [ ] Empty states and error messages look right (clear site data to see the empty lists on a new demo account)
- [ ] Phone width (390 px): filters stack, cards are one column, tabs and forms fit
- [ ] Step 6: drag, snap back, skip, match, popup, arrow keys, end of list, "not enough people yet"
- [ ] The name konnevo (lowercase) appears everywhere and "HackMate" nowhere
- [ ] Core admin: log in as core@konnevo.test, all 7 pages open; a student sees the 404 on `/core`
- [ ] `pnpm lint` passes

Mock data (logins, profiles, photos) is kept in the browser. To start over, clear site data for localhost:3000.

## If something goes wrong

Send the red terminal text or a screenshot.

| What you see | What to do |
| --- | --- |
| `pnpm: command not found` | `npm install -g pnpm`, then reopen the terminal |
| Page stays blank | Run `pnpm install` again, then Ctrl + Shift + R in the browser |
| Port 3000 in use | `pnpm dev -p 3001` |


## Step 13: Core analytics dashboards

- New page `/core/analytics` (nav item "Analytics", link on the Overview): five KPI tiles with change against the previous period, weekly activity lines, funnel, donuts (event type, online/offline, reports, club admin coverage), events by month, interest by college, college x type heatmap, and a bubble chart of which events convert.
- Slicers (period 4/8/12 weeks, college, event type) live in the address bar. Clicking a bar, ring or heatmap row sets the slicer.
- Charts are plain SVG in `components/core/charts.tsx` (no chart library). Numbers and scales come from `lib/core/chart-math.ts`.
- New endpoint `GET /api/superadmin/analytics?weeks=&college=&type=` (core only, shape in `analyticsSchema`). The mock is `lib/mocks/superadmin/analytics.ts`; the real backend computes the same with SQL group-by.
- Attendance and proofs are not tracked, so the funnel and KPIs stop at matches.
- Overview users now equal the sum of college students (1,350) so both pages agree.

### Step 13b: API contract for the backend

- `konnevo-backend-api-contract.md` (project root copy in this zip: `docs/`) lists every new and changed endpoint with exact request and response JSON, rules, error codes, database additions and tests. The examples are generated from the mock API, so they match the code.
- New in this step: `POST /api/events/:id/register-click` (called when a student taps Register; fire and forget) and the analytics `monthly[].month` is now `YYYY-MM` (the screen formats it).


## Step 14: Frontend changes (Oct 31)
- Duplicate projects message: "Misleading ones can be reported." (no promise of removal).
- Why you match: rewritten in the mock from real profile data; the real API decides the text.
- Attendance confirmation and proof upload removed (student, club admin, Core admin, mock, tests, About, Terms, Privacy line).
- Club admins: no Register button; students unchanged.
- Home ticker: same marquee component and CSS, new content: Hackathons, Ideathons, Tech Fests, Workshops, Coding Competitions, Tech Talks, Developer Meetups, Innovation Challenges (repeated 6 times so the track is about as wide as before).
- Not run in this environment: the real Next app, Playwright e2e, Vitest component tests.


## Step 15: Olive colour theme (colours only)
- New palette in `web/src/app/globals.css` (tokens, `theme-dark` and `theme-light` scopes, animated light and dark aurora, glows, shimmer, toasts) and `web/src/lib/theme.ts` (confetti, glows, badges, charts).
- Navbar, footer and the /core sidebar are deep olive (`theme-dark bar-dark`). The match screen and popup are a dark stage with the dark aurora; the profile card stays soft white (`theme-light`).
- /core uses light surfaces with charts in olive, moss, sage and amber. The blue theme is gone.
- Old `violet` and `cyan` classes and variables are removed. 404 and error numerals use `text-gradient-404`.
- `web/src/app/icon.svg` is the new favicon (sage tile, deep olive k). Theme colour is `#2E3D28`.
- Checks: `python3 scripts/contrast.py` and `python3 scripts/audit-hex.py web/src` (kept in `web/scripts/`).
- Not run here: `pnpm lint`, `pnpm test:unit`, `pnpm test:e2e` (no packages in this environment).
