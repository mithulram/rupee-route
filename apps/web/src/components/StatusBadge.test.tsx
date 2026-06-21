import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders a human-readable label for known transfer states', () => {
    render(<StatusBadge state="funding_pending" />);
    expect(screen.getByText('Awaiting funding')).toBeTruthy();
    expect(screen.getByLabelText('Status: Awaiting funding')).toBeTruthy();
  });

  it('falls back to title-cased state when label is unknown', () => {
    render(<StatusBadge state="custom_state" />);
    expect(screen.getByText('custom state')).toBeTruthy();
  });

  it('applies error tone for failed states', () => {
    const { container } = render(<StatusBadge state="payout_failed" />);
    expect(container.querySelector('.status-error')).toBeTruthy();
  });
});
