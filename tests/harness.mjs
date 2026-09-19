/**
 * Lightweight Async Test Harness for vote-ui E2E test suite.
 * Provides describe/it lifecycle, timeout protection, and test isolation.
 */
import { performance } from 'node:perf_hooks';

class TestHarness {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.currentTier = 1;
    this.currentFile = '';
    this.activeOnly = false;
    this.setupExceptionHandling();
  }

  setupExceptionHandling() {
    process.on('unhandledRejection', (reason) => {
      console.error('\n\x1b[31m[CRITICAL] Unhandled Promise Rejection:\x1b[0m', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('\n\x1b[31m[CRITICAL] Uncaught Exception:\x1b[0m', err);
    });
  }

  setCurrentTier(tier) {
    this.currentTier = Number(tier);
  }

  setCurrentFile(file) {
    this.currentFile = String(file);
  }

  describe(name, fn) {
    const suite = {
      tier: this.currentTier,
      file: this.currentFile,
      name,
      tests: [],
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  it(name, fn, options = {}) {
    if (!this.currentSuite) {
      throw new Error(`Test "${name}" must be declared inside a describe() block`);
    }
    const testCase = {
      name,
      fn,
      skip: Boolean(options.skip),
      only: Boolean(options.only),
      timeoutMs: options.timeoutMs || 5000
    };
    if (testCase.only) {
      this.activeOnly = true;
    }
    this.currentSuite.tests.push(testCase);
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAll.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAll.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach.push(fn);
  }

  async run({ verbose = false, bail = false, filter = null, onTestComplete = null } = {}) {
    const filterRegex = filter ? new RegExp(filter, 'i') : null;
    const tierMap = new Map([
      [1, { tier: 1, name: 'Tier 1: Feature Coverage', total: 0, pass: 0, fail: 0, skip: 0, timeMs: 0 }],
      [2, { tier: 2, name: 'Tier 2: Boundary & Corner Cases', total: 0, pass: 0, fail: 0, skip: 0, timeMs: 0 }],
      [3, { tier: 3, name: 'Tier 3: Cross-Feature Interactions', total: 0, pass: 0, fail: 0, skip: 0, timeMs: 0 }],
      [4, { tier: 4, name: 'Tier 4: Real-World Scenarios', total: 0, pass: 0, fail: 0, skip: 0, timeMs: 0 }]
    ]);

    const failures = [];
    const testResults = [];
    let grandTotal = 0;
    let grandPass = 0;
    let grandFail = 0;
    let grandSkip = 0;

    let currentPrintedTier = null;

    for (const suite of this.suites) {
      const stats = tierMap.get(suite.tier) || {
        tier: suite.tier,
        name: `Tier ${suite.tier}`,
        total: 0,
        pass: 0,
        fail: 0,
        skip: 0,
        timeMs: 0
      };

      if (!verbose && suite.tier !== currentPrintedTier) {
        currentPrintedTier = suite.tier;
      }

      // Run suite beforeAll hooks
      for (const hook of suite.beforeAll) {
        await hook();
      }

      for (const test of suite.tests) {
        const fullTitle = `${suite.name} ${test.name}`;
        if (filterRegex && !filterRegex.test(fullTitle)) {
          continue;
        }

        if (test.skip || (this.activeOnly && !test.only)) {
          stats.total++;
          stats.skip++;
          grandTotal++;
          grandSkip++;
          if (verbose) {
            console.log(`  \x1b[33m⊘ SKIP\x1b[0m ${test.name}`);
          }
          continue;
        }

        stats.total++;
        grandTotal++;

        // Run beforeEach hooks
        for (const hook of suite.beforeEach) {
          await hook();
        }

        const start = performance.now();
        let passed = false;
        let testError = null;

        let timerId;
        try {
          const timeoutPromise = new Promise((_, reject) => {
            timerId = setTimeout(() => {
              reject(new Error(`Test exceeded timeout of ${test.timeoutMs}ms`));
            }, test.timeoutMs);
          });
          const execPromise = Promise.resolve().then(() => test.fn());
          await Promise.race([execPromise, timeoutPromise]);
          passed = true;
        } catch (err) {
          testError = err;
        } finally {
          clearTimeout(timerId);
        }

        const duration = performance.now() - start;
        stats.timeMs += duration;

        // Run afterEach hooks
        for (const hook of suite.afterEach) {
          try {
            await hook();
          } catch (hookErr) {
            console.error('Error in afterEach hook:', hookErr);
          }
        }

        const resultRecord = {
          tier: suite.tier,
          file: suite.file,
          suite: suite.name,
          name: test.name,
          passed,
          duration,
          error: testError
        };
        testResults.push(resultRecord);

        if (onTestComplete) {
          onTestComplete(resultRecord, verbose);
        } else {
          if (passed) {
            const timeLabel = `\x1b[2m(${duration.toFixed(1)}ms)\x1b[0m`;
            console.log(`  \x1b[32m✔\x1b[0m ${test.name} ${timeLabel}`);
          } else {
            const timeLabel = `\x1b[2m(${duration.toFixed(1)}ms)\x1b[0m`;
            console.log(`  \x1b[31m✖\x1b[0m \x1b[1m${test.name}\x1b[0m ${timeLabel}`);
          }
        }

        if (passed) {
          stats.pass++;
          grandPass++;
        } else {
          stats.fail++;
          grandFail++;
          failures.push(resultRecord);

          if (bail) {
            console.log(`\n\x1b[33m[BAIL] Stopping test execution immediately due to --bail.\x1b[0m\n`);
            return {
              tierStats: Array.from(tierMap.values()),
              failures,
              testResults,
              grandTotal,
              grandPass,
              grandFail,
              grandSkip
            };
          }
        }
      }

      // Run suite afterAll hooks
      for (const hook of suite.afterAll) {
        try {
          await hook();
        } catch (hookErr) {
          console.error('Error in afterAll hook:', hookErr);
        }
      }
    }

    return {
      tierStats: Array.from(tierMap.values()),
      failures,
      testResults,
      grandTotal,
      grandPass,
      grandFail,
      grandSkip
    };
  }
}

export const harness = new TestHarness();
export const describe = harness.describe.bind(harness);
export const it = harness.it.bind(harness);
export const test = it;
it.skip = (name, fn, opts = {}) => it(name, fn, { ...opts, skip: true });
it.only = (name, fn, opts = {}) => it(name, fn, { ...opts, only: true });
export const beforeAll = harness.beforeAll.bind(harness);
export const afterAll = harness.afterAll.bind(harness);
export const beforeEach = harness.beforeEach.bind(harness);
export const afterEach = harness.afterEach.bind(harness);
