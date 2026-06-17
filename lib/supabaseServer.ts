import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client for API route handlers. Prefers the service-role
// key when present (bypasses RLS); falls back to the anon key (works with the
// MVP's permissive write policies).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseServer =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
