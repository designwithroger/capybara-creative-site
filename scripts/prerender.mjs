#!/usr/bin/env node
// Reads content/*.json + templates/*.html and bakes real, crawlable HTML
// into the published pages, so a plain HTTP fetch (no JS execution) sees
// real text: page titles, meta descriptions, OG/Twitter tags, JSON-LD,
// and the full page body. Runs on every Netlify build (see netlify.toml).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SITE_URL = 'https://capybaracreative.xyz';

function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }
function write(p, content) { fs.writeFileSync(path.join(root, p), content, 'utf8'); }
function readJson(p) { return JSON.parse(read(p)); }

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setInnerById(html, id, inner) {
  const re = new RegExp('(<([a-zA-Z0-9-]+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(<\\/\\2>)');
  const m = html.match(re);
  if (!m) throw new Error('setInnerById: id not found: "' + id + '"');
  return html.slice(0, m.index) + m[1] + inner + m[4] + html.slice(m.index + m[0].length);
}

function setAttrById(html, id, attr, value) {
  const openRe = new RegExp('<([a-zA-Z0-9-]+)\\b[^>]*\\bid="' + id + '"[^>]*>');
  const m = html.match(openRe);
  if (!m) throw new Error('setAttrById: id not found: "' + id + '"');
  const openTag = m[0];
  const attrRe = new RegExp('(\\b' + attr + '=")([^"]*)(")');
  const newOpenTag = attrRe.test(openTag)
    ? openTag.replace(attrRe, (mm, p1, p2, p3) => p1 + value + p3)
    : openTag.replace(/>$/, ' ' + attr + '="' + value + '">');
  return html.slice(0, m.index) + newOpenTag + html.slice(m.index + m[0].length);
}

function seoBlock({ title, description, url, image, jsonLd }) {
  let out = '';
  out += '<link rel="canonical" href="' + url + '">\n';
  out += '<meta property="og:type" content="website">\n';
  out += '<meta property="og:title" content="' + esc(title) + '">\n';
  out += '<meta property="og:description" content="' + esc(description) + '">\n';
  out += '<meta property="og:url" content="' + url + '">\n';
  if (image) out += '<meta property="og:image" content="' + image + '">\n';
  out += '<meta name="twitter:card" content="summary_large_image">\n';
  out += '<meta name="twitter:title" content="' + esc(title) + '">\n';
  out += '<meta name="twitter:description" content="' + esc(description) + '">\n';
  if (jsonLd) {
    out += '<script type="application/ld+json">' + JSON.stringify(jsonLd).replace(/</g, '\\u003c') + '</script>\n';
  }
  return out;
}

function applyHead(html, opts) {
  html = setInnerById(html, 'doc-title', esc(opts.title));
  html = setAttrById(html, 'doc-desc', 'content', esc(opts.description));
  return html.replace('<!-- SEO_EXTRA -->', seoBlock(opts));
}

function frame(imagePath, tag) {
  if (imagePath) return '<img src="' + imagePath + '" alt="" style="width:100%;height:100%;object-fit:cover">';
  return '<span class="tag mono">' + esc(tag) + '</span>';
}

const home = readJson('content/home.json');
const projectsData = readJson('content/projects.json').projects;
const ai = readJson('content/ai-studio.json');

// ================= HOME =================
let indexHtml = read('templates/index.html');

indexHtml = setInnerById(indexHtml, 'h-eyebrow', esc(home.eyebrow));
indexHtml = setInnerById(indexHtml, 'h-title', esc(home.heroTitle));
indexHtml = setInnerById(indexHtml, 'h-subtitle', esc(home.heroSubtitle));
indexHtml = setInnerById(indexHtml, 'h-work-label', esc(home.workLabel));
indexHtml = setInnerById(indexHtml, 'h-process-label', esc(home.processLabel));
indexHtml = setInnerById(indexHtml, 'h-quote-label', esc(home.quoteLabel));
indexHtml = setInnerById(indexHtml, 'h-quote', '“' + esc(home.quote) + '”');
indexHtml = setInnerById(indexHtml, 'h-quote-attr', esc(home.quoteAttr));
indexHtml = setInnerById(indexHtml, 'h-copyright', esc(home.copyright));
indexHtml = setInnerById(indexHtml, 'h-footer-email', esc(home.footerEmail.toUpperCase()));
indexHtml = setAttrById(indexHtml, 'h-footer-email-link', 'href', 'mailto:' + home.footerEmail);
if (home.socialInstagram) indexHtml = setAttrById(indexHtml, 'h-social-instagram', 'href', home.socialInstagram);
if (home.socialLinkedin) indexHtml = setAttrById(indexHtml, 'h-social-linkedin', 'href', home.socialLinkedin);
if (home.socialDribbble) indexHtml = setAttrById(indexHtml, 'h-social-dribbble', 'href', home.socialDribbble);

const marqueeItems = home.marquee.map(m => '<span>' + esc(m) + '</span>').join('');
indexHtml = setInnerById(indexHtml, 'h-marquee', marqueeItems + marqueeItems);

