import { describe, expect, it } from 'vitest';
import { validateRegistration } from '../validation.js';

const good = { username: 'player_1', email: 'p@example.com', password: 'Str0ng!Pass', confirm: 'Str0ng!Pass' };

describe('validateRegistration', () => {
  it('accepts valid input', () => {
    expect(validateRegistration(good)).toEqual({});
  });

  it('rejects unsafe usernames', () => {
    expect(validateRegistration({ ...good, username: '<script>' }).username).toBeDefined();
  });

  it('lists what a weak password is missing', () => {
    const { password } = validateRegistration({ ...good, password: 'abc', confirm: 'abc' });
    expect(password).toMatch(/8\+ characters/);
    expect(password).toMatch(/uppercase/);
  });

  it('checks the confirmation matches', () => {
    expect(validateRegistration({ ...good, confirm: 'different' }).confirm).toBeDefined();
  });
});
