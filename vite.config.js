import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 7 (stable) + @vitejs/plugin-react — aligned peer versions, no ERESOLVE.
// https://vite.dev/config/
// SECURITY: the dev server used to bind 0.0.0.0 unconditionally (`host: true`).
// The Vite dev server is an unauthenticated file server with a websocket into
// the module graph; exposing it to every attached network (café Wi-Fi, guest
// VLAN) hands nearby users read access to project sources. LAN binding is now
// explicit opt-in:  VITE_EXPOSE_LAN=true npm run dev
const exposeLan = process.env.VITE_EXPOSE_LAN === 'true';
const devHost = exposeLan ? true : 'localhost';

/**
 * Content-Security-Policy for the built app.
 *
 * Derived from what the code actually loads — every source here is reachable
 * from the repo, nothing speculative:
 *   - Google Fonts stylesheet (index.html) + font files (fonts.gstatic.com)
 *   - GA4 tag, injected ONLY after analytics consent (services/consentScripts.js)
 *   - hero-bg.mp4 and the canvas renderers (self / data: / blob:)
 *
 * 'unsafe-inline' is required for style-src because the components style
 * themselves with React `style={{...}}` props, which emit inline style
 * attributes. It is deliberately NOT granted to script-src — that is the
 * directive that actually stops XSS.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com",
  "media-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

/**
 * Inject the CSP as a <meta> tag at BUILD time only.
 *
 * Dev is excluded on purpose: @vitejs/plugin-react injects an inline React
 * Refresh preamble, which a policy without script-src 'unsafe-inline' blocks,
 * breaking HMR. Dev safety comes from the loopback binding above instead.
 *
 * A <meta> CSP is defence-in-depth, not the primary control: `frame-ancestors`
 * is ignored in meta form and only takes effect as a real response header.
 * Configure the same policy at your CDN/reverse proxy — see cibersegurity.txt.
 */
function cspMetaPlugin() {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      // Insert AFTER the charset declaration: the spec requires charset to
      // appear within the first 1024 bytes of the document, and this policy
      // is ~700 bytes on its own.
      const charset = '<meta charset="UTF-8" />';
      return html.replace(
        charset,
        `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), cspMetaPlugin()],
  server: {
    port: 5471,
    // Non-strict: if 5471 is momentarily busy, Vite picks the next free port
    // instead of crashing at httpServerStart. Free 5471 explicitly (see README)
    // when you need that exact port.
    strictPort: false,
    host: devHost,
    // Reject requests whose Host header isn't one we expect. This is the
    // defence against DNS-rebinding: a hostile page resolving its own domain
    // to 127.0.0.1 to read your dev server's responses cross-origin.
    allowedHosts: ['localhost', '127.0.0.1'],
    // Never let the dev server serve files from outside the project root
    // (path traversal into ~/.ssh, ~/.aws, sibling repos...).
    fs: { strict: true, allow: ['.'] },
    // Don't add permissive CORS headers to dev-server responses.
    cors: false,
    // Proxy API calls in dev so the browser talks same-origin (no CORS surprises).
    proxy: {
      '/api': {
        // 127.0.0.1 (not "localhost") to avoid IPv6 resolution mismatches.
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5471,
    strictPort: false,
    host: devHost,
    cors: false,
    // `vite preview` is a convenience server for checking a production build
    // locally — it is not a hardened static host. Real deployments must set
    // these at the CDN/reverse proxy; see cibersegurity.txt.
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Split vendor libs so the interactive canvas code can be lazy-loaded
        // without dragging React into every route chunk. Function form works
        // in both Rollup (Vite ≤7) and Rolldown (Vite 8), so it's future-proof.
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