const workGridHtml = projectsData.map((p, i) => (
  '<a href="project-' + (i + 1) + '.html" data-reveal class="work-card">' +
    '<div class="work-thumb">' +
      frame(p.thumbImage, 'DROP PROJECT IMAGE, 4:3') +
      '<span class="idx mono">0' + (i + 1) + '</span>' +
    '</div>' +
    '<div class="work-title-row">' +
      '<span class="name">' + esc(p.name) + '</span>' +
      '<span class="sector mono">' + esc(p.sector) + '</span>' +
    '</div>' +
    '<div class="work-meta-row">' +
      '<span class="scope">' + esc(p.scope) + '</span>' +
      '<span class="stat mono">' + esc(p.stat) + '</span>' +
    '</div>' +
  '</a>'
)).join('');
indexHtml = setInnerById(indexHtml, 'h-work-grid', workGridHtml);

const servicesHtml = home.services.map(s => (
  '<div class="service-row" data-reveal>' +
    '<span class="num mono">' + esc(s.num) + '</span>' +
    '<span class="name">' + esc(s.name) + '</span>' +
    '<span class="desc">' + esc(s.desc) + '</span>' +
  '</div>'
)).join('');
indexHtml = setInnerById(indexHtml, 'h-services', servicesHtml);

const stepsHtml = home.steps.map(s => (
  '<div class="process-cell" data-reveal>' +
    '<span class="num mono">' + esc(s.num) + '</span>' +
    '<span class="name">' + esc(s.name) + '</span>' +
    '<span class="desc">' + esc(s.desc) + '</span>' +
  '</div>'
)).join('');
indexHtml = setInnerById(indexHtml, 'h-steps', stepsHtml);

indexHtml = applyHead(indexHtml, {
  title: 'Capybara Creative: Design & Webflow Development Agency',
  description: home.heroSubtitle,
  url: SITE_URL + '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Capybara Creative',
    description: home.heroSubtitle,
    url: SITE_URL + '/',
    email: home.footerEmail,
    sameAs: [home.socialInstagram, home.socialLinkedin, home.socialDribbble].filter(Boolean)
  }
});

write('index.html', indexHtml);
console.log('Built index.html');

// ================= AI STUDIO =================
let aiHtml = read('templates/ai-studio.html');

aiHtml = setInnerById(aiHtml, 'a-eyebrow', esc(ai.eyebrow));
aiHtml = setInnerById(aiHtml, 'a-title', esc(ai.heroTitle));
aiHtml = setInnerById(aiHtml, 'a-subtitle', esc(ai.heroSubtitle));
aiHtml = setInnerById(aiHtml, 'a-hero-cta', esc(ai.heroCta));

aiHtml = setInnerById(aiHtml, 'a-services-label', esc(ai.servicesLabel));
aiHtml = setInnerById(aiHtml, 'a-services-title', esc(ai.servicesTitle));
const aiServicesHtml = ai.services.map(s => (
  '<div class="ai-service-cell">' +
    '<span class="num mono">' + esc(s.num) + '</span>' +
    '<h3>' + esc(s.name) + '</h3>' +
    '<p>' + esc(s.desc) + '</p>' +
    '<span class="tags mono">' + esc(s.tags) + '</span>' +
  '</div>'
)).join('');
aiHtml = setInnerById(aiHtml, 'a-services-grid', aiServicesHtml);

aiHtml = setInnerById(aiHtml, 'a-process-title', esc(ai.processTitle));
aiHtml = setInnerById(aiHtml, 'a-process-label', esc(ai.processLabel));
const aiStepsHtml = ai.steps.map(s => (
  '<div class="ai-step-cell">' +
    '<span class="num mono">' + esc(s.num) + '</span>' +
    '<h3>' + esc(s.name) + '</h3>' +
    '<p>' + esc(s.desc) + '</p>' +
  '</div>'
)).join('');
aiHtml = setInnerById(aiHtml, 'a-steps-grid', aiStepsHtml);

aiHtml = setInnerById(aiHtml, 'a-results-label', esc(ai.resultsLabel));
aiHtml = setInnerById(aiHtml, 'a-results-title', esc(ai.resultsTitle));
const aiCasesHtml = ai.cases.map(c => (
  '<div class="ai-case-cell">' +
    '<span class="stat">' + esc(c.stat) + '</span>' +
    '<p>' + esc(c.desc) + '</p>' +
    '<span class="client mono">' + esc(c.client) + '</span>' +
  '</div>'
)).join('');
aiHtml = setInnerById(aiHtml, 'a-cases-grid', aiCasesHtml);

aiHtml = setInnerById(aiHtml, 'a-faq-label', esc(ai.faqLabel));
aiHtml = setInnerById(aiHtml, 'a-faq-title', esc(ai.faqTitle));
const aiFaqHtml = ai.faqs.map((f, i) => (
  '<div class="ai-faq-item" data-idx="' + i + '">' +
    '<button class="ai-faq-toggle" type="button" aria-expanded="false">' +
      '<span class="q">' + esc(f.q) + '</span>' +
      '<span class="sign mono">+</span>' +
    '</button>' +
    '<p class="ai-faq-answer">' + esc(f.a) + '</p>' +
  '</div>'
)).join('');
aiHtml = setInnerById(aiHtml, 'a-faq-list', aiFaqHtml);

