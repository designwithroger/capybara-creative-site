import { getContent } from "@/lib/content";
import { allRoutes, render404, renderAiStudio, renderHome, renderProject } from "@/lib/render";

/**
 * Todas las páginas del sitio. El diseño sale de templates/ (igual al sitio anterior en Netlify)
 * y el contenido del panel. Se regenera cada minuto o al momento cuando el panel avisa.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  return allRoutes(await getContent()).map((r) => ({ path: r === "/" ? [] : r.slice(1).split("/") }));
}

const HTML = { "content-type": "text/html; charset=utf-8" };

export async function GET(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const parts = (path ?? []).map((p) => decodeURIComponent(p));
  const c = await getContent();
  let html: string | null = null;
  if (parts.length === 0) html = renderHome(c);
  else if (parts.length === 1 && parts[0] === "ai-studio") html = renderAiStudio(c);
  else if (parts.length === 1) html = renderProject(c, parts[0]);
  if (html) return new Response(html, { headers: HTML });
  return new Response(render404(), { status: 404, headers: HTML });
}
