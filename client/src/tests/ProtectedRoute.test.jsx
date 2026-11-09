import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

function renderAt(ctx) {
  const value = { loading: false, login: vi.fn(), logout: vi.fn(), register: vi.fn(), ...ctx };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/income']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/gigs" element={<div>Gigs page</div>} />
          <Route
            path="/income"
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <div>Income page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitors to login', () => {
    renderAt({ user: null });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects users whose role is not allowed', () => {
    renderAt({ user: { name: 'Casey', role: 'client' } });
    expect(screen.getByText('Gigs page')).toBeInTheDocument();
  });

  it('renders the page for an allowed role', () => {
    renderAt({ user: { name: 'Frankie', role: 'freelancer' } });
    expect(screen.getByText('Income page')).toBeInTheDocument();
  });

  it('shows a loading state while the session is restored', () => {
    renderAt({ user: null, loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
