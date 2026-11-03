import "server-only";
import { TEMPLATES } from "./templates";
import { section, type Content, type Item, type Media } from "./content";

/**
 * Arma cada página con las plantillas del sitio (las mismas que tenía en Netlify)
 * y el contenido publicado en el panel. Misma lógica que el antiguo scripts/prerender.mjs.
 */
export const SITE_URL = (process.env.SITE_URL || "https://capybaracreative.xyz").replace(/\/$/, "");

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
function safeHref(v: unknown) {
  const s = str(v).trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(s) ? s : "";
}

function setInnerById(html: string, id: string, inner: string) {
  const re = new RegExp('(<([a-zA-Z0-9-]+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(<\\/\\2>)');
  const m = html.match(re);
  if (!m || m.index === undefined) throw new Error("setInnerById: no existe el id " + id);
  return html.slice(0, m.index) + m[1] + inner + m[4] + html.slice(m.index + m[0].length);
}

function setAttrById(html: string, id: string, attr: string, value: string) {
  const m = html.match(new RegExp('<([a-zA-Z0-9-]+)\\b[^>]*\\bid="' + id + '"[^>]*>'));
  if (!m || m.index === undefined) throw new Error("setAttrById: no existe el id " + id);
  const open = m[0];
  const attrRe = new RegExp("(\\b" + attr + '=")([^"]*)(")');
  const next = attrRe.test(open) ? open.replace(attrRe, (_a, p1, _p2, p3) => p1 + value + p3) : open.replace(/>$/, " " + attr + '="' + value + '">');
  return html.slice(0, m.index) + next + html.slice(m.index + open.length);
}

type Head = { title: string; description: string; url: string; image?: string; jsonLd?: unknown };

function seoBlock({ title, description, url, image, jsonLd }: Head) {
  let out = '<link rel="canonical" href="' + url + '">\n';
  out += '<meta property="og:type" content="website">\n';
  out += '<meta property="og:title" content="' + esc(title) + '">\n';
  out += '<meta property="og:description" content="' + esc(description) + '">\n';
  out += '<meta property="og:url" content="' + url + '">\n';
  if (image) out += '<meta property="og:image" content="' + esc(image) + '">\n';
  out += '<meta name="twitter:card" content="summary_large_image">\n';
  out += '<meta name="twitter:title" content="' + esc(title) + '">\n';
  out += '<meta name="twitter:description" content="' + esc(description) + '">\n';
  if (jsonLd) out += '<script type="application/ld+json">' + JSON.stringify(jsonLd).replace(/</g, "\\u003c") + "</script>\n";
  return out;
}

function applyHead(html: string, h: Head) {
  html = setInnerById(html, "doc-title", esc(h.title));
  html = setAttrById(html, "doc-desc", "content", esc(h.description));
  return html.replace("<!-- SEO_EXTRA -->", seoBlock(h));
}

function mediaUrl(v: unknown) {
  const m = v as Media;
  const url = m && typeof m === "object" ? safeHref(m.url) : "";
  // Las imágenes migradas viven en /uploads de este mismo sitio: se sirven con ruta local.
  return url.replace(/^https:\/\/(www\.)?capybaracreative\.xyz(?=\/)/, "");
}
function frame(v: unknown, tag: string) {
  const url = mediaUrl(v);
  if (url) return '<img src="' + esc(url) + '" alt="' + esc((v as Media)?.alt ?? "") + '" style="width:100%;height:100%;object-fit:cover">';
  return '<span class="tag mono">' + esc(tag) + "</span>";
}
const absolute = (u: string) => (u.startsWith("/") ? SITE_URL + u : u);
const pad = (n: number) => (n < 10 ? "0" + n : String(n));

function footer(c: Content) {
  const f = section(c.pages.pie, "c0a30001");
  return {
    email: str(f.email) || "hello@capybaracreative.xyz",
    instagram: safeHref(f.instagram),
    linkedin: safeHref(f.linkedin),
    dribbble: safeHref(f.dribbble),
    copyright: str(f.copyright),
  };
}

