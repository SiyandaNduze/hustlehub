import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import MyGigsPage from '../pages/MyGigsPage';
import { freelancerUser, mockApi, renderWithAuth, sampleGig, sentBody } from './helpers';

const renderMyGigs = () => renderWithAuth({ '/my-gigs': <MyGigsPage /> }, { user: freelancerUser, at: '/my-gigs' });
const base = {
  'GET /gigs/categories': [200, { data: { categories: ['Design'] } }],
  'GET /gigs/mine': [200, { data: { gigs: [sampleGig] } }],
};

describe('MyGigsPage', () => {
  it('asks for confirmation before deleting a gig', async () => {
    const user = userEvent.setup();
    const fetchSpy = mockApi({ ...base, [`DELETE /gigs/${sampleGig.id}`]: [200, { message: 'Gig deleted' }] });
    renderMyGigs();
    const row = (await screen.findByRole('heading', { name: 'Logo design' })).closest('li');

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(fetchSpy.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(false);

    await user.click(within(row).getByRole('button', { name: 'Confirm delete' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Deleted "Logo design"');
    expect(fetchSpy.mock.calls.some(([url, o]) => o?.method === 'DELETE' && url === `/api/gigs/${sampleGig.id}`)).toBe(true);
  });

  it('hides a live gig by sending only the active flag', async () => {
    const user = userEvent.setup();
    const fetchSpy = mockApi({ ...base, [`PUT /gigs/${sampleGig.id}`]: [200, { data: { gig: { ...sampleGig, active: false } } }] });
    renderMyGigs();
    await user.click(await screen.findByRole('button', { name: 'Hide' }));
    expect(await screen.findByRole('status')).toHaveTextContent('hidden from clients');
    expect(sentBody(fetchSpy, 'PUT', `/gigs/${sampleGig.id}`)).toEqual({ active: false });
  });

  it('opens the edit form pre-filled with the gig', async () => {
    const user = userEvent.setup();
    mockApi(base);
    renderMyGigs();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit gig' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Logo design');
    expect(screen.getByLabelText('Price (ZAR)')).toHaveValue(1500);
  });
});
