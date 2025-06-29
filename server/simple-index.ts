import express from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

const app = express();

// Headers pour le preview
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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

// Route de debug pour le preview
app.get('/debug', (req, res) => {
  res.send(`
    <h1>🔍 Debug Info</h1>
    <p><strong>Time:</strong> ${new Date()}</p>
    <p><strong>Host:</strong> ${req.headers.host}</p>
    <p><strong>User-Agent:</strong> ${req.headers['user-agent']}</p>
    <p><strong>Headers:</strong></p>
    <pre>${JSON.stringify(req.headers, null, 2)}</pre>
    <p><strong>URL:</strong> ${req.url}</p>
  `);
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
    console.log(`Preview should be accessible at: http://0.0.0.0:${port}`);
  });
})();