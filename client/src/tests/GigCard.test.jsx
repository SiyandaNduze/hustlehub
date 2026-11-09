import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import GigCard from '../components/GigCard';

const gig = {
  id: 'gig-1',
  title: 'Logo design',
  description: 'A clean modern logo for your brand.',
  category: 'Design',
  price: 500,
  freelancerName: 'Frankie Freelancer',
};

describe('GigCard', () => {
  it('renders gig details', () => {
    render(<GigCard gig={gig} role="client" />);
    expect(screen.getByText('Logo design')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText(/Frankie Freelancer/)).toBeInTheDocument();
  });

  it('lets a client book: opens the notes box and confirms with the notes', async () => {
    const user = userEvent.setup();
    const onBook = vi.fn();
    render(<GigCard gig={gig} role="client" onBook={onBook} />);
    await user.click(screen.getByRole('button', { name: /book this gig/i }));
    await user.type(screen.getByLabelText(/notes/i), 'Use blue');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(onBook).toHaveBeenCalledWith('gig-1', 'Use blue');
  });

  it('shows role-appropriate actions only', () => {
    const { rerender } = render(<GigCard gig={gig} role="freelancer" />);
    expect(screen.queryByRole('button', { name: /book this gig/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete gig/i })).not.toBeInTheDocument();

    rerender(<GigCard gig={gig} role="admin" onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /delete gig/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book this gig/i })).not.toBeInTheDocument();
  });

  it('renders malicious markup as plain text, not HTML (XSS protection)', () => {
    const evil = { ...gig, title: '<img src=x onerror=alert(1)>' };
    const { container } = render(<GigCard gig={evil} role="client" />);
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
