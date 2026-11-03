import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const PANEL_URL = process.env.PANEL_URL || "https://panel.capybaracreative.xyz";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Direcciones viejas del sitio en Netlify (con .html y project.html?p=N).
    const old = [1, 2, 3, 4].map((n) => ({
      source: "/project.html",
      has: [{ type: "query" as const, key: "p", value: String(n) }],
      destination: `/project-${n}`,
      permanent: true,
    }));
    return [
      ...old,
      { source: "/project.html", destination: "/project-1", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/uploads/logo.svg", destination: "/assets/logo.svg", permanent: true },
      { source: "/admin", destination: PANEL_URL, permanent: false },
      { source: "/admin/:path*", destination: PANEL_URL, permanent: false },
      { source: "/:page([a-z0-9-]+).html", destination: "/:page", permanent: true },
    ];
  },
};

export default nextConfig;