export function projectPath(p: Item) {
  return "/" + p.slug;
}

// ================= INICIO =================
export function renderHome(c: Content) {
  const page = c.pages.home;
  const hero = section(page, "c0a10001");
  const work = section(page, "c0a10002");
  const proc = section(page, "c0a10003");
  const quote = section(page, "c0a10004");
  const foot = footer(c);
  const projects = c.col.proyectos;
  let html: string = TEMPLATES.index;

  html = setInnerById(html, "h-eyebrow", esc(hero.eyebrow));
  html = setInnerById(html, "h-title", esc(hero.title));
  html = setInnerById(html, "h-subtitle", esc(hero.subtitle));
  html = setInnerById(html, "h-work-label", esc(work["work-label"]));
  html = setInnerById(html, "h-process-label", esc(proc["process-label"]));
  html = setInnerById(html, "h-quote-label", esc(quote["quote-label"]));
  html = setInnerById(html, "h-quote", "“" + esc(quote.quote) + "”");
  html = setInnerById(html, "h-quote-attr", esc(quote["quote-attr"]));
  html = setInnerById(html, "h-copyright", esc(foot.copyright));
  html = setInnerById(html, "h-footer-email", esc(foot.email.toUpperCase()));
  html = setAttrById(html, "h-footer-email-link", "href", "mailto:" + esc(foot.email));
  if (foot.instagram) html = setAttrById(html, "h-social-instagram", "href", esc(foot.instagram));
  if (foot.linkedin) html = setAttrById(html, "h-social-linkedin", "href", esc(foot.linkedin));
  if (foot.dribbble) html = setAttrById(html, "h-social-dribbble", "href", esc(foot.dribbble));

  const marquee = c.col.cinta.map((m) => "<span>" + esc(m.name) + "</span>").join("");
  html = setInnerById(html, "h-marquee", marquee + marquee);

  html = setInnerById(
    html,
    "h-work-grid",
    projects
      .map((p, i) => {
        const d = p.data;
        return (
          '<a class="work-card" data-reveal href="' + esc(projectPath(p)) + '">' +
          '<div class="work-thumb">' + frame(d["thumb-image"], "DROP PROJECT IMAGE, 4:3") + '<span class="idx mono">' + pad(i + 1) + "</span></div>" +
          '<div class="work-title-row"><span class="name">' + esc(p.name) + '</span><span class="sector mono">' + esc(d.sector) + "</span></div>" +
          '<div class="work-meta-row"><span class="scope">' + esc(d.scope) + '</span><span class="stat mono">' + esc(d.stat) + "</span></div>" +
          "</a>"
        );
      })
      .join(""),
  );

  html = setInnerById(
    html,
    "h-services",
    c.col.paquetes
      .map((s) => '<div class="service-row" data-reveal><span class="num mono">' + esc(s.data.num) + '</span><span class="name">' + esc(s.name) + '</span><span class="desc">' + esc(s.data.desc) + "</span></div>")
      .join(""),
  );
  html = setInnerById(
    html,
    "h-steps",
    c.col.pasos
      .map((s) => '<div class="process-cell" data-reveal><span class="num mono">' + esc(s.data.num) + '</span><span class="name">' + esc(s.name) + '</span><span class="desc">' + esc(s.data.desc) + "</span></div>")
      .join(""),
  );

  const title = page?.seo?.title || "Capybara Creative: Design & Webflow Development Agency";
  const description = page?.seo?.description || str(hero.subtitle);
  return applyHead(html, {
    title,
    description,
    url: SITE_URL + "/",
    image: page?.seo?.image ? absolute(page.seo.image) : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Capybara Creative",
      description,
      url: SITE_URL + "/",
      email: foot.email,
      sameAs: [foot.instagram, foot.linkedin, foot.dribbble].filter(Boolean),
    },
  });
}

