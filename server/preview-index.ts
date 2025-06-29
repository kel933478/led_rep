import express from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

const app = express();

// CORS pour preview
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Routes simples sans base de données pour le preview
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ message: 'Not authenticated' });
});

// Redirection de la racine vers /login
app.get('/', (req, res, next) => {
  if (req.path === '/' && !req.query.redirect) {
    res.redirect('/login');
  } else {
    next();
  }
});

app.post('/api/client/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'client@demo.com' && password === 'demo123') {
    res.json({ 
      user: { 
        id: 1, 
        email: 'client@demo.com',
        onboardingCompleted: true,
        kycCompleted: true
      } 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@ledger.com' && password === 'admin123') {
    res.json({ 
      user: { 
        id: 1, 
        email: 'admin@ledger.com',
        type: 'admin'
      } 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Route de debug
app.get('/debug', (req, res) => {
  res.send(`
    <h1>🚀 Preview Debug - Ledger Récupération</h1>
    <p><strong>Status:</strong> ✅ WORKING</p>
    <p><strong>Time:</strong> ${new Date()}</p>
    <p><strong>Host:</strong> ${req.headers.host}</p>
    <p><strong>User-Agent:</strong> ${req.headers['user-agent']}</p>
    <p><strong>Port:</strong> 5000</p>
    
    <h2>🧪 API Tests:</h2>
    <p><a href="/api/health">GET /api/health</a></p>
    <p><a href="/api/auth/me">GET /api/auth/me</a></p>
    
    <h2>🔑 Test Login:</h2>
    <p>Client: client@demo.com / demo123</p>
    <p>Admin: admin@ledger.com / admin123</p>
    
    <h2>📱 Frontend:</h2>
    <p><a href="/">React App</a></p>
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
    console.log(`🚀 PREVIEW SERVER READY!`);
    console.log(`URL: http://0.0.0.0:${port}`);
    console.log(`Debug: http://0.0.0.0:${port}/debug`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();