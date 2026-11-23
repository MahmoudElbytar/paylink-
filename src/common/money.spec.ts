import { Money } from './money';

describe('Money', () => {
  it('adds exactly, unlike floating point (0.1 + 0.2)', () => {
    expect(Money.of('0.10').add(Money.of('0.20')).toString()).toBe('0.30');
  });

  it('computes 350.00 + 2.50 = 352.50', () => {
    expect(Money.of('350.00').add(Money.of('2.50')).toString()).toBe('352.50');
  });

  it('rounds percentages half-up to 2 decimals', () => {
    expect(Money.of('50').percent('1.5').toString()).toBe('0.75');
    expect(Money.of('10.10').percent('1.5').toString()).toBe('0.15');
  });

  it('converts to and from piasters', () => {
    expect(Money.of('352.50').toPiasters()).toBe(35250n);
    expect(Money.fromPiasters(35250n).toString()).toBe('352.50');
  });

  it('rejects non-integer JS numbers', () => {
    expect(() => Money.of(0.1)).toThrow();
  });

  it('compares values', () => {
    expect(Money.of('5').lessThan(Money.of('5.01'))).toBe(true);
    expect(Money.of('5').subtract(Money.of('6')).isNegative()).toBe(true);
  });
});
