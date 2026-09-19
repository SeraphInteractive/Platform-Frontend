/**
 * Core Assertions Suite for vote-ui E2E Tests.
 */
import assert from 'node:assert/strict';

export { assert };

export function assertEqual(actual, expected, message) {
  assert.strictEqual(actual, expected, message);
}

export function assertNotEqual(actual, unexpected, message) {
  assert.notStrictEqual(actual, unexpected, message);
}

export function assertDeepEqual(actual, expected, message) {
  assert.deepStrictEqual(actual, expected, message);
}

export function assertTrue(value, message) {
  assert.strictEqual(Boolean(value), true, message || `Expected ${value} to be truthy`);
}

export function assertFalse(value, message) {
  assert.strictEqual(Boolean(value), false, message || `Expected ${value} to be falsy`);
}

export function assertMatch(actualStr, pattern, message) {
  assert.match(String(actualStr), pattern, message);
}

export function assertDoesNotMatch(actualStr, pattern, message) {
  assert.doesNotMatch(String(actualStr), pattern, message);
}

export function assertGreaterThanOrEqual(actual, min, message) {
  if (typeof actual !== 'number' || actual < min) {
    throw new assert.AssertionError({
      message: message || `Expected ${actual} >= ${min}`,
      actual,
      expected: min,
      operator: '>='
    });
  }
}

export function assertLessThanOrEqual(actual, max, message) {
  if (typeof actual !== 'number' || actual > max) {
    throw new assert.AssertionError({
      message: message || `Expected ${actual} <= ${max}`,
      actual,
      expected: max,
      operator: '<='
    });
  }
}

export function assertBetween(actual, min, max, message) {
  if (typeof actual !== 'number' || actual < min || actual > max) {
    throw new assert.AssertionError({
      message: message || `Expected ${actual} to be within [${min}, ${max}]`,
      actual,
      expected: `[${min}, ${max}]`,
      operator: 'between'
    });
  }
}

export function assertIncludes(haystack, needle, message) {
  const contains = Array.isArray(haystack) || typeof haystack === 'string'
    ? haystack.includes(needle)
    : (haystack && typeof haystack === 'object' && needle in haystack);
  if (!contains) {
    throw new assert.AssertionError({
      message: message || `Expected collection to include ${JSON.stringify(needle)}`,
      actual: haystack,
      expected: needle,
      operator: 'includes'
    });
  }
}

export function assertDoesNotInclude(haystack, needle, message) {
  const contains = Array.isArray(haystack) || typeof haystack === 'string'
    ? haystack.includes(needle)
    : (haystack && typeof haystack === 'object' && needle in haystack);
  if (contains) {
    throw new assert.AssertionError({
      message: message || `Expected collection NOT to include ${JSON.stringify(needle)}`,
      actual: haystack,
      expected: `NOT ${needle}`,
      operator: 'doesNotInclude'
    });
  }
}

export function assertThrows(fn, expected, message) {
  assert.throws(fn, expected, message);
}

export async function assertRejects(asyncFn, expected, message) {
  await assert.rejects(asyncFn, expected, message);
}
