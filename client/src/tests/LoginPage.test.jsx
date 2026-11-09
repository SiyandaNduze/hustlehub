import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../context/AuthContext';
import { ApiError } from '../api/client';

function renderLogin(login = vi.fn(), auth = {}) {
  render(
    <AuthContext.Provider value={{ user: null, loading: false, login, logout: vi.fn(), register: vi.fn(), ...auth }}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return login;
}

describe('LoginPage', () => {
  it('renders the email and password fields and a submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation errors and does not call the API when the form is empty', async () => {
    const user = userEvent.setup();
    const login = renderLogin();
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits the entered credentials', async () => {
    const user = userEvent.setup();
    const login = renderLogin(vi.fn().mockResolvedValue({}));
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(login).toHaveBeenCalledWith('jane@example.com', 'StrongPass123');
  });

  it('shows a friendly message when the API rejects the login', async () => {
    const user = userEvent.setup();
    renderLogin(vi.fn().mockRejectedValue(new ApiError('Invalid email or password', 401)));
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('explains why the user was logged out when the session expired', () => {
    renderLogin(undefined, { sessionExpired: true });
    expect(screen.getByText(/your session ended/i)).toBeInTheDocument();
  });

  it('shows the lockout message after too many failed attempts (429) and clears the password', async () => {
    const user = userEvent.setup();
    const login = renderLogin(
      vi.fn().mockRejectedValue(new ApiError('Too many failed login attempts. Please try again later.', 429))
    );
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/too many failed login attempts/i)).toBeInTheDocument();
    expect(login).toHaveBeenCalledTimes(1);
    // a rejected password is never kept in the form
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });
});
