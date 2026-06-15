---
name: Supabase update() strict typing with RejectExcessProperties
description: postgrest-js v2.108+ rejects Record<string,unknown> as an update argument; must cast to the table's Update type
---

## Rule
In `@supabase/postgrest-js` v2.108+, the `.update()` method uses `RejectExcessProperties<UpdateType, PassedType>` which rejects `Record<string, unknown>` because its index signature (`[key: string]: unknown`) conflicts with `{ [key: string]: never }` (the rejection type).

**Pattern that fails:**
```typescript
const updates: Record<string, unknown> = {};
// ...populate updates dynamically...
supabase.from("feeds").update(updates) // TS2345 error
```

**Fix: type the updates object as the table's Update type:**
```typescript
import type { Database } from "@/types/database";
type FeedUpdate = Database["public"]["Tables"]["feeds"]["Update"];

const updates: FeedUpdate = {};
// Use cast when assigning via computed key:
(updates as Record<string, unknown>)[key] = body[key];
// Then pass the typed object:
supabase.from("feeds").update(updates) // ✓
```

**Why:** The new `RejectExcessProperties` utility type intentionally blocks `Record<string, unknown>` to prevent accidental extra fields being sent to the database. The fix is to use the specific `Update` type (which allows all fields to be optional) and cast only where needed for dynamic key assignment.
