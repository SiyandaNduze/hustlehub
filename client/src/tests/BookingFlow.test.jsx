import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import GigsPage from '../pages/GigsPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import { clientUser, mockApi, renderWithAuth, sampleBooking, sampleGig, sampleTransaction, sentBody } from './helpers';

const routes = { '/gigs': <GigsPage />, '/bookings/:id': <BookingDetailPage /> };

describe('Booking flow (client)', () => {
  it('books a gig and shows the receipt with the recorded transaction', async () => {
    const user = userEvent.setup();
    const fetchSpy = mockApi({
      'GET /gigs/categories': [200, { data: { categories: ['Design', 'Writing'] } }],
      'GET /gigs': [200, { data: { gigs: [sampleGig] } }],
      'POST /bookings': [201, { data: { booking: sampleBooking, transaction: sampleTransaction } }],
    });
    renderWithAuth(routes, { user: clientUser, at: '/gigs' });

    await user.click(await screen.findByRole('button', { name: 'Book this gig' }));
    await user.type(screen.getByLabelText(/notes/i), 'Blue and gold please');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    // Receipt: booking + transaction references
    expect(await screen.findByText(/Booking confirmed/)).toBeInTheDocument();
    const receipt = screen.getByRole('article', { name: /Booking BK-B0B0B0B0/ });
    expect(within(receipt).getByText('TXN-A1B2C3D4')).toBeInTheDocument();
    expect(within(receipt).getByText('Blue and gold please')).toBeInTheDocument();

    // Only the gig id and notes are sent - the client never sends a price
    expect(sentBody(fetchSpy, 'POST', '/bookings')).toEqual({ gigId: sampleGig.id, notes: 'Blue and gold please' });
  });

  it('shows the rate-limit message when the API refuses the booking', async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /gigs/categories': [200, { data: { categories: [] } }],
      'GET /gigs': [200, { data: { gigs: [sampleGig] } }],
      'POST /bookings': [429, { message: 'Too many booking attempts. Please wait a few minutes and try again.' }],
    });
    renderWithAuth(routes, { user: clientUser, at: '/gigs' });
    await user.click(await screen.findByRole('button', { name: 'Book this gig' }));
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many booking attempts');
  });

  it("does not reveal another user's booking (403 from the API)", async () => {
    mockApi({
      [`GET /bookings/${sampleBooking.id}`]: [403, { message: 'You cannot access this booking' }],
      'GET /transactions/mine': [200, { data: { transactions: [] } }],
    });
    renderWithAuth(routes, { user: clientUser, at: `/bookings/${sampleBooking.id}` });
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't find that booking, or it isn't yours to view.");
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('loads a saved booking and matches its transaction', async () => {
    mockApi({
      [`GET /bookings/${sampleBooking.id}`]: [200, { data: { booking: sampleBooking } }],
      'GET /transactions/mine': [200, { data: { transactions: [sampleTransaction] } }],
    });
    renderWithAuth(routes, { user: clientUser, at: `/bookings/${sampleBooking.id}` });
    expect(await screen.findByText('TXN-A1B2C3D4')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });
});
