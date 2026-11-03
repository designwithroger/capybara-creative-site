import "server-only";
import conf from "../../content/colecciones.json";

/** Contenido publicado en el panel (Supabase). Solo lectura con la clave pública. */
export type Media = { url?: string; alt?: string } | null;
export type Item = { item_id: string; collection_id: string; slug: string; name: string; data: Record<string, unknown>; position: number };
export type Section = { id: string; name: string; values: Record<string, unknown> };
export type Page = { page_id: string; kind: string; slug: string; title: string; sections: Section[]; seo: Record<string, string> };

export const TENANT = process.env.CAPYBARA_TENANT_ID || conf.tenant;
export const TAG = "capybara";
const COLLECTIONS = conf.collections as Record<string, string>;

export type Content = {
  pages: Record<string, Page>;
  /** Fichas publicadas por colección (slug de la colección), en el orden del panel. */
  col: Record<string, Item[]>;
};

async function rest<T>(path: string, tags: string[]): Promise<T> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    next: { revalidate: 60, tags },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export async function getContent(): Promise<Content> {
  const t = encodeURIComponent(TENANT);
  const colTags = Object.keys(COLLECTIONS).map((c) => `${TAG}:${c}`);
  const [items, pages] = await Promise.all([
    rest<Item[]>(`published_items?tenant_id=eq.${t}&select=item_id,collection_id,slug,name,data,position&order=position.asc`, [TAG, ...colTags]),
    rest<Page[]>(`published_pages?tenant_id=eq.${t}&select=page_id,kind,slug,title,sections,seo`, [TAG, `${TAG}:pages`]),
  ]);
  const col: Record<string, Item[]> = Object.fromEntries(Object.keys(COLLECTIONS).map((c) => [c, []]));
  const slugOf = new Map(Object.entries(COLLECTIONS).map(([slug, id]) => [id, slug]));
  for (const it of items) {
    const s = slugOf.get(it.collection_id);
    if (s) col[s].push(it);
  }
  return { pages: Object.fromEntries(pages.map((p) => [p.slug, p])), col };
}

/** Valores de una página: todas sus secciones juntas, buscadas por id de sección. */
export function section(page: Page | undefined, id: string): Record<string, unknown> {
  return page?.sections.find((s) => s.id === id)?.values ?? {};
}
