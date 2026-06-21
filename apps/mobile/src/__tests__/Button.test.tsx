import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from '../components/Button';

describe('Button', () => {
  it('renders the provided label', () => {
    render(<Button label="Send money" onPress={() => undefined} />);
    expect(screen.getByText('Send money')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    render(<Button label="Continue" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn();
    render(<Button disabled label="Continue" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
