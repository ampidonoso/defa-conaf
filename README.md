# defa-conaf

Balance Presupuestario Mensual CONAF · automatización del flujo SIGFE.

Monorepo con dos paquetes:

```
defa-conaf/
├── api/              Parser SIGFE (Next.js)
├── ui/               Interfaz visual (Vite + React + Shadcn + Supabase)
├── blcemensual/      Datos CONAF reales · gitignored
└── README.md
```

## `/api` · parser SIGFE

Next.js. Lee los reportes del Sistema de Información para la Gestión Financiera del Estado (SIGFE) y los transforma en estructura procesable.

```bash
cd api
npm install
npm run dev   # http://localhost:3000
```

## `/ui` · interfaz visual

Vite + React + Shadcn UI + Supabase. UI de exploración y exportación de balances.

```bash
cd ui
bun install
bun run dev   # http://localhost:5173
```

Requiere `ui/.env` con credenciales Supabase (ver `ui/.env.example` si existe, o configurar manualmente).

## `/blcemensual` · datos institucionales

Carpeta con XLS, DOCX y previews del Balance Presupuestario. **No va al repo** (gitignored) por contener datos institucionales sensibles.

Para correr el parser con datos reales, descargá los XLS desde SIGFE y colocálos acá.

## Stack

- **Backend / parser**: Next.js 15, TypeScript
- **Frontend / UI**: Vite, React, Shadcn UI, Tailwind, Supabase
- **Testing UI**: Playwright + Vitest
- **Lenguaje**: TypeScript en todo

## Despliegue

- `/api` se despliega como Next.js app (Vercel o Cloudflare).
- `/ui` se despliega como SPA estática (Vercel, Netlify o Cloudflare Pages).
- La data nunca sale del entorno local. SIGFE no expone API pública, se trabaja con descargas manuales.

## Autora

Amparo Donoso Rodríguez · Abogada Provincial OP Ranco · CONAF Los Ríos · 2026
