#!/usr/bin/env python3
"""Genera el SQL que da de alta a Capybara Creative en el panel (tenant, colecciones, fichas y páginas)
a partir del contenido que tenía el sitio en Netlify (content/*.json). Se corrió una sola vez."""
import json, os, re, sys, unicodedata, uuid

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
TENANT = "6f1c0a1e-5b7d-4c3a-9d2e-ca9b1c2e0001"
IMG = "https://capybaracreative.xyz"  # las imágenes viven en el sitio (/uploads)

def load(p): return json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
home, projects, ai = load("content/home.json"), load("content/projects.json")["projects"], load("content/ai-studio.json")

def q(v): return "'" + str(v).replace("'", "''") + "'"
def j(v): return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"
def slug(s):
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]
def img(p): return {"url": IMG + p, "alt": ""} if p else None
def uid(*k): return str(uuid.uuid5(uuid.UUID(TENANT), "/".join(k)))
def T(n, s, help=None):
    f = {"name": n, "slug": s, "type": "text"}
    if help: f["help"] = help
    return f
def I(n, s): return {"name": n, "slug": s, "type": "image"}

COLS = []  # (slug, name, singular, fields, items[(slug, name, data)])
proj_fields = [T("Etiquetas / sector", "sector"), T("Tarjeta: alcance", "scope"), T("Tarjeta: palabra del paquete", "stat"),
    T("Año", "year"), T("Paquete", "pkg"), I("Imagen de la tarjeta (4:3)", "thumb-image"), I("Imagen principal (16:8)", "hero-image"),
    T("Titular (About)", "about"), T("Reto", "challenge"), T("Solución", "solution"),
    I("Galería: ancha 1", "gallery-full-1"), I("Galería: detalle 1", "gallery-detail-1"), I("Galería: detalle 2", "gallery-detail-2"), I("Galería: ancha 2", "gallery-full-2")]
proj_fields += [T(f"Entregable {i}", f"deliverable-{i}") for i in range(1, 9)]
for i in range(1, 5):
    proj_fields += [T(f"Cifra {i}: valor", f"metric-{i}-value", "Número grande. Vacío = no se muestra" if i == 1 else None), T(f"Cifra {i}: texto", f"metric-{i}-label")]
items = []
for n, p in enumerate(projects, 1):
    d = {"sector": p["sector"], "scope": p["scope"], "stat": p["stat"], "year": p["year"], "pkg": p["pkg"],
         "thumb-image": img(p.get("thumbImage")), "hero-image": img(p.get("heroImage")), "about": p["about"],
         "challenge": p["challenge"], "solution": p["solution"], "gallery-full-1": img(p.get("galleryFull1")),
         "gallery-detail-1": img(p.get("galleryDetail1")), "gallery-detail-2": img(p.get("galleryDetail2")), "gallery-full-2": img(p.get("galleryFull2"))}
    for i in range(1, 9): d[f"deliverable-{i}"] = p["deliverables"][i - 1] if i <= len(p["deliverables"]) else ""
    m = p.get("metrics") or []
    for i in range(1, 5):
        d[f"metric-{i}-value"] = m[i - 1]["value"] if i <= len(m) else ""
        d[f"metric-{i}-label"] = m[i - 1]["label"] if i <= len(m) else ""
    items.append((f"project-{n}", p["name"], d))  # slug = URL actual (/project-1)
COLS.append(("proyectos", "Proyectos", "Proyecto", proj_fields, items))
COLS.append(("cinta", "Cinta animada (inicio)", "Frase", [], [(slug(m), m, {}) for m in home["marquee"]]))
COLS.append(("paquetes", "Paquetes", "Paquete", [T("Número", "num"), T("Descripción", "desc")],
             [(slug(s["name"]), s["name"], {"num": s["num"], "desc": s["desc"]}) for s in home["services"]]))
COLS.append(("pasos", "Pasos del proceso (inicio)", "Paso", [T("Número", "num"), T("Descripción", "desc")],
             [(slug(s["name"]), s["name"], {"num": s["num"], "desc": s["desc"]}) for s in home["steps"]]))
COLS.append(("ia-servicios", "AI Studio: servicios", "Servicio", [T("Número", "num"), T("Descripción", "desc"), T("Etiquetas", "tags")],
             [(slug(s["name"]), s["name"], {"num": s["num"], "desc": s["desc"], "tags": s["tags"]}) for s in ai["services"]]))
COLS.append(("ia-pasos", "AI Studio: pasos", "Paso", [T("Número", "num"), T("Descripción", "desc")],
             [(slug(s["name"]), s["name"], {"num": s["num"], "desc": s["desc"]}) for s in ai["steps"]]))
COLS.append(("ia-resultados", "AI Studio: resultados", "Resultado", [T("Descripción", "desc"), T("Cliente / sector", "client")],
             [(f"resultado-{i}", c["stat"], {"desc": c["desc"], "client": c["client"]}) for i, c in enumerate(ai["cases"], 1)]))
COLS.append(("ia-preguntas", "AI Studio: preguntas frecuentes", "Pregunta", [T("Respuesta", "answer")],
             [(f"pregunta-{i}", f["q"], {"answer": f["a"]}) for i, f in enumerate(ai["faqs"], 1)]))

