const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { loginAs, createGame } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const newGame = {
  title: 'Brand New Game',
  description: 'Freshly added by an admin during testing.',
  genre: 'RPG',
  platforms: ['PC', 'Nintendo Switch'],
  releaseYear: 2024,
};

describe('Security headers', () => {
  it('sends Helmet headers and a CSP, and hides X-Powered-By', async () => {
    const res = await request(app).get('/api/games');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toMatch(/default-src 'self'/);
    expect(res.headers['content-security-policy']).toMatch(/frame-ancestors 'none'/);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('only allows the configured CORS origin', async () => {
    const ok = await request(app).get('/api/games').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const evil = await request(app).get('/api/games').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/games', () => {
  it('lists games publicly with pagination', async () => {
    await createGame({ title: 'Alpha' });
    await createGame({ title: 'Beta', genre: 'Puzzle' });
    const res = await request(app).get('/api/games?limit=1').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ total: 2, pages: 2, limit: 1 });
  });

  it('filters by search text and genre', async () => {
    await createGame({ title: 'Alpha Strike' });
    await createGame({ title: 'Beta Blocks', genre: 'Puzzle' });
    const res = await request(app).get('/api/games?q=alpha').expect(200);
    expect(res.body.data.map((g) => g.title)).toEqual(['Alpha Strike']);
    const byGenre = await request(app).get('/api/games?genre=Puzzle').expect(200);
    expect(byGenre.body.data.map((g) => g.title)).toEqual(['Beta Blocks']);
  });

  it('treats regex characters in search as plain text', async () => {
    await request(app).get('/api/games?q=(.*)+$').expect(200);
  });

  it('rejects unknown query values', async () => {
    await request(app).get('/api/games?genre=Hacking').expect(400);
    await request(app).get('/api/games?limit=1000').expect(400);
  });

  it('returns 400 for a malformed id and 404 for a missing game', async () => {
    await request(app).get('/api/games/123').expect(400);
    await request(app).get('/api/games/64b7f0000000000000000000').expect(404);
  });
});

describe('Game management (RBAC)', () => {
  it('rejects anonymous users with 401', async () => {
    await request(app).post('/api/games').send(newGame).expect(401);
  });

  it('rejects normal users with 403', async () => {
    const { agent } = await loginAs('user');
    await agent.post('/api/games').send(newGame).expect(403);
  });

  it('lets admins create, update and delete games', async () => {
    const { agent } = await loginAs('admin');
    const created = await agent.post('/api/games').send(newGame).expect(201);
    const id = created.body.data._id;

    const updated = await agent.put(`/api/games/${id}`).send({ title: 'Renamed' }).expect(200);
    expect(updated.body.data.title).toBe('Renamed');

    await agent.delete(`/api/games/${id}`).expect(200);
    await request(app).get(`/api/games/${id}`).expect(404);
  });

  it('validates game input and ignores unknown fields', async () => {
    const { agent } = await loginAs('admin');
    await agent.post('/api/games').send({ ...newGame, genre: 'Nonsense' }).expect(400);
    await agent.post('/api/games').send({ ...newGame, coverImage: 'javascript:alert(1)' }).expect(400);
    const res = await agent.post('/api/games').send({ ...newGame, averageRating: 5, reviewCount: 999 }).expect(201);
    expect(res.body.data.averageRating).toBe(0);
    expect(res.body.data.reviewCount).toBe(0);
  });
});
