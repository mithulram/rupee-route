import { describe, expect, it } from 'vitest';
import { formatMinorAmount, formatTransferState, parseMajorToMinor } from './format';

describe('formatMinorAmount', () => {
  it('formats EUR minor units', () => {
    expect(formatMinorAmount('10000', 'EUR')).toContain('100');
  });

  it('formats INR minor units', () => {
    expect(formatMinorAmount('900000', 'INR')).toContain('9');
  });
});

describe('parseMajorToMinor', () => {
  it('parses decimal amounts', () => {
    expect(parseMajorToMinor('100.50', 'EUR')).toBe('10050');
  });
});

describe('formatTransferState', () => {
  it('title-cases snake_case states', () => {
    expect(formatTransferState('funding_pending')).toBe('Funding Pending');
  });
});
