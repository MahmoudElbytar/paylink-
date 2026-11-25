import Decimal from 'decimal.js';

/**
 * Represents an exact monetary amount in Egyptian Pounds (EGP).
 * Uses Decimal arithmetic to avoid floating-point precision errors.
 */
export class Money {
  // Create a private constructor to control Money object creation
  private constructor(private readonly value: Decimal) {}

  // Create a Money instance from an amount
  static of(amount: string | number | Decimal): Money {
    // Reject decimal numbers passed as JavaScript floats
    if (typeof amount === 'number' && !Number.isInteger(amount)) {
      throw new Error('Pass non-integer amounts as strings, not floats');
    }

    // Convert the amount to Decimal and round it to 2 decimal places
    return new Money(new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  }

  // Create a Money instance from piasters (100 piasters = 1 EGP)
  static fromPiasters(p: bigint | number | string): Money {
    return new Money(new Decimal(p.toString()).div(100));
  }

  // Add another Money amount to the current value
  add(o: Money): Money {
    return new Money(this.value.plus(o.value));
  }

  // Subtract another Money amount from the current value
  subtract(o: Money): Money {
    return new Money(this.value.minus(o.value));
  }

  // Calculate a percentage of the current amount
  percent(pct: string): Money {
    return Money.of(this.value.times(pct).div(100));
  }

  // Check whether the amount is negative
  isNegative(): boolean {
    return this.value.isNegative();
  }

  // Check whether the current amount is greater than another amount
  greaterThan(o: Money): boolean {
    return this.value.gt(o.value);
  }
}
  lessThan(o: Money): boolean { return this.value.lt(o.value); }
  equals(o: Money): boolean { return this.value.eq(o.value); }
  toPiasters(): bigint { return BigInt(this.value.times(100).toFixed(0)); }
  toString(): string { return this.value.toFixed(2); }
}
