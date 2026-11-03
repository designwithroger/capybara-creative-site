# Sitio de Capybara Creative (capybaracreative.xyz)

Next.js en Vercel. El diseño está en `templates/*.html` (copia del sitio que estaba en Netlify) y el contenido
se edita en el panel multicliente (cliente **Capybara Creative**, Supabase compartido).

- `src/lib/render.ts`: arma cada página (misma lógica que el antiguo `scripts/prerender.mjs`).
- `src/lib/content.ts`: lee `published_pages` y `published_items` del tenant (`content/colecciones.json`).
- Rutas: `/`, `/ai-studio`, `/<slug del proyecto>` (los 4 actuales son `project-1` a `project-4`). Las direcciones viejas con `.html` redirigen.
- `/admin` manda al panel. Decap CMS y Netlify Identity quedan fuera.
- `/api/revalidate`: el panel avisa al publicar (cabecera `x-revalidate-secret`). Sin eso, el sitio se refresca cada 60 s.
- `scripts/seed_panel.py`: carga inicial del contenido en el panel (ya corrida el 2026-11-03).

Variables: ver `.env.example`.

Mientras el dominio siga en Netlify, la raíz del repo sigue siendo el sitio viejo; este directorio (`web/`) es la raíz del proyecto en Vercel.
