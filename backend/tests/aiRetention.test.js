import test from 'node:test';
import assert from 'node:assert/strict';
import { getRetentionExpiryDate, isExpiredAt } from '../utils/aiRetention.js';

test('retention expiry is exactly 7 days from the anchor timestamp', () => {
  const anchor = new Date('2025-01-01T00:00:00.000Z');
  const expiry = getRetentionExpiryDate(anchor);
  assert.equal(expiry.toISOString(), '2025-01-08T00:00:00.000Z');
});

test('expired records are detected after the retention window ends', () => {
  const expiry = new Date('2025-01-08T00:00:00.000Z');
  assert.equal(isExpiredAt(expiry, new Date('2025-01-09T00:00:00.000Z')), true);
  assert.equal(isExpiredAt(expiry, new Date('2025-01-07T12:00:00.000Z')), false);
});
