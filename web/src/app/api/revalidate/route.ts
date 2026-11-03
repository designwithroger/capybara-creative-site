import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** El panel llama aquí al publicar, para que el sitio vuelva a leer el contenido. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const given = req.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !same(secret, given)) return NextResponse.json({ ok: false }, { status: 401 });
  const { tags } = (await req.json().catch(() => ({}))) as { tags?: unknown };
  const list = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string").slice(0, 20) : [];
  list.forEach((t) => revalidateTag(t, "max"));
  return NextResponse.json({ ok: true, revalidated: list });
}
