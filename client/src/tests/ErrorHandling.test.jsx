import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';
import IncomePage from '../pages/IncomePage';
import { api } from '../api/client';

vi.mock('../api/client', () => ({ api: { get: vi.fn() } }));
const router = (ui) => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);

describe('crash protection', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  it('shows a friendly message instead of a blank page when a page throws', () => {
    const Boom = () => {
      throw new Error('secret internals');
    };
    router(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.queryByText(/secret internals/)).not.toBeInTheDocument();
  });

  it('income page explains an old-format API response instead of crashing', async () => {
    api.get.mockResolvedValue({ data: { totalEarned: 3000, estimatedTax: 450, estimatedNetIncome: 2550 } });
    router(<IncomePage />);
    expect(await screen.findByText(/unexpected format/i)).toBeInTheDocument();
  });
});
