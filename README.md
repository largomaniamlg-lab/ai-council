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
3. La app tiene dos motores intercambiables (mismo flujo, misma interfaz, ver
   [Motores del Consejo](#motores-del-consejo)):
   - **Council Simulator** (gratis): crea una cuenta en [openrouter.ai](https://openrouter.ai),
     genera una API key sin tarjeta y ponla en `OPENROUTER_API_KEY`. Usa un modelo `:free` para
     interpretar todos los roles.
   - **Live Mode**: rellena `OPENAI_API_KEY` para que cada rol use el proveedor configurado en
     `src/config/councilRoles.ts` (hoy, OpenAI para todos).
   Sin ninguna key configurada, el Council Simulator sigue funcionando con plantillas locales de
   respaldo (para no bloquear la demo mientras terminas el setup).
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

## Probar en el movil (PWA)

La app es una PWA instalable (icono, pantalla completa, sin tiendas de app). Para
probarla en tu telefono (Android o iPhone), conecta el telefono a la **misma red
WiFi** que este ordenador y sigue estos pasos:

1. Arranca el servidor en modo movil (genera un certificado HTTPS autofirmado,
   necesario para que el navegador ofrezca instalar la PWA):
   ```bash
   npm run dev:phone
   ```
2. En el telefono, abre el navegador (Chrome en Android, Safari en iPhone) y visita:
   ```
   https://10.242.152.87:3000
   ```
   (cambia la IP si tu ordenador tiene otra IP de WiFi; puedes verla con
   `ipconfig` en Windows, buscando el adaptador "Wi-Fi").
3. El navegador avisara de que el certificado no es de confianza (es
   autofirmado, solo para pruebas locales) — acepta/continua para visitarlo.
4. Instala la app:
   - **Android/Chrome**: menu (los 3 puntos) → "Anadir a pantalla de inicio" o
     el banner de instalacion que aparece solo.
   - **iPhone/Safari**: boton compartir → "Anadir a pantalla de inicio".
5. Se creara un icono en la pantalla de inicio que abre la app en modo
   pantalla completa (sin barra de navegador).

Nota: si cambias de red WiFi o tu ordenador cambia de IP, actualiza la IP en
`next.config.ts` (`allowedDevOrigins`) y en la URL que abras en el telefono.

## Compartir con otras personas (tunel publico, un solo comando)

Si quieres que alguien pruebe la app sin estar en tu misma red WiFi (por ejemplo,
un amigo desde su casa), usa:

```bash
npm run dev:tunnel
```

Esto arranca Next.js y un tunel publico de Cloudflare a la vez, y en cuanto esta
listo imprime un cuadro con la URL publica (tipo `https://algo.trycloudflare.com`),
lista para compartir. Si `cloudflared` no esta instalado, el script sigue
arrancando el servidor en local y te avisa con el comando exacto para instalarlo
(`winget install Cloudflare.cloudflared` en Windows, `brew install cloudflared`
en macOS). Si el tunel se cae en cualquier momento, veras un aviso claro en la
terminal.

Ten en cuenta que la URL es temporal: solo funciona mientras este comando siga
corriendo en tu ordenador. Para un enlace permanente que no dependa de tu PC,
consulta la seccion de despliegue en Vercel (proximo hito del proyecto).

Un build nativo instalable desde una tienda (APK firmado o app de iOS) es un
paso adicional no incluido todavia; la PWA es la forma mas rapida de probar la
app en el movil sin necesidad de Android Studio ni (sobre todo) de un Mac, que
es imprescindible para compilar para iOS.

## Motores del Consejo

La app tiene un unico Council Engine (`lib/orchestrator.ts` + `lib/minutes.ts`): recorre los
roles convocados, genera un prompt distinto para cada uno y llama a un proveedor de IA. La
interfaz, las tarjetas, el revelado progresivo y el acta son identicos sea cual sea el motor;
lo unico que cambia es quien responde por debajo:

- **Council Simulator** (toggle "Council Simulator" en la UI): fuerza a todos los roles y al
  Moderador a usar un unico modelo gratuito via OpenRouter (`OPENROUTER_API_KEY` +
  `OPENROUTER_SIMULATOR_MODEL`, ver `src/lib/simulatorEngine.ts`). Sirve para validar el metodo
  del Consejo sin apenas coste. Si no hay key configurada, cae en plantillas locales
  (`src/lib/demoContent.ts`) para que la demo nunca se rompa.
- **Live Mode** (toggle "Live Mode"): cada rol usa el proveedor/modelo que tenga asignado en
  `src/config/councilRoles.ts` (hoy, OpenAI para todos; el roadmap v1.5 asignara un proveedor
  real distinto a cada rol).

## Variables de entorno

Ver [`.env.local.example`](.env.local.example). Resumen:

| Variable | Obligatoria | Uso |
|---|---|---|
| `OPENROUTER_API_KEY` | No | Motor del Council Simulator (gratis, sin tarjeta) |
| `OPENROUTER_SIMULATOR_MODEL` | No | Sobreescribe el modelo `:free` usado por el Simulator |
| `OPENAI_API_KEY` | No | Motor de Live Mode (todos los roles, hoy) |
| `ANTHROPIC_API_KEY` | No | Reservada para v1.5 (Claude) |
| `GOOGLE_API_KEY` | No | Reservada para v1.5 (Gemini) |
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
  lib/orchestrator.ts          Council Engine: convoca a los especialistas segun el modo elegido
  lib/minutes.ts               El Moderador sintetiza las respuestas en un acta (JSON + Markdown)
  lib/simulatorEngine.ts       Proveedor/modelo unico usado por el Council Simulator
  lib/demoContent.ts           Plantillas de respaldo si el Simulator no tiene API key
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
