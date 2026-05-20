# CLAUDE.md · defa-conaf

Balance Presupuestario Mensual CONAF · automatización del flujo SIGFE. **Proyecto PERSONAL**, NO parte del ecosistema VDRC.

@AGENTS.md

## Stack monorepo

```
defa-conaf/
├── api/              · Parser SIGFE (Next.js)
├── ui/               · Interfaz visual (Vite + React + Shadcn + Supabase)
└── blcemensual/      · Datos institucionales CONAF (XLS, DOCX) · gitignored
```

## Coordenadas

| Recurso | Identificador |
|---|---|
| GitHub | `ampidonoso/defa-conaf` (cuenta personal · NO VDRC) |
| Supabase (ui) | project ref `iikkpvvfnbcztcvsjvbz` (`CONAF - DEFA`) |
| Hosting | aún no deployado (futuro: Vercel personal) |
| CLI Supabase | `supabase` (default, cuenta personal) |

## Vínculo con otros proyectos

**Este repo es PERSONAL**, separado del ecosistema VDRC. Es uno de tus dos proyectos personales con `ampidonoso/asdr` (ver `fact_setup_multicuenta.md` en memoria).

| Sistema | Cómo se usa acá |
|---|---|
| **Supabase CONAF-DEFA** (`iikkpvvfnbcztcvsjvbz`) | Backend de `/ui` · puede estar pausado (Supabase Free pausa proyectos +7 días inactivos) |
| **HubSpot, MercadoPago, Clay, Resend** | NO se usan acá (todos VDRC) |
| **Supabase ERP / Comunidad** | NO accesibles desde acá |

## /api · parser SIGFE

Next.js. Lee reportes XLS del Sistema SIGFE (Sistema de Información para la Gestión Financiera del Estado) y los transforma en estructura procesable.

```bash
cd api
npm install
npm run dev   # http://localhost:3000
```

**Lectura obligatoria**: `AGENTS.md` (en raíz) avisa que esta Next.js tiene breaking changes vs la documentación de tu training data · leer `node_modules/next/dist/docs/` antes de escribir código.

## /ui · interfaz visual

Vite + React + Shadcn UI + Supabase. UI de exploración y exportación de balances.

```bash
cd ui
bun install
bun run dev   # http://localhost:5173
```

Si Supabase está pausado, restaurar antes de levantar dev:
→ `https://supabase.com/dashboard/project/iikkpvvfnbcztcvsjvbz` → "Restore project"

## /blcemensual · datos institucionales (gitignored)

Carpeta con XLS y DOCX reales del Balance Presupuestario. No va al repo público.

## Variables de entorno

`ui/.env` (gitignored):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Template en `.env.example` si existe.

## Reglas duras

1. **NO commitear `blcemensual/`** · datos institucionales sensibles.
2. **NO mezclar con VDRC** · este es CONAF personal.
3. **Verificar contra Supabase real** antes de afirmar estado de proyectos o data.

## Cuando trabajes acá

1. Feature branch.
2. Si modificás `/api`, lee primero `AGENTS.md` (Next.js breaking changes).
3. Si modificás `/ui`, asegurate que Supabase `iikkpvvfnbcztcvsjvbz` esté activo.
4. Commits en imperativo · email auto `amparodonosor@gmail.com` (configurado por repo).
