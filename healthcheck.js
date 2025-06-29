// Healthcheck pour monitoring production
import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/auth/me',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 401) {
    console.log('Health check passed - API responding');
    process.exit(0);
  } else {
    console.log(`Health check failed - Status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log(`Health check failed - Error: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check failed - Timeout');
  req.destroy();
  process.exit(1);
});

req.end();