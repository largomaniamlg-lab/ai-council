import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

// Cliente de Supabase para el navegador (anon key). Reservado para cuando
// la UI necesite leer datos directamente desde el cliente (p.ej. tiempo
// real). En el MVP la UI habla con nuestras propias API routes.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (cachedClient !== undefined) return cachedClient;

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
