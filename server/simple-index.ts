import express from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

const app = express();

// Très simple - pas de CORS compliqué, pas de helmet
app.use(express.json());

// Route de test simple
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    host: req.headers.host,
    userAgent: req.headers['user-agent']
  });
});

(async () => {
  const server = createServer(app);

  // Setup Vite pour le développement
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Simple server running on http://0.0.0.0:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
})();