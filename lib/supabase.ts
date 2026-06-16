import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Returns null until env vars are set, so the app runs on mock data first.
export const supabase = url && anon ? createClient(url, anon) : null;
