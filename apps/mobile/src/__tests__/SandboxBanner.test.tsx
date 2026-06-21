import { render, screen } from '@testing-library/react';
import { SandboxBanner } from '../components/SandboxBanner';

describe('SandboxBanner', () => {
  it('renders sandbox warning text', () => {
    render(<SandboxBanner />);
    expect(screen.getByTestId('sandbox-banner')).toBeTruthy();
    expect(screen.getByText('Sandbox — no real money movement')).toBeTruthy();
  });

  it('exposes an accessibility label for screen readers', () => {
    render(<SandboxBanner />);
    expect(screen.getByLabelText('Sandbox mode. No real money movement.')).toBeTruthy();
  });
});
