import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { TransferSummary } from '@rupeeroute/api-contracts';
import { TransferListItem } from '../components/TransferListItem';

const transfer: TransferSummary = {
  id: 'tr_1',
  state: 'awaiting_funding',
  quoteId: 'q_1',
  recipientId: 'r_1',
  correlationId: 'corr_1',
  failureReason: null,
  createdAt: '2026-06-20T10:00:00.000Z',
  updatedAt: '2026-06-20T10:05:00.000Z',
  sourceCurrency: 'EUR',
  sourceAmountMinor: '10000',
  targetAmountMinor: '900000',
  recipientName: 'Priya Sharma',
};

describe('TransferListItem', () => {
  it('renders amount, recipient, and state', () => {
    render(<TransferListItem transfer={transfer} />);
    expect(screen.getByText(/100\.00/)).toBeTruthy();
    expect(screen.getByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText('Awaiting Funding')).toBeTruthy();
  });

  it('invokes onPress when selected', () => {
    const onPress = vi.fn();
    render(<TransferListItem onPress={onPress} transfer={transfer} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
