import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { tokenStore } from '../api/client';
import { mockApi, clientUser } from './helpers';

// A structurally valid (unsigned) JWT that expires in an hour - the client only reads `exp`
const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const liveToken = () => `${b64({ alg: 'HS256' })}.${b64({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

function Probe() {
  const { user, login, logout, sessionExpired } = useAuth();
  return (
    <div>
      <p data-testid="who">{user ? user.name : 'nobody'}</p>
      <p data-testid="expired">{String(sessionExpired)}</p>
      <button onClick={() => login('k@example.com', 'StrongPass123')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>
  );

describe('AuthContext logout', () => {
  it('asks the API to revoke every token for the account, then forgets the session locally', async () => {
    const fetchSpy = mockApi({
      'POST /auth/login': [200, { status: 'success', data: { token: liveToken(), user: clientUser } }],
      'POST /auth/logout': [200, { status: 'success' }],
    });
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText('login'));
    expect(await screen.findByText(clientUser.name)).toBeInTheDocument();
    expect(tokenStore.get()).toBeTruthy();

    await user.click(screen.getByText('logout'));
    expect(await screen.findByText('nobody')).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(screen.getByTestId('expired')).toHaveTextContent('false');
    expect(fetchSpy.mock.calls.some(([url, o = {}]) => url === '/api/auth/logout' && o.method === 'POST')).toBe(true);
  });

  it('still logs out locally when the API cannot be reached', async () => {
    mockApi({
      'POST /auth/login': [200, { status: 'success', data: { token: liveToken(), user: clientUser } }],
      'POST /auth/logout': [500, { message: 'boom' }],
    });
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByText('login'));
    await screen.findByText(clientUser.name);
    await user.click(screen.getByText('logout'));
    expect(await screen.findByText('nobody')).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
  });
});