// ================= AI STUDIO =================
export function renderAiStudio(c: Content) {
  const page = c.pages["ai-studio"];
  const hero = section(page, "c0a20001");
  const serv = section(page, "c0a20002");
  const proc = section(page, "c0a20003");
  const res = section(page, "c0a20004");
  const faq = section(page, "c0a20005");
  const contact = section(page, "c0a20006");
  let html: string = TEMPLATES["ai-studio"];

  html = setInnerById(html, "a-eyebrow", esc(hero.eyebrow));
  html = setInnerById(html, "a-title", esc(hero.title));
  html = setInnerById(html, "a-subtitle", esc(hero.subtitle));
  html = setInnerById(html, "a-hero-cta", esc(hero.cta));

  html = setInnerById(html, "a-services-label", esc(serv.label));
  html = setInnerById(html, "a-services-title", esc(serv.title));
  html = setInnerById(
    html,
    "a-services-grid",
    c.col["ia-servicios"]
      .map((s) => '<div class="ai-service-cell"><span class="num mono">' + esc(s.data.num) + "</span><h3>" + esc(s.name) + "</h3><p>" + esc(s.data.desc) + '</p><span class="tags mono">' + esc(s.data.tags) + "</span></div>")
      .join(""),
  );

  html = setInnerById(html, "a-process-title", esc(proc.title));
  html = setInnerById(html, "a-process-label", esc(proc.label));
  html = setInnerById(
    html,
    "a-steps-grid",
    c.col["ia-pasos"].map((s) => '<div class="ai-step-cell"><span class="num mono">' + esc(s.data.num) + "</span><h3>" + esc(s.name) + "</h3><p>" + esc(s.data.desc) + "</p></div>").join(""),
  );

  html = setInnerById(html, "a-results-label", esc(res.label));
  html = setInnerById(html, "a-results-title", esc(res.title));
  html = setInnerById(
    html,
    "a-cases-grid",
    c.col["ia-resultados"].map((r) => '<div class="ai-case-cell"><span class="stat">' + esc(r.name) + "</span><p>" + esc(r.data.desc) + '</p><span class="client mono">' + esc(r.data.client) + "</span></div>").join(""),
  );

  html = setInnerById(html, "a-faq-label", esc(faq.label));
  html = setInnerById(html, "a-faq-title", esc(faq.title));
  html = setInnerById(
    html,
    "a-faq-list",
    c.col["ia-preguntas"]
      .map(
        (f, i) =>
          '<div class="ai-faq-item" data-idx="' + i + '"><button class="ai-faq-toggle" type="button" aria-expanded="false"><span class="q">' + esc(f.name) +
          '</span><span class="sign mono">+</span></button><p class="ai-faq-answer">' + esc(f.data.answer) + "</p></div>",
      )
      .join(""),
  );

  const email = str(contact.email) || "hello@capybaracreative.xyz";
  html = setInnerById(html, "a-footer-label", esc(contact.label));
  html = setInnerById(html, "a-footer-cta", esc(contact.cta));
  html = setAttrById(html, "a-footer-cta", "href", "mailto:" + esc(email) + "?subject=" + encodeURIComponent(str(contact.subject)));
  html = setInnerById(html, "a-footer-subtext", esc(contact.subtext));
  html = setInnerById(html, "a-footer-email", esc(email.toUpperCase()));

  const title = page?.seo?.title || "Capybara AI Studio";
  const description = page?.seo?.description || str(hero.subtitle);
  return applyHead(html, {
    title,
    description,
    url: SITE_URL + "/ai-studio",
    image: page?.seo?.image ? absolute(page.seo.image) : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Capybara AI Studio",
      description,
      provider: { "@type": "Organization", name: "Capybara Creative", url: SITE_URL + "/" },
      url: SITE_URL + "/ai-studio",
    },
  });
}

