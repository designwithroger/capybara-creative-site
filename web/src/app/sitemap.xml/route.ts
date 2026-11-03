import { getContent } from "@/lib/content";
import { allRoutes, SITE_URL } from "@/lib/render";

export const revalidate = 3600;

export async function GET() {
  const urls = allRoutes(await getContent())
    .map((r) => `  <url><loc>${SITE_URL}${r === "/" ? "/" : r}</loc></url>`)
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
