const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Game = require('../../src/models/Game');

let counter = 0;
const PASSWORD = 'Str0ng!Pass';

/** Creates a user directly in the DB and returns a logged-in supertest agent (cookie kept). */
exports.loginAs = async (role = 'user') => {
  counter += 1;
  const user = await User.create({
    username: `${role}_${counter}`,
    email: `${role}${counter}@test.local`,
    password: PASSWORD,
    role,
  });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD }).expect(200);
  return { agent, user };
};

exports.createGame = (overrides = {}) => Game.create({
  title: 'Test Game',
  description: 'A game used for automated tests.',
  genre: 'Action',
  platforms: ['PC'],
  releaseYear: 2020,
  ...overrides,
});

exports.PASSWORD = PASSWORD;
