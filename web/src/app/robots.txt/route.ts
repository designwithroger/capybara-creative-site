import { SITE_URL } from "@/lib/render";

export const dynamic = "force-static";

/** En las vistas previas de Vercel no se indexa nada; en el dominio real, todo. */
export function GET() {
  const prod = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  const body = prod ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
