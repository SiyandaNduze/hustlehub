import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '../pages/RegisterPage';
import { ApiError } from '../api/client';
import { renderWithAuth } from './helpers';

const renderRegister = (auth = {}, at = '/register') => renderWithAuth({ '/register': <RegisterPage /> }, { at, auth });

async function fillValid(user) {
  await user.type(screen.getByLabelText('Full name'), 'Naledi Khumalo');
  await user.type(screen.getByLabelText('Email'), 'naledi@example.com');
  await user.type(screen.getByLabelText('Password'), 'StrongPass123');
  await user.type(screen.getByLabelText('Confirm password'), 'StrongPass123');
}

describe('RegisterPage', () => {
  it('pre-selects the role from the link the visitor followed', () => {
    renderRegister({}, '/register?role=freelancer');
    expect(screen.getByLabelText('Offer my services')).toBeChecked();
  });

  it('tells the user which password rules are still missing as they type', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Password'), 'abc');
    expect(screen.getByText(/Still needs at least 8 characters, an uppercase letter, a number/)).toBeInTheDocument();
  });

  it('warns that a common password is too weak and blocks submission', async () => {
    const user = userEvent.setup();
    const register = vi.fn();
    renderRegister({ register });
    await user.type(screen.getByLabelText('Full name'), 'Naledi Khumalo');
    await user.type(screen.getByLabelText('Email'), 'naledi@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText('Confirm password'), 'Password123');
    // The hint appears while typing
    expect(screen.getByText(/too common/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Register' }));
    // The error replaces the hint and submission never reaches the API
    expect(await screen.findByText(/too common/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(register).not.toHaveBeenCalled();
  });

  it('blocks submission when the passwords do not match', async () => {
    const user = userEvent.setup();
    const register = vi.fn();
    renderRegister({ register });
    await fillValid(user);
    await user.type(screen.getByLabelText('Confirm password'), 'x');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true');
    expect(register).not.toHaveBeenCalled();
  });

  it('sends the chosen role, never the confirmation field, then signs in', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue({});
    const login = vi.fn().mockResolvedValue({ role: 'freelancer' });
    renderRegister({ register, login });
    await user.click(screen.getByLabelText('Offer my services'));
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(register).toHaveBeenCalledWith({
      name: 'Naledi Khumalo',
      email: 'naledi@example.com',
      password: 'StrongPass123',
      role: 'freelancer',
    });
    expect(login).toHaveBeenCalledWith('naledi@example.com', 'StrongPass123');
    expect(await screen.findByTestId('location')).toHaveTextContent('/my-gigs');
  });

  it('shows server field errors next to the right input', async () => {
    const user = userEvent.setup();
    const register = vi
      .fn()
      .mockRejectedValue(new ApiError('Validation failed', 400, [{ field: 'email', message: 'A valid email address is required' }]));
    renderRegister({ register });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('A valid email address is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
  });

  it('shows the generic duplicate-account message from the API', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue(new ApiError('An account with these details already exists', 409));
    renderRegister({ register });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with these details already exists');
  });
});
