import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Navbar from '../components/Navbar';
import { adminUser, clientUser, freelancerUser, renderWithAuth } from './helpers';

const linkNames = () => screen.queryAllByRole('link').map((a) => a.textContent);

describe('Navbar', () => {
  it('shows clients only client pages', () => {
    renderWithAuth({ '/': <Navbar /> }, { user: clientUser });
    expect(linkNames()).toEqual(expect.arrayContaining(['Browse gigs', 'My bookings', 'Payments']));
    expect(linkNames()).not.toContain('Income');
    expect(linkNames()).not.toContain('Admin');
  });

  it('shows freelancers their gigs and income', () => {
    renderWithAuth({ '/': <Navbar /> }, { user: freelancerUser });
    expect(linkNames()).toEqual(expect.arrayContaining(['My gigs', 'Bookings', 'Income']));
    expect(linkNames()).not.toContain('Payments');
  });

  it('shows admins the admin page', () => {
    renderWithAuth({ '/': <Navbar /> }, { user: adminUser });
    expect(linkNames()).toContain('Admin');
    expect(linkNames()).not.toContain('My bookings');
  });

  it('shows log in and register to guests', () => {
    renderWithAuth({ '/': <Navbar /> });
    expect(linkNames()).toEqual(expect.arrayContaining(['Log in', 'Register']));
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });
});
