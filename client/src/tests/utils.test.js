import { describe, it, expect } from 'vitest';
import { passwordProblems, validateBookingNotes, validateGig, validateRegister } from '../utils/validation';
import { displayRef, formatPercent } from '../utils/format';
import { isCommonPassword, validateRegister } from '../utils/validation';

describe('validation (mirrors the API rules)', () => {
  it('lists missing password rules', () => {
    expect(passwordProblems('abc')).toEqual(['at least 8 characters', 'an uppercase letter', 'a number']);
    expect(passwordProblems('StrongPass123')).toEqual([]);
  });

  it('does not allow registering as admin', () => {
    const errors = validateRegister({ name: 'Eve', email: 'e@x.co', password: 'StrongPass123', confirmPassword: 'StrongPass123', role: 'admin' });
    expect(errors.role).toBeDefined();
  });

  it('enforces the gig price range', () => {
    expect(validateGig({ title: 'Logo', description: 'A clean modern logo.', category: 'Design', price: '0' }).price).toBeDefined();
    expect(validateGig({ title: 'Logo', description: 'A clean modern logo.', category: 'Design', price: '100' })).toEqual({});
  });

  it('caps booking notes at 500 characters', () => {
    expect(validateBookingNotes('x'.repeat(501))).not.toBe('');
    expect(validateBookingNotes('ok')).toBe('');
  });
});

describe('formatting', () => {
  it('builds short receipt references', () => {
    expect(displayRef('TXN', 'a1b2c3d4-3333')).toBe('TXN-A1B2C3D4');
  });

  it('formats percentages for the tax dashboard', () => {
    expect(formatPercent(6.12)).toMatch(/^6[.,]12%$/);
    expect(formatPercent(0)).toBe('0%');
  });

  it('rejects common passwords regardless of case, but accepts a strong one', () => {
    const base = { name: 'Naledi Khumalo', email: 'n@example.com', role: 'client' };
    const check = (password) => validateRegister({ ...base, password, confirmPassword: password }).password;
    expect(isCommonPassword('PASSWORD123')).toBe(true);
    expect(check('Password123')).toMatch(/too common/i);
    expect(check('Zebra-Quartz-742')).toBeUndefined();
  });
});
