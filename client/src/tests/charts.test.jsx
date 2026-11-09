import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import HorizontalBars from '../components/charts/HorizontalBars';

const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

describe('BarChart', () => {
  it('draws one bar per month with an accessible label', () => {
    const data = months.map((label, i) => ({ label, value: i === 1 ? 5000 : 0 }));
    const { container } = render(<BarChart data={data} title="Monthly income for 2026/27" />);
    expect(screen.getByRole('img', { name: 'Monthly income for 2026/27' })).toBeInTheDocument();
    expect(container.querySelectorAll('rect.bar')).toHaveLength(12);
    expect(container.querySelectorAll('rect.bar-empty')).toHaveLength(11);
    expect(screen.getByText('Apr')).toBeInTheDocument();
  });

  it('makes the biggest value the tallest bar', () => {
    const data = [{ label: 'A', value: 100 }, { label: 'B', value: 400 }];
    const { container } = render(<BarChart data={data} title="t" />);
    const [a, b] = [...container.querySelectorAll('rect.bar')].map((r) => Number(r.getAttribute('height')));
    expect(b).toBeGreaterThan(a);
  });

  it('handles an all-zero year without crashing', () => {
    const { container } = render(<BarChart data={months.map((label) => ({ label, value: 0 }))} title="empty" />);
    expect(container.querySelectorAll('rect.bar-empty')).toHaveLength(12);
  });
});

describe('DonutChart', () => {
  const segments = [
    { label: 'Net income', value: 900, tone: 'net' },
    { label: 'Estimated tax', value: 100, tone: 'tax' },
  ];

  it('shows the centre value and a legend with percentages', () => {
    render(<DonutChart segments={segments} title="Split" centerValue="10%" centerLabel="effective rate" />);
    expect(screen.getByRole('img', { name: 'Split' })).toBeInTheDocument();
    expect(screen.getByText('10%', { selector: 'text' })).toBeInTheDocument();
    expect(screen.getByText('Net income')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('draws one arc per segment and none when there is no data', () => {
    const { container, rerender } = render(<DonutChart segments={segments} title="Split" centerValue="" centerLabel="" />);
    expect(container.querySelectorAll('circle.donut-seg')).toHaveLength(2);
    rerender(<DonutChart segments={segments.map((s) => ({ ...s, value: 0 }))} title="Split" centerValue="" centerLabel="" />);
    expect(container.querySelectorAll('circle.donut-seg')).toHaveLength(0);
  });
});

describe('HorizontalBars', () => {
  it('lists each item with a progress meter scaled to the largest value', () => {
    render(<HorizontalBars label="By gig" items={[{ label: 'Logo', value: 300, sub: '2 bookings' }, { label: 'Banner', value: 100 }]} />);
    const meters = screen.getAllByRole('progressbar');
    expect(meters).toHaveLength(2);
    expect(meters[0]).toHaveAttribute('max', '300');
    expect(meters[1]).toHaveAttribute('value', '100');
    expect(screen.getByText('2 bookings')).toBeInTheDocument();
  });
});