def sec(sid, name, fields, values): return {"id": sid, "name": name, "fields": fields, "values": values}
PAGES = [
  ("page", "home", "Inicio", 0, [
    sec("c0a10001", "1. Portada", [T("Antetítulo", "eyebrow"), T("Título", "title"), T("Subtítulo", "subtitle")],
        {"eyebrow": home["eyebrow"], "title": home["heroTitle"], "subtitle": home["heroSubtitle"]}),
    sec("c0a10002", "2. Trabajo seleccionado", [T("Rango de años", "work-label")], {"work-label": home["workLabel"]}),
    sec("c0a10003", "3. Proceso", [T("Etiqueta", "process-label")], {"process-label": home["processLabel"]}),
    sec("c0a10004", "4. Testimonio", [T("Etiqueta", "quote-label"), T("Cita", "quote"), T("Autor", "quote-attr")],
        {"quote-label": home["quoteLabel"], "quote": home["quote"], "quote-attr": home["quoteAttr"]}),
  ], {"title": "Capybara Creative: Design & Webflow Development Agency", "description": home["heroSubtitle"]}),
  ("page", "ai-studio", "AI Studio", 1, [
    sec("c0a20001", "1. Portada", [T("Antetítulo", "eyebrow"), T("Título", "title"), T("Subtítulo", "subtitle"), T("Botón", "cta")],
        {"eyebrow": ai["eyebrow"], "title": ai["heroTitle"], "subtitle": ai["heroSubtitle"], "cta": ai["heroCta"]}),
    sec("c0a20002", "2. Servicios", [T("Etiqueta", "label"), T("Título", "title")], {"label": ai["servicesLabel"], "title": ai["servicesTitle"]}),
    sec("c0a20003", "3. Proceso", [T("Título", "title"), T("Etiqueta", "label")], {"title": ai["processTitle"], "label": ai["processLabel"]}),
    sec("c0a20004", "4. Resultados", [T("Etiqueta", "label"), T("Título", "title")], {"label": ai["resultsLabel"], "title": ai["resultsTitle"]}),
    sec("c0a20005", "5. Preguntas frecuentes", [T("Etiqueta", "label"), T("Título", "title")], {"label": ai["faqLabel"], "title": ai["faqTitle"]}),
    sec("c0a20006", "6. Contacto", [T("Etiqueta", "label"), T("Botón", "cta"), T("Texto", "subtext"), T("Correo", "email"), T("Asunto del correo", "subject")],
        {"label": ai["footerLabel"], "cta": ai["footerCta"], "subtext": ai["footerSubtext"], "email": ai["contactEmail"], "subject": ai["contactSubject"]}),
  ], {"title": ai["metaTitle"], "description": ai["metaDescription"]}),
  ("shared", "pie", "Pie de página", 2, [
    sec("c0a30001", "Contacto y redes", [T("Correo", "email"), {"name": "Instagram", "slug": "instagram", "type": "link"},
        {"name": "LinkedIn", "slug": "linkedin", "type": "link"}, {"name": "Dribbble", "slug": "dribbble", "type": "link"}, T("Derechos", "copyright")],
        {"email": home["footerEmail"], "instagram": home["socialInstagram"], "linkedin": home["socialLinkedin"],
         "dribbble": home["socialDribbble"], "copyright": home["copyright"]}),
  ], {}),
]

out = ["begin;",
  f"insert into tenants (id, slug, name, domain, settings) values ({q(TENANT)}, 'capybara', 'Capybara Creative', 'capybaracreative.xyz', '{{}}'::jsonb);"]
conf = {"tenant": TENANT, "collections": {}}
for pos, (cs, cn, sn, fields, its) in enumerate(COLS):
    cid = uid("col", cs)
    conf["collections"][cs] = cid
    out.append(f"insert into collections (id, tenant_id, slug, name, singular_name, fields, position) values ({q(cid)}, {q(TENANT)}, {q(cs)}, {q(cn)}, {q(sn)}, {j(fields)}, {pos});")
    for ipos, (isl, iname, data) in enumerate(its):
        iid = uid("item", cs, isl)
        out.append(f"insert into items (id, tenant_id, collection_id, slug, name, data, position, status, published_at) values ({q(iid)}, {q(TENANT)}, {q(cid)}, {q(isl)}, {q(iname)}, {j(data)}, {ipos}, 'published', now());")
for kind, ps, title, pos, sections, seo in PAGES:
    pid = uid("page", ps)
    out.append(f"insert into pages (id, tenant_id, kind, slug, title, sections, seo, position, status, published_at) values ({q(pid)}, {q(TENANT)}, {q(kind)}, {q(ps)}, {q(title)}, {j(sections)}, {j(seo)}, {pos}, 'published', now());")
out.append(f"insert into published_items (item_id, tenant_id, collection_id, slug, name, data, position, created_at) select id, tenant_id, collection_id, slug, name, data, position, created_at from items where tenant_id = {q(TENANT)};")
out.append(f"insert into published_pages (page_id, tenant_id, kind, slug, title, sections, seo) select id, tenant_id, kind, slug, title, sections, seo from pages where tenant_id = {q(TENANT)};")
out.append("commit;")
open(sys.argv[1], "w").write("\n".join(out))
json.dump(conf, open(os.path.join(os.path.dirname(__file__), "..", "content", "colecciones.json"), "w"), indent=2, ensure_ascii=False)
print(len(out), "sentencias")
