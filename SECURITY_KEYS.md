# Gestión y rotación de claves — AI Council

Este documento describe **procedimientos**, nunca contiene claves reales. No lo edites para pegar un valor de clave; todas las claves reales viven exclusivamente en `.env.local` (local, gitignored) o en las variables de entorno de Vercel (producción).

## Auditoría realizada (2026-07, esta sesión)

Confirmado antes de escribir este documento:

- Ningún archivo `.env*` (salvo `.env.local.example`, sin claves reales) ha sido commiteado nunca en el historial de git.
- Todo el código que referencia `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY` es server-only (`src/lib/aiProviders/*`, `src/lib/supabase/server.ts`) — ninguno tiene `"use client"`, ninguno es importado por un componente cliente.
- `/api/status` solo devuelve booleanos y nombre de modelo, nunca las claves.
- Ninguna variable con prefijo `NEXT_PUBLIC_` contiene un secreto (solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, que son públicas por diseño en Supabase — su seguridad depende de RLS, no de ocultar el valor).

## Secretos que existen hoy

| Variable | Dónde se usa | Dónde debe vivir |
|---|---|---|
| `OPENROUTER_API_KEY` | Council Simulator (todos los roles) | Vercel env vars (producción) / `.env.local` (dev) |
| `OPENAI_API_KEY` | Live Mode, rol por defecto | Vercel env vars / `.env.local` |
| `ANTHROPIC_API_KEY` | Live Mode (si se configura algún rol) | Vercel env vars / `.env.local` |
| `GOOGLE_API_KEY` | Live Mode (si se configura algún rol) | Vercel env vars / `.env.local` |
| `XAI_API_KEY` | Live Mode (si se configura algún rol) | Vercel env vars / `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Persistencia server-side (Historial, sesiones) | Vercel env vars / `.env.local` — **nunca** en el cliente |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Pública por diseño |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Pública por diseño, protegida por RLS (pendiente de activar) |

## Acciones que SOLO puede hacer el propietario de las cuentas (no yo)

Estas claves fueron pegadas en el chat de desarrollo en algún momento del proyecto y deben tratarse como comprometidas, aunque nunca llegaran a un repositorio:

- [ ] Revocar y regenerar la clave de OpenRouter actual en [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys); actualizar `OPENROUTER_API_KEY` en Vercel.
- [ ] Revisar si hay créditos cargados en OpenRouter (afecta al límite gratuito diario — ver conversación previa sobre el 429).
- [ ] Confirmar que el `SUPABASE_SERVICE_ROLE_KEY` en uso no ha sido expuesto; regenerar si hay dudas, desde el dashboard de Supabase (Project Settings → API).
- [ ] Activar 2FA en: GitHub, Vercel, OpenRouter, Supabase (si no está ya activo).
- [ ] Revisar colaboradores con acceso al repositorio de GitHub y al proyecto de Vercel — eliminar accesos que ya no sean necesarios.
- [ ] Revocar el TOTP/QR de 2FA que se compartió por pantalla en su momento (ya señalado en una sesión anterior) si aún no se ha regenerado.

## Procedimiento de rotación (10 minutos, por proveedor)

**OpenRouter:**
1. Genera una nueva clave en [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).
2. Actualiza `OPENROUTER_API_KEY` en Vercel → Project Settings → Environment Variables (entorno Production).
3. Actualiza `.env.local` en local si desarrollas con la clave real.
4. Revoca la clave antigua desde el dashboard de OpenRouter.
5. Los cambios en Vercel solo afectan a **nuevos despliegues** — haz un redeploy (o `git push` vacío) tras rotar.

**Supabase (service role):**
1. Project Settings → API → regenerar `service_role` key.
2. Actualizar `SUPABASE_SERVICE_ROLE_KEY` en Vercel y `.env.local`.
3. Redeploy.
4. La `anon` key normalmente no necesita rotarse a menos que haya evidencia de abuso — su seguridad depende de RLS, no de mantenerla secreta.

**Vercel/GitHub:** revocar sesiones activas desde la configuración de cuenta si se sospecha acceso no autorizado; regenerar tokens de `gh` CLI con `gh auth refresh` si es necesario.

## Regla permanente

Cualquier clave que aparezca pegada en un chat, captura de pantalla, o mensaje — de Claude, de otra IA, o de cualquier persona — se considera comprometida desde ese momento y debe rotarse, independientemente de si llegó a usarse o a subirse a algún sitio.
