// Local server entry point: Express in front, Vite in middleware mode behind it.
//
// Vite runs inside Express (not as its own dev server) so that every plugin in
// vite.config.ts keeps working, including the MCP bridge at POST /mcp/execute
// used by services/mcpClient.ts. Add API routes (ws, SQLite, etc.) to `app`
// BEFORE the Vite middleware is mounted, so they take priority over the SPA.

import express from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const app = express();

  // --- API routes go here (before Vite) ---

  // Vite dev middleware: serves index.html, transforms .ts/.tsx on the fly,
  // and runs the configureServer hooks from vite.config.ts (MCP bridge).
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  // A production mode (serving the built dist/ folder instead of Vite) can be
  // added here later, e.g. behind NODE_ENV === 'production'.

  app.listen(PORT, HOST, () => {
    console.log(`[server] MythOS Agent Hub listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
