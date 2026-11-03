#!/usr/bin/env node
// Copia templates/*.html (el diseño del sitio, igual al que había en Netlify) a un módulo TS
// para que viajen dentro del build sin leer archivos en tiempo de ejecución.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "templates");
const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort()) {
  out[f.replace(/\.html$/, "")] = fs.readFileSync(path.join(dir, f), "utf8");
}
const body = "// Generado por scripts/build-templates.mjs desde templates/*.html. No editar a mano.\n" +
  "export const TEMPLATES = " + JSON.stringify(out, null, 2) + " as const;\n";
fs.writeFileSync(path.join(root, "src/lib/templates.ts"), body);
console.log("templates:", Object.keys(out).join(", "));
