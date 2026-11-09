import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PaymentsPage from '../pages/PaymentsPage';
import { clientUser, mockApi, renderWithAuth, sampleTransaction } from './helpers';

const renderPayments = () => renderWithAuth({ '/payments': <PaymentsPage /> }, { user: clientUser, at: '/payments' });

describe('PaymentsPage', () => {
  it('lists the transactions recorded for the client with a total', async () => {
    mockApi({
      'GET /transactions/mine': [
        200,
        { data: { transactions: [sampleTransaction, { ...sampleTransaction, id: 'ffffffff-0000', amount: 500.5 }] } },
      ],
    });
    renderPayments();
    expect(await screen.findByText('TXN-A1B2C3D4')).toBeInTheDocument();
    expect(screen.getByText('TXN-FFFFFFFF')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'BK-B0B0B0B0' })[0]).toHaveAttribute('href', `/bookings/${sampleTransaction.bookingId}`);
    expect(screen.getByText('Total spent').nextSibling).toHaveTextContent(/2[\s,]?000[.,]50/);
  });

  it('invites the client to book when there are no payments', async () => {
    mockApi({ 'GET /transactions/mine': [200, { data: { transactions: [] } }] });
    renderPayments();
    expect(await screen.findByRole('heading', { name: 'No payments yet' })).toBeInTheDocument();
  });

  it('never shows raw server error details', async () => {
    mockApi({ 'GET /transactions/mine': [500, { message: 'ENOENT: no such file /srv/app/src/data/transactions.json' }] });
    renderPayments();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong. Please try again.');
    expect(alert).not.toHaveTextContent('ENOENT');
  });
});
