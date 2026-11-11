# Movie Memory

A full-stack application for signing in with Google, saving a favorite movie, and discovering AI-generated trivia about it.

**Selected extension: Variant B — Frontend/API-Focused.** I chose this variant to focus on typed API contracts, optimistic editing, and client-side cache invalidation while keeping the application small.

Built with TypeScript, Next.js App Router, React, Tailwind CSS, PostgreSQL, Prisma, Auth.js, and the OpenAI API. Tests use Vitest and React Testing Library.

## Local setup

You need Node.js 22.12+ and npm, Docker Desktop or an existing PostgreSQL database, a Google OAuth client, and an OpenAI API key with model access and available quota.

```bash
npm ci
cp .env.example .env
```

Fill in `.env` using your own credentials. Choose a local database password and use it in both `POSTGRES_PASSWORD` and `DATABASE_URL`. URL-encode special characters in the connection string. Do not commit this file.

### Environment variables

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` | User created by the included Docker PostgreSQL service. |
| `POSTGRES_PASSWORD` | Password used when initializing the local database. |
| `POSTGRES_DB` | Database created by the included Docker service. |
| `DATABASE_URL` | PostgreSQL connection string; must match the Compose user, password, database, and local port. |
| `AUTH_SECRET` | Auth.js secret; generate with `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret. |
| `OPENAI_API_KEY` | Server-side OpenAI API key. |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-4.1-mini`. |

In Google Cloud Console, configure the OAuth consent screen and create a **Web application** OAuth client. Register this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

If the consent screen is in Testing mode, add your sign-in account as a test user. Set the resulting client ID and secret in `.env`, along with your OpenAI key.

### Database and migrations

Start the included local database:

```bash
docker compose up -d
```

The Compose service binds PostgreSQL to `127.0.0.1:5432`. Its `POSTGRES_*` values initialize a new database volume; changing them does not update credentials in an existing database. Preserve the existing values when reusing a volume.

If using an existing PostgreSQL database, set `DATABASE_URL` to its connection string instead. Generate the Prisma client and apply the committed migration:

```bash
npm run db:generate
npm run db:deploy
npm run dev
```

Open **http://localhost:3000**. New users enter their favorite movie during onboarding; returning users see their dashboard.

Development output uses `.next-dev` so production builds in `.next` do not overwrite an active dev server’s files. The tracing root is explicitly the project directory to avoid ancestor lockfiles affecting root detection.

## Architecture overview

### Authentication and page flow

Auth.js uses Google OAuth and the Prisma adapter to persist users, accounts, and database sessions. The session callback exposes the authenticated user's ID to server code.

The public `/` page offers Google sign-in. After login, `/dashboard` loads the current user from PostgreSQL and redirects to `/onboarding` when no favorite movie has been saved. Onboarded users visiting `/onboarding` return to the dashboard. Protected pages redirect signed-out users to `/`, and the logout action ends the Auth.js session.

The dashboard displays the stored Google name, email, photo, favorite movie, and generated trivia. Missing names or photos have fallbacks; failed photo loads show a profile icon.

### Data model

`User` holds the profile and nullable `favoriteMovie`. Auth.js uses `Account`, `Session`, and `VerificationToken` for authentication persistence.

`MovieFact` stores `userId`, `movie`, `text`, and `createdAt`, with an index on user, movie, and creation time. Each fact keeps the movie title it was generated for, so changing a favorite does not change the attribution of historical facts. A cascading foreign key associates facts with their user.

A separate Movie entity would add little value for a product with one favorite title per user. Keeping the title on User and stamping it onto each fact makes that relationship explicit with fewer tables.

### API contracts and server behavior

All three endpoints derive identity from the server session and return `Cache-Control: no-store`. No endpoint accepts a user ID to choose whose data to access.

| Endpoint | Successful response | Purpose |
|---|---|---|
| `GET /api/me` | `{ user: { id, name, email, image, favoriteMovie } }` | Read the current user's selected profile fields. |
| `PUT /api/me/movie` | `{ movie: string }` | Save the current user's favorite movie. |
| `GET /api/fact` | `{ fact: { id, movie, text, createdAt } }` | Generate and store trivia for the saved movie. |

The dashboard reads the initial profile on the server, avoiding an extra browser request. `GET /api/me` and its typed client wrapper remain available as the profile API contract.

`src/lib/api.ts` centralizes requests and normalizes failures as `ApiClientError`. Shared Zod schemas validate responses at runtime and provide TypeScript types. Errors use `{ error: { code, message } }`: unauthorized requests return 401, invalid movie input returns 400, missing onboarding or a movie change during generation returns 409, and generation failures return 503. Unexpected server failures return a generic 500 without internal details.

Movie input is trimmed and validated server-side at 2–120 characters before any write. Only the server imports the OpenAI SDK or reads its key. Generation uses a bounded timeout, limited retries, and the configured model. Empty or failed completions are not saved.

After generation, the route rechecks the user's favorite before inserting the fact. This check and insertion are not atomic; an edit immediately afterward can leave a historical fact, but its stored movie remains correct. Client-side request and movie checks prevent displaying a late response under another title.

### Optimistic editing and client caching

`DashboardClient` uses a reducer for edit, draft, save, success, failure, and cancel states. Save immediately displays the new movie and clears old trivia. If the API fails, the previous movie is restored and an error is shown. Cancel makes no request. A synchronous pending guard prevents duplicate saves before React renders disabled controls.

A ref stores the last fact, movie, and fetch timestamp. Normal reads reuse it for less than 30 seconds; at exactly 30 seconds it expires. Window focus triggers a normal read, while **Discover another fact** always bypasses the cache. Changing the movie clears the cache. Request IDs, movie checks, and abort controllers prevent superseded responses from changing the current UI.

The cache belongs to the mounted dashboard and resets on a full refresh. React state and refs are sufficient for one cached resource, avoiding a separate query library. The UI provides loading, empty, error, and pending-save states so API failures remain recoverable.

### Security and tradeoffs

Authorization and validation happen on the server. Database queries use the session identity, secrets remain in environment variables, and API responses contain only the intended fields. Trivia is rendered as text and identified as AI-generated.

Fact generation uses GET to match the assignment's API shape; a production API would use POST for this side effect. Client cancellation prevents stale UI updates but cannot guarantee cancellation of OpenAI work already running. Generated trivia may be inaccurate, and generation currently has no rate limit or cost budget.

Known dependency findings remain in test, lint, and Prisma configuration tooling, including critical Vitest/tinypool findings. These tools run trusted project inputs and are not exposed as HTTP services; their findings remain unresolved. Compatible fixes were applied, including a PostCSS 8.5.32 override tested with a clean install and build. Major tooling upgrades were deferred for compatibility review. Run `npm audit` for current findings.

## Tests and checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover API error normalization, authorization, input validation, fact persistence calls, OpenAI failures, rendered edit/cancel/rollback behavior, duplicate saves, stale responses, and cache expiry/invalidation. External APIs and database calls are mocked in the automated suite; real Google consent and OpenAI account access require local verification with your credentials.

For the standalone database checks, first apply migrations to a **disposable** database, then run:

```bash
DATABASE_URL="YOUR_DISPOSABLE_DATABASE_URL" npm run db:deploy
AUDIT_DATABASE_URL="YOUR_DISPOSABLE_DATABASE_URL" npm run db:verify
```

The script checks persistence, scoped queries, and foreign keys using temporary fixture users, then removes those users. It requires `AUDIT_DATABASE_URL` and never defaults to the application's database.

## What I'd improve with two more hours

- Add repeatable browser tests for login redirects, editing, cache behavior, and logout with a controlled test identity.
- Expand the isolated PostgreSQL checks into automated route-to-database integration tests.
- Add generation rate limits and cost controls, and review the remaining tooling upgrades.
- Improve keyboard and screen-reader coverage and verify generated facts against a movie data source.

## AI usage

- Used AI assistance for implementation planning, code drafting, tests, documentation, and debugging.
- Used AI-assisted review to check API contracts, security, caching, and asynchronous state handling.
