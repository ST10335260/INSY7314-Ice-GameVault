// Runs before every test file (see "setupFiles" in package.json)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-definitely-longer-than-32-chars';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
