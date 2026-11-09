import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';

export const future = { v7_startTransition: true, v7_relativeSplatPath: true };

// Shows the current path so tests can assert where the app navigated.
export function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

// Renders `routes` ({ path: element }) with a fake signed-in user.
export function renderWithAuth(routes, { user = null, at = '/', auth = {} } = {}) {
  const value = { user, loading: false, login: vi.fn(), logout: vi.fn(), register: vi.fn(), sessionExpired: false, ...auth };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[at]} future={future}>
        <Routes>
          {Object.entries(routes).map(([path, element]) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const json = (status, body) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

// Fake API: keys are "METHOD /path", values are [status, body] or a function
// (body) => [status, body]. Unknown requests fail the test loudly.
export function mockApi(table) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((url, options = {}) => {
    const key = `${options.method || 'GET'} ${String(url).replace(/^\/api/, '')}`;
    const entry = table[key];
    if (!entry) return json(500, { message: `Unmocked request: ${key}` });
    const body = options.body ? JSON.parse(options.body) : undefined;
    const [status, payload] = typeof entry === 'function' ? entry(body) : entry;
    return json(status, payload);
  });
}

// The parsed JSON body of the n-th call to a mocked fetch for a given key
export function sentBody(fetchSpy, method, path) {
  const call = fetchSpy.mock.calls.find(([url, o = {}]) => (o.method || 'GET') === method && url === `/api${path}`);
  return call ? JSON.parse(call[1].body) : undefined;
}

export const clientUser = { id: 'c1', name: 'Kagiso Molefe', email: 'k@example.com', role: 'client' };
export const freelancerUser = { id: 'f1', name: 'Naledi Khumalo', email: 'n@example.com', role: 'freelancer' };
export const adminUser = { id: 'a1', name: 'HustleHub Admin', email: 'a@example.com', role: 'admin' };

export const sampleGig = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Logo design',
  description: 'A clean modern logo for your brand.',
  category: 'Design',
  price: 1500,
  active: true,
  freelancerId: 'f1',
  freelancerName: 'Naledi Khumalo',
  createdAt: '2026-10-01T10:00:00.000Z',
};

export const sampleBooking = {
  id: 'b0b0b0b0-2222-4222-8222-222222222222',
  gigId: sampleGig.id,
  gigTitle: 'Logo design',
  clientId: 'c1',
  freelancerId: 'f1',
  clientName: 'Kagiso Molefe',
  freelancerName: 'Naledi Khumalo',
  price: 1500,
  notes: 'Blue and gold please',
  status: 'confirmed',
  createdAt: '2026-10-08T10:00:00.000Z',
};

export const sampleTransaction = {
  id: 'a1b2c3d4-3333-4333-8333-333333333333',
  bookingId: sampleBooking.id,
  gigTitle: 'Logo design',
  clientId: 'c1',
  freelancerId: 'f1',
  clientName: 'Kagiso Molefe',
  freelancerName: 'Naledi Khumalo',
  amount: 1500,
  currency: 'ZAR',
  status: 'completed',
  method: 'simulated',
  createdAt: '2026-10-08T10:00:00.000Z',
};
