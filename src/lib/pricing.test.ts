import { describe, it, expect } from 'vitest';
import { calculateBasePrice, calculateFinalPrice } from './pricing';

describe('calculateBasePrice', () => {
  it('calculates 30% margin on 100000 cost', () => {
    expect(calculateBasePrice(100000, 30)).toBe(130000);
  });

  it('returns cost price when margin is 0', () => {
    expect(calculateBasePrice(50000, 0)).toBe(50000);
  });

  it('handles zero cost price', () => {
    expect(calculateBasePrice(0, 30)).toBe(0);
  });

  it('handles zero margin and zero cost', () => {
    expect(calculateBasePrice(0, 0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calculateBasePrice(100, 33)).toBe(133);
    expect(calculateBasePrice(100, 34)).toBe(134);
  });
});

describe('calculateFinalPrice', () => {
  it('adds 19% VAT to 130000 base price', () => {
    expect(calculateFinalPrice(130000, 19)).toBe(154700);
  });

  it('returns base price when tax is 0', () => {
    expect(calculateFinalPrice(50000, 0)).toBe(50000);
  });

  it('handles zero base price', () => {
    expect(calculateFinalPrice(0, 19)).toBe(0);
  });
});