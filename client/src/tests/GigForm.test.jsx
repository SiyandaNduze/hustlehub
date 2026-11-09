import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import GigForm from '../components/GigForm';

const categories = ['Design', 'Writing'];

describe('GigForm', () => {
  it('shows validation errors and blocks submission for invalid input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GigForm categories={categories} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /create gig/i }));
    expect(await screen.findByText(/title must be between/i)).toBeInTheDocument();
    expect(screen.getByText(/price must be a number/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a clean payload when the input is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<GigForm categories={categories} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/title/i), 'Logo design');
    await user.type(screen.getByLabelText(/description/i), 'A clean modern logo for your brand.');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Design');
    await user.type(screen.getByLabelText(/price/i), '500');
    await user.click(screen.getByRole('button', { name: /create gig/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Logo design',
      description: 'A clean modern logo for your brand.',
      category: 'Design',
      price: 500,
    });
  });
});
