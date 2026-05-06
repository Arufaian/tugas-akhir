## AGENTS.md

Repository guidance for coding agents working in `/home/alfian/tugas-akhir`.

## Stack Overview

- Framework: SvelteKit 2 + Svelte 5 (runes mode enabled)
- Language: TypeScript (strict)
- Package manager: bun
- Styling: Tailwind CSS v4
- Lint/format: ESLint + Prettier
- Forms/validation: sveltekit-superforms + zod
- Auth/Backend: Supabase SSR
- Database: Drizzle ORM + PostgreSQL (`postgres` driver)

## Source of Truth

- `package.json` scripts define runnable workflows.
- `eslint.config.js` defines lint rules and language behavior.
- `.prettierrc` defines formatting rules.
- `tsconfig.json` defines type-safety and module behavior.
- `svelte.config.js` enables Svelte runes mode project-wide (except `node_modules`).

## Rules Files Discovery

No repository-specific Cursor/Copilot rule files were found at analysis time:

- `.cursorrules`: not present
- `.cursor/rules/`: not present
- `.github/copilot-instructions.md`: not present

If these files are added later, treat them as additional high-priority instructions.

## Install

- `bun install`

## Dev Commands

- Start dev server: `bun run dev`
- Build production bundle: `bun run build`
- Preview production build: `bun run preview`

## Quality Commands

- Full lint (Prettier check + ESLint): `bun run lint`
- ESLint on `src` only: `bun run lint:source`
- ESLint entire repo: `bun run lint:all`
- Auto-format with Prettier: `bun run format`
- Type + Svelte checks: `bun run check`
- Type + Svelte checks in watch mode: `bun run check:watch`

## Tests

There is currently no dedicated test runner configured (no `test` script in `package.json`).

Until tests are introduced, use this quality gate before finishing work:

1. `bun run check`
2. `bun run lint`
3. `bun run build`

### Running a single test (current status)

- Not available yet: single-test execution is not possible because no test framework is configured.

### Running a single test (when a test runner is added)

If Vitest is introduced later, prefer:

- Single file: `bunx vitest run path/to/file.test.ts`
- Single test name: `bunx vitest run -t "test name"`

Do not assume these commands work until a test framework is explicitly added.

## Database Commands (Drizzle)

- Generate migrations: `bun run db:generate`
- Run migrations: `bun run db:migrate`
- Push schema: `bun run db:push`
- Open studio: `bun run db:studio`

## Code Style (Formatting)

Derived from `.prettierrc`:

- Use tabs (`useTabs: true`)
- Use single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: 'none'`)
- Max line width: 100 (`printWidth: 100`)
- Svelte files parsed via Prettier Svelte plugin
- Tailwind class ordering is handled by `prettier-plugin-tailwindcss`
- Tailwind stylesheet reference: `./src/routes/layout.css`

Run `bun run format` after substantial edits.

## Linting and Static Analysis

Derived from `eslint.config.js`:

- Base configs:
  - `@eslint/js` recommended
  - `typescript-eslint` recommended
  - `eslint-plugin-svelte` recommended + prettier config
- Globals include browser and node environments.
- `no-undef` is intentionally disabled for TS files.
- Svelte parser is configured with TS project service and `.svelte` support.
- Respect `.gitignore`-based ignores included via `includeIgnoreFile`.

## TypeScript Standards

Derived from `tsconfig.json` and existing code:

- TypeScript strict mode is enabled (`"strict": true`)
- Prefer explicit types on exported APIs and non-trivial values.
- Use `import type` for type-only imports.
- Keep `forceConsistentCasingInFileNames` compatibility.
- Module resolution is bundler-style (`moduleResolution: bundler`).
- Relative import extension rewriting is enabled; follow existing local import patterns.

## Import Conventions

Follow existing project patterns:

- Order imports by role:
  1. Framework/runtime imports (`@sveltejs/*`, `svelte/*`)
  2. Third-party packages
  3. App aliases (`$lib`, `$app`, `$env`)
  4. Relative imports
- Use `$lib` alias instead of deep relative paths when practical.
- In SvelteKit route modules, use generated types from `./$types` or `./$types.js` consistently with local file style.
- Avoid unused imports; keep import lists minimal.

## Naming Conventions

Observed conventions:

- Svelte route files follow Kit defaults: `+page.svelte`, `+page.server.ts`, `+layout.ts`, etc.
- Components: kebab-case filenames for many UI primitives (e.g. `dropdown-menu-item.svelte`)
- Utility functions: `camelCase` (e.g. `getInitials`)
- Types/interfaces/type aliases: `PascalCase` (e.g. `UserProfileData`)
- Constants: `camelCase` unless true global constants require `SCREAMING_SNAKE_CASE`
- Schema/type exports should be descriptive (`registerSchema`, `RegisterInput`)

## Svelte 5 + SvelteKit Practices

- Runes mode is enabled; prefer rune-based APIs and modern Svelte 5 patterns.
- Keep server-only logic in `+page.server.ts`, hooks, or `$lib/server`.
- Keep client navigation and UI concerns in `.svelte` or `+page.ts` as appropriate.
- In forms, follow existing `sveltekit-superforms` + `zod4/zod4Client` pattern.
- Preserve SSR-safe patterns used in Supabase client initialization.

## Error Handling Guidelines

- Validate external/user input with Zod before processing.
- In form actions, return `fail(400, { form })` for validation failures.
- Return user-facing messages via established superforms `message(...)` pattern.
- For auth/authorization failures in hooks/routes, use `throw redirect(...)` where appropriate.
- Do not leak secrets, raw SQL errors, or sensitive auth details to client responses.
- Prefer explicit null/unauthorized handling over silent assumptions.

## Supabase and Auth Guidelines

- Reuse `event.locals.supabase` and `safeGetSession()` established in hooks.
- Distinguish between:
  - `getSession()` (session retrieval)
  - `getUser()` (JWT validation)
- Keep secure cookie behavior aligned with existing hook implementation.
- Use public keys only from `$env/static/public` for browser-safe access.

## Drizzle and Schema Guidelines

- Keep schema definitions in `src/lib/server/db/schema/*`.
- Use explicit table/type names and constraints (`notNull`, defaults, FK behavior).
- Add migration changes through Drizzle workflow; avoid ad-hoc production schema drift.
- Do not hardcode credentials; rely on `DATABASE_URL` from environment.

## Svelte MCP Tools

When agents are able to use the Svelte MCP server, follow these rules:

### 1. list-sections

Use this first to discover available documentation sections, then identify relevant topics by use case.

### 2. get-documentation

After listing sections, fetch all sections relevant to the task before implementing non-trivial Svelte/SvelteKit changes.

### 3. svelte-autofixer

Run this whenever you write or modify Svelte code, and iterate until no issues remain.

### 4. playground-link

Only generate a Playground link on explicit user request, and never when code has already been written to project files.

## Agent Workflow Recommendations

Before finalizing any change:

1. `bun run check`
2. `bun run lint:source`

For DB-related changes also run the appropriate Drizzle command(s).

When changing Svelte components, ensure compatibility with Svelte 5 runes mode and existing UI composition patterns.

## Notes

- This repository currently lacks automated unit/integration test setup.
- If adding a test framework, also update this file with:
  - `test` script(s)
  - single-test command(s)
  - test directory conventions
  - coverage expectations
