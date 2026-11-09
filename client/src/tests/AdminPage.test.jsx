import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import AdminPage from '../pages/AdminPage';
import { adminUser, mockApi, renderWithAuth, sampleTransaction } from './helpers';

const base = {
  'GET /admin/users': [200, { status: 'success', data: { users: [adminUser] } }],
  'GET /admin/transactions': [200, { status: 'success', data: { transactions: [sampleTransaction] } }],
};

describe('AdminPage ledger integrity', () => {
  it('reports an intact ledger', async () => {
    mockApi({
      ...base,
      'GET /admin/ledger/verify': [200, { status: 'success', data: { valid: true, verified: 3, legacy: 1 } }],
    });
    const user = userEvent.setup();
    renderWithAuth({ '/': <AdminPage /> }, { user: adminUser });
    await user.click(await screen.findByRole('button', { name: /verify ledger/i }));
    expect(await screen.findByText(/ledger intact: 3 sealed transactions verified \(1 older unsealed\)/i)).toBeInTheDocument();
  });

  it('flags the first tampered record', async () => {
    mockApi({
      ...base,
      'GET /admin/ledger/verify': [
        200,
        { status: 'success', data: { valid: false, verified: 1, legacy: 0, brokenAt: { index: 1, id: 'deadbeef-0000', reason: 'hash mismatch' } } },
      ],
    });
    const user = userEvent.setup();
    renderWithAuth({ '/': <AdminPage /> }, { user: adminUser });
    await user.click(await screen.findByRole('button', { name: /verify ledger/i }));
    expect(await screen.findByText(/tampering detected at record 2 \(deadbeef\)/i)).toBeInTheDocument();
  });
});
