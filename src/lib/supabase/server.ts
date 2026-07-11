import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

// Desactivado a proposito hasta que exista Supabase Auth + RLS. Sin
// autenticacion, cualquier fila escrita en Supabase es datos compartidos
// entre TODOS los visitantes anonimos (la anon key es publica por diseno;
// su seguridad depende de RLS, que todavia no esta activo). Mientras tanto
// el historial vive solo en localStorage (ver src/lib/localHistory.ts),
// que es privado por dispositivo sin necesitar ningun backend. Cuando
// llegue Auth + RLS (siguiente version), volver a poner esto en true.
const SHARED_PERSISTENCE_ENABLED = false;

function hasSupabaseCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return SHARED_PERSISTENCE_ENABLED && hasSupabaseCredentials();
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
