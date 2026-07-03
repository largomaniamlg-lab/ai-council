# AI Council (MVP personal)

Aplicacion web tipo chat donde el usuario actua como **Presidente del Consejo**: plantea una
decision o problema, varios especialistas de IA con roles fijos (Riesgos, Analista Critico,
Creativo, Investigador, CFO, Legal, Etico, Abogado del Diablo) generan su informe por
separado, un Moderador redacta un acta final (acuerdos, desacuerdos, riesgos, preguntas
abiertas y recomendacion) y el Presidente escribe su decision final. El sistema nunca decide
por ti.

## Como ejecutar el proyecto en local

1. Instala dependencias (ya instaladas si acabas de generar el proyecto):
   ```bash
   npm install
   ```
2. Copia el archivo de variables de entorno de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```
3. Rellena al menos `OPENAI_API_KEY` en `.env.local` (imprescindible para poder consultar al
   Consejo en este MVP; todos los roles se simulan con prompts distintos sobre el mismo
   modelo).
4. (Opcional pero recomendado) Configura Supabase para guardar proyectos, sesiones, actas,
   decisiones y resultados:
   - Crea un proyecto en [supabase.com](https://supabase.com).
   - Ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de
     Supabase.
   - Rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
     `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (Project Settings > API).
   - Sin Supabase configurado la app funciona igualmente: puedes consultar al Consejo y ver el
     acta, pero los proyectos/sesiones no se guardan entre recargas (veras un aviso en la
     barra lateral).
5. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
6. Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver [`.env.local.example`](.env.local.example). Resumen:

| Variable | Obligatoria | Uso |
|---|---|---|
| `OPENAI_API_KEY` | Si | Motor de IA usado por todos los roles en el MVP |
| `ANTHROPIC_API_KEY` | No | Reservada para v1.5 (Claude) |
| `GOOGLE_API_KEY` | No | Reservada para v1.5 (Gemini) |
| `OPENROUTER_API_KEY` | No | Reservada para v1.5 (OpenRouter) |
| `XAI_API_KEY` | No | Reservada para v1.5 (Grok) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Persistencia de proyectos/sesiones/actas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Cliente Supabase en navegador (reservado) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Cliente Supabase en el servidor (API routes) |

## Estructura del proyecto

```
src/
  config/councilRoles.ts       Roles fijos del Consejo: prompt base, modelo, color
  lib/aiProviders/             Interfaz comun AIProvider + adaptadores (openai activo,
                                anthropic/gemini/openrouter/xai preparados para v1.5)
  lib/orchestrator.ts          Convoca a los especialistas segun el modo elegido
  lib/minutes.ts               El Moderador sintetiza las respuestas en un acta (JSON + Markdown)
  lib/data.ts                  Acceso a Supabase (proyectos, sesiones, respuestas, actas...)
  lib/supabase/                Clientes de Supabase (server / browser)
  app/api/council/session      POST: inicia una deliberacion del Consejo
  app/api/council/minutes      POST: genera el acta final
  app/api/council/decision     POST: guarda la decision del Presidente
  app/api/council/outcome      POST: guarda el resultado real y los aprendizajes
  app/api/projects             GET/POST: proyectos
  app/api/sessions             GET: sesiones de un proyecto / detalle de una sesion
  components/                  Sidebar, ModeSelector, RolePicker, SpecialistCard, ActaPanel
supabase/schema.sql             Schema SQL para Supabase
```

## Modos de uso

- **Rapido**: solo Director de Riesgos y Analista Critico (bajo coste).
- **Consejo completo**: Riesgos, Critico, Creativo, Investigador y CFO.
- **Debate**: primera ronda independiente, segunda ronda respondiendo a los desacuerdos.
- **Experto**: eliges manualmente que especialistas convocar.

## Roadmap

Ver la seccion "Roadmap futuro" del plan original: v1.0 (este MVP, roles simulados con una
API), v1.5 (roles reales en distintos proveedores), v2 (rondas de debate ampliadas), v3
(aprendizaje comparando decisiones y resultados), v4/v5 (producto comercial multi-usuario).
