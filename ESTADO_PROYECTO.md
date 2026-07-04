# AI Council — Estado del proyecto (resumen para compartir)

## Que es
MVP personal de "Consejo de IA": el usuario (Presidente) plantea una decision o
problema, varios especialistas de IA con roles fijos responden por separado,
un Moderador redacta un acta final (acuerdos, desacuerdos, riesgos, preguntas
abiertas, recomendacion), y el Presidente escribe su decision final. Ninguna
IA decide por el usuario. Basado en el documento "Plan_Claude_Code_Consejo_de_IA".

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4.
- React 19.
- OpenAI SDK (`openai` npm package) para el proveedor de IA activo.
- Supabase (`@supabase/supabase-js`) para persistencia opcional.
- Proyecto local en `Desktop/ai-council`, con git inicializado (2 commits, sin
  remoto configurado todavia). Node v22, npm 11.

## Estructura de carpetas
```
src/
  config/councilRoles.ts        Roles fijos: prompt base, proveedor, modelo, color
  lib/
    types.ts                    Tipos de dominio (AgentResponse, CouncilMinutes, etc.)
    orchestrator.ts             Convoca especialistas segun el modo elegido
    minutes.ts                  El Moderador sintetiza respuestas en un acta (JSON + Markdown)
    data.ts                     Acceso a Supabase (proyectos, sesiones, actas, decisiones, outcomes)
    aiProviders/
      types.ts                  Interfaz comun AIProvider
      openai.ts                 Implementado y funcional
      anthropic.ts              Stub (lanza error "no implementado", listo para v1.5)
      gemini.ts                 Stub
      openrouter.ts             Implementado (usa fetch directo a la API de OpenRouter)
      xai.ts                    Stub
      index.ts                  Registro de proveedores por id
    supabase/
      server.ts                 Cliente server-side (service role key)
      client.ts                 Cliente browser (anon key, reservado, no usado aun)
  app/
    page.tsx                    Server component: carga proyectos + flag supabaseConfigured
    layout.tsx
    api/
      council/session/route.ts  POST: ejecuta el orquestador, guarda sesion+respuestas si hay Supabase
      council/minutes/route.ts  POST: genera el acta via Moderador, guarda si hay Supabase
      council/decision/route.ts POST: guarda decision del Presidente
      council/outcome/route.ts  POST: guarda resultado real y aprendizajes
      projects/route.ts         GET/POST proyectos
      sessions/route.ts         GET sesiones de un proyecto
      sessions/[id]/route.ts    GET detalle completo de una sesion
  components/
    AppShell.tsx                Componente raiz cliente: estado global de la UI
    Sidebar.tsx                 Proyectos, nuevo proyecto, historial de sesiones
    ModeSelector.tsx            Rapido / Consejo completo / Debate / Experto
    RolePicker.tsx               Seleccion manual de especialistas (modo experto)
    SpecialistCard.tsx          Tarjeta de respuesta de un especialista
    ActaPanel.tsx                Acta final + formulario decision + formulario outcome
supabase/schema.sql              Schema SQL completo para Supabase
.env.local.example                Plantilla de variables de entorno
README.md                         Instrucciones de instalacion y ejecucion
```

## Roles del Consejo (src/config/councilRoles.ts)
Director de Riesgos, Analista Critico, Director Creativo, Investigador,
Economista/CFO, Legal/Compliance, Etico/Reputacional, Abogado del Diablo, y
Moderador (rol especial que sintetiza, no se convoca como especialista normal).
Todos usan hoy el mismo proveedor (OpenAI, modelo `gpt-4o-mini`) con prompts
distintos; la arquitectura ya soporta asignar proveedor/modelo por rol.

## Modos de consulta
- **Rapido**: solo Riesgos + Critico (bajo coste).
- **Completo**: Riesgos, Critico, Creativo, Investigador, CFO.
- **Debate**: 2 rondas — primera independiente, segunda respondiendo a los
  desacuerdos vistos en la primera.
- **Experto**: el usuario elige manualmente que especialistas convocar.

## Modelo de datos (Supabase, ver supabase/schema.sql)
Tablas: `projects`, `sessions`, `agent_responses`, `council_minutes`,
`president_decisions`, `outcomes`, `settings`. RLS desactivado (MVP de un solo
usuario).

## Persistencia con fallback (clave del diseño actual)
Si `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no estan en
`.env.local`, la app sigue funcionando: se puede consultar al Consejo y ver el
acta, pero no se guardan proyectos ni sesiones (se muestra un aviso amarillo en
la barra lateral). Esto se comprobo manualmente en el navegador.

## Que esta verificado
- `npx tsc --noEmit` — sin errores.
- `npm run lint` (ESLint) — sin errores ni warnings.
- `npm run build` — build de produccion correcto, todas las rutas compilan.
- Prueba manual en navegador (servidor dev local): flujo completo
  consulta → tarjetas de especialistas → acta del Moderador → guardar decision
  → aparece formulario de resultado real. Probado sin `OPENAI_API_KEY` real
  para confirmar que degrada con mensajes de error claros en vez de romperse.

## Pendiente / bloqueado ahora mismo
1. **Falta `OPENAI_API_KEY` real** en `.env.local` para probar respuestas de
   IA reales (no simuladas). El usuario esta decidiendo entre:
   - Pagar OpenAI (requiere anadir metodo de pago en platform.openai.com).
   - Usar **OpenRouter** en su lugar (tiene modelos gratuitos con sufijo
     `:free`, no requiere tarjeta). El adaptador OpenRouter ya esta
     implementado y funcional en `src/lib/aiProviders/openrouter.ts`; solo
     faltaria cambiar el `provider`/`model` de los roles en
     `councilRoles.ts` para apuntar a un modelo `:free` y poner
     `OPENROUTER_API_KEY`.
2. **Supabase no configurado todavia** (opcional): sin el, no hay
   persistencia de proyectos/sesiones entre recargas.
3. **App movil**: el usuario ha pedido una version descargable para Android e
   iOS para probar en el telefono. Pendiente de decidir el enfoque (ver
   limitaciones abajo).

## Limitaciones conocidas a tener en cuenta
- Entorno de desarrollo es **Windows** (no Mac). Un build nativo de iOS
  (.ipa firmado, TestFlight, App Store) **requiere Xcode, que solo corre en
  macOS** — no es posible generar eso desde este equipo sin acceso a un Mac o
  un servicio de build en la nube para iOS.
- Un APK de Android si es viable desde Windows (Android Studio + Gradle
  corren en Windows), pero es un paso adicional (empaquetar con Capacitor o
  similar) todavia no iniciado.
- Alternativa mas rapida para "probar en el movil hoy": convertir la web app
  en PWA (manifest + iconos, instalable con "Anadir a pantalla de inicio" en
  Android/Chrome y iOS/Safari) y exponerla via red local o un deploy (p.ej.
  Vercel). Mas simple que builds nativos, funciona en ambos sistemas, no
  requiere Mac ni tiendas de aplicaciones.

## Roadmap original (del documento de plan)
- v1.0 (este MVP): roles simulados con una API, actas y decisiones guardadas.
- v1.5: asignar roles reales a distintos proveedores (Claude, Gemini, Grok,
  OpenRouter).
- v2: rondas de debate ampliadas.
- v3: aprendizaje comparando decisiones pasadas con resultados reales.
- v4/v5: producto comercial multiusuario (planes de pago, workspaces, etc.).
