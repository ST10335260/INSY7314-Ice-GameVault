/**
 * Generates a self-signed TLS certificate for LOCAL DEVELOPMENT ONLY.
 * Cross-platform (works on Windows without OpenSSL).
 * In production, use a certificate from a trusted CA (e.g. Let's Encrypt).
 */
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const dir = path.resolve(__dirname, '../certs');
fs.mkdirSync(dir, { recursive: true });

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }] }],
});

fs.writeFileSync(path.join(dir, 'key.pem'), pems.private, { mode: 0o600 });
fs.writeFileSync(path.join(dir, 'cert.pem'), pems.cert);
console.log(`Self-signed certificate written to ${dir}`);
console.log('Set USE_HTTPS=true in .env and restart the server.');
