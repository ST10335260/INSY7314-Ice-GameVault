const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { loginAs } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const valid = { username: 'new_player', email: 'New@Example.com', password: 'Str0ng!Pass' };

describe('POST /api/auth/register', () => {
  it('creates a user and sets an httpOnly, SameSite=Strict cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(valid).expect(201);
    expect(res.body.user).toMatchObject({ username: 'new_player', email: 'new@example.com', role: 'user' });
    expect(res.body.user.password).toBeUndefined();
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('ignores a "role" field in the body (mass-assignment protection)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, role: 'admin' }).expect(201);
    expect(res.body.user.role).toBe('user');
  });

  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, password: 'password' }).expect(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('rejects invalid usernames and emails', async () => {
    await request(app).post('/api/auth/register').send({ ...valid, username: '<script>' }).expect(400);
    await request(app).post('/api/auth/register').send({ ...valid, email: 'not-an-email' }).expect(400);
  });

  it('rejects duplicate registrations', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    await request(app).post('/api/auth/register').send(valid).expect(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(valid));

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'new@example.com', password: valid.password }).expect(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=/);
  });

  it('returns the same generic message for a wrong password and an unknown email', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'new@example.com', password: 'Wrong!Pass1' }).expect(401);
    const b = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong!Pass1' }).expect(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it('blocks NoSQL injection objects', async () => {
    await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } }).expect(400);
  });
});

describe('Protected routes', () => {
  it('GET /api/auth/me requires a token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('rejects a forged token', async () => {
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.realtoken').expect(401);
  });

  it('returns the current user for a logged-in agent', async () => {
    const { agent, user } = await loginAs('user');
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.user.username).toBe(user.username);
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout').expect(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=;/);
  });
});
