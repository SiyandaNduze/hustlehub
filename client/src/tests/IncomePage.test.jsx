import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IncomePage from '../pages/IncomePage';
import { api } from '../api/client';

vi.mock('../api/client', () => ({ api: { get: vi.fn() } }));

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <IncomePage />
    </MemoryRouter>
  );

const bracket = (from, to, rate, amountInBracket, taxInBracket, reached) => ({ from, to, rate, baseTax: 0, amountInBracket, taxInBracket, reached });

const fixture = {
  currency: 'ZAR',
  taxYear: { startYear: 2026, label: '2026/27', start: '2026-03-01', end: '2027-02-28' },
  availableTaxYears: [{ startYear: 2026, label: '2026/27' }, { startYear: 2025, label: '2025/26' }],
  totalEarned: 150000,
  bookingCount: 12,
  estimatedTax: 9180,
  estimatedNetIncome: 140820,
  tax: {
    taxableIncome: 150000, taxBeforeRebate: 27000, rebate: 17820, taxThreshold: 99000, estimatedTax: 9180,
    netIncome: 140820, effectiveRatePercent: 6.12, marginalRatePercent: 18,
    nextBracket: { startsAt: 245100, rate: 26, remaining: 95100 },
    brackets: [
      bracket(0, 245100, 18, 150000, 27000, true),
      bracket(245100, 383100, 26, 0, 0, false),
      bracket(383100, null, 31, 0, 0, false),
    ],
  },
  monthly: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map((label, i) => ({ month: `2026-${i}`, label, income: i === 0 ? 150000 : 0 })),
  byGig: [{ gigId: 'g1', gigTitle: 'Brand identity package', bookings: 12, income: 150000 }],
  transactions: [{ id: 'abcdef123456', bookingId: 'bk9876543210', gigTitle: 'Brand identity package', clientName: 'Sipho Nkosi', amount: 12500, status: 'completed', createdAt: '2026-10-20T09:30:00Z' }],
  method: { summary: 'Estimated tax = progressive SARS tax minus the primary rebate.', steps: ['Add up your bookings.', 'Apply the brackets.'], assumptions: ['You are under 65.'] },
  disclaimer: 'Illustrative estimate only. This is not tax advice.',
};

describe('IncomePage', () => {
  beforeEach(() => api.get.mockReset());

  it('shows the summary cards, charts, bracket breakdown and explanation', async () => {
    api.get.mockResolvedValue({ data: fixture });
    renderPage();
    expect(await screen.findByText('Gross income')).toBeInTheDocument();
    expect(screen.getAllByText('Estimated tax').length).toBeGreaterThan(0); // card label + chart legend
    expect(screen.getByText('Net after tax')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /monthly income for 2026\/27/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /income split between tax and net/i })).toBeInTheDocument();
    expect(screen.getByText(/marginal rate is/i)).toHaveTextContent('18%');
    expect(screen.getByText(/How this estimate works/i)).toBeInTheDocument();
    expect(screen.getByText('Add up your bookings.')).toBeInTheDocument();
    expect(screen.getByText(/not tax advice/i)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/income');
  });

  it('lists the tax-year transactions and links each one to its booking receipt', async () => {
    api.get.mockResolvedValue({ data: fixture });
    renderPage();
    expect(await screen.findByText('TXN-ABCDEF12')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'BK-BK987654' })).toHaveAttribute('href', '/bookings/bk9876543210');
  });

  it('reloads the dashboard when another tax year is chosen', async () => {
    api.get.mockResolvedValue({ data: fixture });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Gross income');
    await user.selectOptions(screen.getByLabelText(/tax year/i), '2025');
    expect(api.get).toHaveBeenLastCalledWith('/income?taxYear=2025');
  });

  it('explains when income is below the tax threshold', async () => {
    const low = { ...fixture, totalEarned: 50000, estimatedTax: 0, tax: { ...fixture.tax, taxableIncome: 50000, estimatedTax: 0, netIncome: 50000, effectiveRatePercent: 0, marginalRatePercent: 0 } };
    api.get.mockResolvedValue({ data: low });
    renderPage();
    expect(await screen.findByText(/below the tax threshold/i)).toBeInTheDocument();
  });

  it('shows a friendly error instead of crashing when the API fails', async () => {
    api.get.mockRejectedValue(Object.assign(new Error('Unable to reach the server. Please try again.'), { fieldErrors: [] }));
    renderPage();
    expect(await screen.findByText('Unable to reach the server. Please try again.')).toBeInTheDocument();
  });
});
