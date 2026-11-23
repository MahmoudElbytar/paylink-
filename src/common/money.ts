import Decimal from 'decimal.js';

/** Exact money in EGP. Never uses floating point arithmetic. */
export class Money {
  private constructor(private readonly value: Decimal) {}

  static of(amount: string | number | Decimal): Money {
    if (typeof amount === 'number' && !Number.isInteger(amount)) {
      throw new Error('Pass non-integer amounts as strings, not floats');
    }
    return new Money(new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  }

  static fromPiasters(p: bigint | number | string): Money {
    return new Money(new Decimal(p.toString()).div(100));
  }

  add(o: Money): Money { return new Money(this.value.plus(o.value)); }
  subtract(o: Money): Money { return new Money(this.value.minus(o.value)); }
  percent(pct: string): Money { return Money.of(this.value.times(pct).div(100)); }
  isNegative(): boolean { return this.value.isNegative(); }
  greaterThan(o: Money): boolean { return this.value.gt(o.value); }
  lessThan(o: Money): boolean { return this.value.lt(o.value); }
  equals(o: Money): boolean { return this.value.eq(o.value); }
  toPiasters(): bigint { return BigInt(this.value.times(100).toFixed(0)); }
  toString(): string { return this.value.toFixed(2); }
}
