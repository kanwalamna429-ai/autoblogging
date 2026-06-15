---
name: Supabase Database type format for @supabase/postgrest-js v2.108+
description: The Database interface shape required for full type inference with supabase-js v2.108+
---

## Rule
The `Database` type (in `src/types/database.ts`) must have the public schema include `Views` and `Functions` keys to satisfy `GenericSchema`. The `GenericSchema` constraint in `@supabase/postgrest-js` v2.108.1 is:

```typescript
type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};
```

Note: `Enums` and `CompositeTypes` are NOT required by `GenericSchema` (they are only in the supabase-generated types for convenience, but the constraint doesn't need them).

Each table must satisfy `GenericTable`:
```typescript
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};
```

**Minimal correct Database type structure:**
```typescript
export interface Database {
  public: {
    Tables: {
      mytable: {
        Row: { id: string; ... };
        Insert: { id?: string; ... };
        Update: { id?: string; ... };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };       // optional but harmless
    CompositeTypes: { [_ in never]: never }; // optional but harmless
  };
}
```

**Why:** Without `Views` and `Functions`, `Database["public"]` doesn't extend `GenericSchema`, so the `Schema` generic in `SupabaseClient` falls back to `never`, breaking all `.from()` calls.
