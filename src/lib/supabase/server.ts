import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Cliente de Supabase para uso exclusivo en el servidor (API routes),
// usando la service role key. Devuelve null si Supabase no esta
// configurado todavia, para permitir que el resto de la app funcione en
// modo degradado (sin persistencia) mientras el usuario termina el setup.
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient !== undefined) return cachedClient;

  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return cachedClient;
}
