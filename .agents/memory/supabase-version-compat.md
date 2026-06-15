---
name: Supabase SSR + supabase-js version compatibility
description: @supabase/ssr must be on a version whose peerDep matches the installed @supabase/supabase-js or ALL DB table types resolve as `never`
---

## Rule
Always keep `@supabase/ssr` and `@supabase/supabase-js` on compatible versions — specifically, the `@supabase/ssr` peer dependency range must include the installed `@supabase/supabase-js` version.

**Why:** `createServerClient<Database>` from `@supabase/ssr` returns a `SupabaseClient` typed against the version of `@supabase/supabase-js` it was compiled against. When there's a mismatch, the `SupabaseClient` generic resolves `Schema` to `never` (because `Database["public"]` doesn't satisfy the old `GenericSchema` constraint), causing every `.from("table").select/insert/update/delete` to return `never` typed results — 60–100 TypeScript errors across all route files.

**Version pairs that work together:**
- `@supabase/ssr@0.6.1` ↔ `@supabase/supabase-js@^2.43.4` (old)
- `@supabase/ssr@0.12.0` ↔ `@supabase/supabase-js@^2.108.0` (current as of Jun 2026)

**How to apply:** When adding/upgrading either package, check the peerDependencies in `@supabase/ssr/package.json` and ensure the installed `@supabase/supabase-js` version falls within that range. Use `pnpm add @supabase/ssr@<version>` to upgrade both in sync.
