const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const { loginAs, createGame } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('Reviews', () => {
  it('lets a user review a game and updates the average', async () => {
    const game = await createGame();
    const a = await loginAs('user');
    const b = await loginAs('user');

    await a.agent.post(`/api/games/${game._id}/reviews`).send({ rating: 5, comment: 'Loved it' }).expect(201);
    await b.agent.post(`/api/games/${game._id}/reviews`).send({ rating: 2 }).expect(201);

    const res = await request(app).get(`/api/games/${game._id}`).expect(200);
    expect(res.body.data).toMatchObject({ averageRating: 3.5, reviewCount: 2 });

    const list = await request(app).get(`/api/games/${game._id}/reviews`).expect(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.data[0].user.email).toBeUndefined(); // no personal data leaked
  });

  it('allows only one review per user per game', async () => {
    const game = await createGame();
    const { agent } = await loginAs('user');
    await agent.post(`/api/games/${game._id}/reviews`).send({ rating: 4 }).expect(201);
    await agent.post(`/api/games/${game._id}/reviews`).send({ rating: 1 }).expect(409);
  });

  it('rejects ratings outside 1-5', async () => {
    const game = await createGame();
    const { agent } = await loginAs('user');
    await agent.post(`/api/games/${game._id}/reviews`).send({ rating: 10 }).expect(400);
  });

  it('prevents editing someone else\'s review but lets admins delete it', async () => {
    const game = await createGame();
    const owner = await loginAs('user');
    const other = await loginAs('user');
    const admin = await loginAs('admin');

    const res = await owner.agent.post(`/api/games/${game._id}/reviews`).send({ rating: 4 }).expect(201);
    const reviewId = res.body.data._id;

    await other.agent.put(`/api/reviews/${reviewId}`).send({ rating: 1 }).expect(403);
    await other.agent.delete(`/api/reviews/${reviewId}`).expect(403);
    await owner.agent.put(`/api/reviews/${reviewId}`).send({ rating: 3 }).expect(200);
    await admin.agent.delete(`/api/reviews/${reviewId}`).expect(200);

    const after = await request(app).get(`/api/games/${game._id}`);
    expect(after.body.data.reviewCount).toBe(0);
  });
});

describe('Collection & wishlist', () => {
  it('requires login', async () => {
    await request(app).get('/api/me/collection').expect(401);
    await request(app).get('/api/me/wishlist').expect(401);
  });

  it('manages the collection', async () => {
    const game = await createGame();
    const { agent } = await loginAs('user');

    await agent.post('/api/me/collection').send({ gameId: game._id, status: 'playing' }).expect(201);
    await agent.post('/api/me/collection').send({ gameId: game._id }).expect(409);
    await agent.patch(`/api/me/collection/${game._id}`).send({ status: 'completed' }).expect(200);
    await agent.patch(`/api/me/collection/${game._id}`).send({ status: 'hacked' }).expect(400);

    const res = await agent.get('/api/me/collection').expect(200);
    expect(res.body.data[0]).toMatchObject({ status: 'completed' });
    expect(res.body.data[0].game.title).toBe('Test Game');

    await agent.delete(`/api/me/collection/${game._id}`).expect(200);
    const empty = await agent.get('/api/me/collection');
    expect(empty.body.data).toHaveLength(0);
  });

  it('manages the wishlist and moves games to the collection', async () => {
    const game = await createGame();
    const { agent } = await loginAs('user');

    await agent.post(`/api/me/wishlist/${game._id}`).expect(200);
    let res = await agent.get('/api/me/wishlist');
    expect(res.body.data).toHaveLength(1);

    await agent.post('/api/me/collection').send({ gameId: game._id }).expect(201);
    res = await agent.get('/api/me/wishlist');
    expect(res.body.data).toHaveLength(0); // removed from wishlist once owned

    const profile = await agent.get('/api/me').expect(200);
    expect(profile.body.stats).toMatchObject({ collection: 1, wishlist: 0 });
  });
});

describe('Admin user management', () => {
  it('is admin only', async () => {
    const { agent } = await loginAs('user');
    await agent.get('/api/users').expect(403);
  });

  it('lets an admin change roles but not their own', async () => {
    const admin = await loginAs('admin');
    const player = await loginAs('user');

    const res = await admin.agent.patch(`/api/users/${player.user._id}/role`).send({ role: 'admin' }).expect(200);
    expect(res.body.data.role).toBe('admin');
    await admin.agent.patch(`/api/users/${admin.user._id}/role`).send({ role: 'user' }).expect(400);

    // The promoted user's existing token picks up the new role immediately
    await player.agent.get('/api/users').expect(200);
  });
});
