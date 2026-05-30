// Lightweight ping script to keep Render service warm.
// Usage: set PING_URL (e.g. https://your-backend.onrender.com/) in environment variables

const { URL } = require('url');

const raw = process.env.PING_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
let pingUrl = raw;
try {
  // Ensure URL has a trailing slash for consistency
  const u = new URL(raw);
  pingUrl = u.href;
} catch (err) {
  // If invalid URL, fallback to http://localhost:5000/
  pingUrl = 'http://localhost:5000/';
}

const { get } = require(pingUrl.startsWith('https') ? 'https' : 'http');

const req = get(pingUrl, (res) => {
  console.log(`Pinged ${pingUrl} -> ${res.statusCode}`);
  // consume data and exit
  res.on('data', () => {});
  res.on('end', () => process.exit(0));
});

req.on('error', (err) => {
  console.error('Ping failed:', err.message || err);
  // Exit non-zero so Render marks failure in logs (but cron should ignore failures)
  process.exit(1);
});
