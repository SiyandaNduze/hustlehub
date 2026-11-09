import { describe, it, expect, vi } from 'vitest';
import { api, fieldErrorMap, setUnauthorizedHandler, tokenExpiry, tokenStore } from '../api/client';
import { mockApi } from './helpers';

describe('API client', () => {
  it('attaches the JWT as a bearer token', async () => {
    const fetchSpy = mockApi({ 'GET /profile': [200, { data: {} }] });
    tokenStore.set('header.payload.signature');
    await api.get('/profile');
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe('Bearer header.payload.signature');
  });

  it('replaces 5xx details with a generic message', async () => {
    mockApi({ 'GET /gigs': [500, { message: 'TypeError at /srv/app/src/controllers/gigController.js:42' }] });
    await expect(api.get('/gigs')).rejects.toThrow('Something went wrong. Please try again.');
  });

  it('turns network failures into a friendly message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.get('/gigs')).rejects.toThrow('Unable to reach the server. Please try again.');
  });

  it('ends the session when an authenticated request gets 401', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    tokenStore.set('expired.token.value');
    mockApi({ 'GET /bookings/mine': [401, { message: 'Invalid or expired token' }] });
    await expect(api.get('/bookings/mine')).rejects.toThrow('Invalid or expired token');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('keeps field errors as { field, message } pairs', async () => {
    mockApi({ 'POST /gigs': [400, { message: 'Validation failed', errors: [{ field: 'price', message: 'Bad price' }] }] });
    const err = await api.post('/gigs', {}).catch((e) => e);
    expect(err.status).toBe(400);
    expect(fieldErrorMap(err)).toEqual({ price: 'Bad price' });
  });

  it('reads the expiry from a JWT payload', () => {
    const payload = btoa(JSON.stringify({ exp: 2000000000 }));
    expect(tokenExpiry(`x.${payload}.y`)).toBe(2000000000 * 1000);
    expect(tokenExpiry('not-a-token')).toBe(0);
  });
});