// ================= PROYECTO =================
export function renderProject(c: Content, slug: string) {
  const list = c.col.proyectos;
  const idx = list.findIndex((p) => p.slug === slug);
  if (idx < 0) return null;
  const p = list[idx];
  const d = p.data;
  const next = list[(idx + 1) % list.length];
  const foot = footer(c);
  let html: string = TEMPLATES.project;

  html = setInnerById(html, "p-name", esc(p.name));
  html = setInnerById(html, "p-year", esc(d.year));
  html = setInnerById(html, "p-sector", esc(d.sector));
  html = setInnerById(html, "p-pkg", esc(d.pkg) + " PACKAGE");
  html = setInnerById(html, "p-hero-frame", frame(d["hero-image"], "DROP HERO IMAGE: " + p.name.toUpperCase()));
  html = setInnerById(html, "p-about", esc(d.about));
  html = setInnerById(html, "p-challenge", esc(d.challenge));
  html = setInnerById(html, "p-solution", esc(d.solution));

  const metrics = [1, 2, 3, 4]
    .map((i) => ({ value: str(d[`metric-${i}-value`]), label: str(d[`metric-${i}-label`]) }))
    .filter((m) => m.value || m.label);
  html = setInnerById(
    html,
    "p-metrics",
    metrics.map((m) => '<div class="metric-cell"><span class="value">' + esc(m.value) + '</span><span class="label mono">' + esc(m.label) + "</span></div>").join(""),
  );
  html = setAttrById(html, "p-metrics", "style", metrics.length ? "--metric-count:" + metrics.length : "display:none");

  html = setInnerById(html, "p-gallery-full-1", frame(d["gallery-full-1"], "FULL-WIDTH SHOT, DESKTOP UI / BRAND IN USE"));
  html = setInnerById(html, "p-gallery-detail-1", frame(d["gallery-detail-1"], "DETAIL, MOBILE / COMPONENTS"));
  html = setInnerById(html, "p-gallery-detail-2", frame(d["gallery-detail-2"], "DETAIL, TYPOGRAPHY / LOGO"));
  html = setInnerById(html, "p-gallery-full-2", frame(d["gallery-full-2"], "FULL-WIDTH SHOT, FINAL SITE / LAUNCH"));

  const deliverables = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => str(d[`deliverable-${i}`])).filter(Boolean);
  html = setInnerById(
    html,
    "p-deliverables",
    deliverables.map((name, i) => '<div class="deliverable-row"><span class="num mono">' + pad(i + 1) + '</span><span class="name">' + esc(name) + "</span></div>").join(""),
  );

  html = setAttrById(html, "p-next-link", "href", esc(projectPath(next)));
  html = setInnerById(html, "p-next-name", esc(next.name));
  html = setInnerById(html, "p-next-meta", esc(next.data.sector) + " · " + esc(next.data.year));

  html = setAttrById(html, "p-footer-email-link", "href", "mailto:" + esc(foot.email));
  html = setInnerById(html, "p-footer-email", esc(foot.email.toUpperCase()));
  html = setInnerById(html, "p-copyright", esc(foot.copyright));
  if (foot.instagram) html = setAttrById(html, "p-social-instagram", "href", esc(foot.instagram));
  if (foot.linkedin) html = setAttrById(html, "p-social-linkedin", "href", esc(foot.linkedin));
  if (foot.dribbble) html = setAttrById(html, "p-social-dribbble", "href", esc(foot.dribbble));

  const hero = mediaUrl(d["hero-image"]);
  const url = SITE_URL + projectPath(p);
  return applyHead(html, {
    title: "Capybara Creative: " + p.name,
    description: str(d.about),
    url,
    image: hero ? absolute(hero) : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: p.name,
      description: str(d.about),
      creator: { "@type": "Organization", name: "Capybara Creative", url: SITE_URL + "/" },
      url,
    },
  });
}

export function render404() {
  return TEMPLATES["404"];
}

/** Todas las rutas del sitio (para el sitemap y la generación estática). */
export function allRoutes(c: Content) {
  return ["/", "/ai-studio", ...c.col.proyectos.map(projectPath)];
}