aiHtml = setInnerById(aiHtml, 'a-footer-label', esc(ai.footerLabel));
aiHtml = setInnerById(aiHtml, 'a-footer-cta', esc(ai.footerCta));
aiHtml = setAttrById(aiHtml, 'a-footer-cta', 'href', 'mailto:' + ai.contactEmail + '?subject=' + encodeURIComponent(ai.contactSubject));
aiHtml = setInnerById(aiHtml, 'a-footer-subtext', esc(ai.footerSubtext));
aiHtml = setInnerById(aiHtml, 'a-footer-email', esc(ai.contactEmail.toUpperCase()));

aiHtml = applyHead(aiHtml, {
  title: ai.metaTitle,
  description: ai.metaDescription,
  url: SITE_URL + '/ai-studio.html',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Capybara AI Studio',
    description: ai.metaDescription,
    provider: { '@type': 'Organization', name: 'Capybara Creative', url: SITE_URL + '/' },
    url: SITE_URL + '/ai-studio.html'
  }
});

write('ai-studio.html', aiHtml);
console.log('Built ai-studio.html');

// ================= PROJECT DETAIL PAGES =================
const projectTemplate = read('templates/project.html');

projectsData.forEach((p, idx) => {
  let html = projectTemplate;
  const nextIdx = (idx + 1) % projectsData.length;
  const next = projectsData[nextIdx];

  html = setInnerById(html, 'p-name', esc(p.name));
  html = setInnerById(html, 'p-year', esc(p.year));
  html = setInnerById(html, 'p-sector', esc(p.sector));
  html = setInnerById(html, 'p-pkg', esc(p.pkg) + ' PACKAGE');
  html = setInnerById(html, 'p-hero-frame', frame(p.heroImage, 'DROP HERO IMAGE: ' + p.name.toUpperCase()));
  html = setInnerById(html, 'p-about', esc(p.about));
  html = setInnerById(html, 'p-challenge', esc(p.challenge));
  html = setInnerById(html, 'p-solution', esc(p.solution));

  const metrics = p.metrics || [];
  const metricsHtml = metrics.map(m => (
    '<div class="metric-cell"><span class="value">' + esc(m.value) + '</span><span class="label mono">' + esc(m.label) + '</span></div>'
  )).join('');
  html = setInnerById(html, 'p-metrics', metricsHtml);
  html = setAttrById(html, 'p-metrics', 'style', metrics.length ? ('--metric-count:' + metrics.length) : 'display:none');

  html = setInnerById(html, 'p-gallery-full-1', frame(p.galleryFull1, 'FULL-WIDTH SHOT, DESKTOP UI / BRAND IN USE'));
  html = setInnerById(html, 'p-gallery-detail-1', frame(p.galleryDetail1, 'DETAIL, MOBILE / COMPONENTS'));
  html = setInnerById(html, 'p-gallery-detail-2', frame(p.galleryDetail2, 'DETAIL, TYPOGRAPHY / LOGO'));
  html = setInnerById(html, 'p-gallery-full-2', frame(p.galleryFull2, 'FULL-WIDTH SHOT, FINAL SITE / LAUNCH'));

  const delivHtml = p.deliverables.map((name, i) => (
    '<div class="deliverable-row"><span class="num mono">0' + (i + 1) + '</span><span class="name">' + esc(name) + '</span></div>'
  )).join('');
  html = setInnerById(html, 'p-deliverables', delivHtml);

  html = setAttrById(html, 'p-next-link', 'href', 'project-' + (nextIdx + 1) + '.html');
  html = setInnerById(html, 'p-next-name', esc(next.name));
  html = setInnerById(html, 'p-next-meta', esc(next.sector) + ' · ' + esc(next.year));

  html = setAttrById(html, 'p-footer-email-link', 'href', 'mailto:' + home.footerEmail);
  html = setInnerById(html, 'p-footer-email', esc(home.footerEmail.toUpperCase()));
  html = setInnerById(html, 'p-copyright', esc(home.copyright));
  if (home.socialInstagram) html = setAttrById(html, 'p-social-instagram', 'href', home.socialInstagram);
  if (home.socialLinkedin) html = setAttrById(html, 'p-social-linkedin', 'href', home.socialLinkedin);
  if (home.socialDribbble) html = setAttrById(html, 'p-social-dribbble', 'href', home.socialDribbble);

  html = applyHead(html, {
    title: 'Capybara Creative: ' + p.name,
    description: p.about,
    url: SITE_URL + '/project-' + (idx + 1) + '.html',
    image: p.heroImage ? (SITE_URL + '/' + p.heroImage) : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: p.name,
      description: p.about,
      creator: { '@type': 'Organization', name: 'Capybara Creative', url: SITE_URL + '/' },
      url: SITE_URL + '/project-' + (idx + 1) + '.html'
    }
  });

  write('project-' + (idx + 1) + '.html', html);
  console.log('Built project-' + (idx + 1) + '.html');
});

console.log('Prerender complete.');
