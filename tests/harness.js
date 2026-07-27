/* A very small test harness. No dependencies, runs in the browser, prints to
   both the page and the console so it can be read either way. */

const suites = [];

export function suite(name, fn) {
  suites.push({ name, fn });
}

export function makeContext() {
  const results = [];
  const ctx = {
    results,
    test(name, fn) {
      try {
        fn();
        results.push({ name, ok: true });
      } catch (err) {
        results.push({ name, ok: false, message: err && err.message ? err.message : String(err) });
      }
    },
    assert(condition, message) {
      if (!condition) throw new Error(message || 'assertion failed');
    },
    equal(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(`${message || 'values differ'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    deepEqual(actual, expected, message) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`${message || 'values differ'}: expected ${b}, got ${a}`);
    },
    includes(haystack, needle, message) {
      const ok = Array.isArray(haystack) ? haystack.includes(needle) : String(haystack).includes(needle);
      if (!ok) throw new Error(`${message || 'value not found'}: ${JSON.stringify(needle)}`);
    },
    notIncludes(haystack, needle, message) {
      const ok = Array.isArray(haystack) ? haystack.includes(needle) : String(haystack).includes(needle);
      if (ok) throw new Error(`${message || 'value unexpectedly present'}: ${JSON.stringify(needle)}`);
    },
    throws(fn, message) {
      let threw = false;
      try { fn(); } catch (e) { threw = true; }
      if (!threw) throw new Error(message || 'expected a throw');
    }
  };
  return ctx;
}

export async function runAll(outputElement) {
  let passed = 0;
  let failed = 0;
  const lines = [];

  for (const s of suites) {
    const ctx = makeContext();
    try {
      await s.fn(ctx);
    } catch (err) {
      ctx.results.push({ name: 'suite setup', ok: false, message: err.message });
    }
    const suitePassed = ctx.results.filter((r) => r.ok).length;
    const suiteFailed = ctx.results.length - suitePassed;
    passed += suitePassed;
    failed += suiteFailed;
    lines.push({ type: 'suite', name: s.name, passed: suitePassed, failed: suiteFailed });
    ctx.results.forEach((r) => lines.push({ type: 'test', ...r }));
  }

  render(outputElement, lines, passed, failed);
  const summary = `${passed} passed, ${failed} failed`;
  if (failed) console.error(`[tests] ${summary}`);
  else console.info(`[tests] ${summary}`);
  return { passed, failed, lines };
}

function render(root, lines, passed, failed) {
  if (!root) return;
  root.innerHTML = '';
  const summary = document.createElement('div');
  summary.className = `summary ${failed ? 'fail' : 'pass'}`;
  summary.textContent = `${passed} passed, ${failed} failed`;
  root.appendChild(summary);

  lines.forEach((line) => {
    const node = document.createElement('div');
    if (line.type === 'suite') {
      node.className = 'suite';
      node.textContent = `${line.name} (${line.passed} passed, ${line.failed} failed)`;
    } else {
      node.className = `test ${line.ok ? 'pass' : 'fail'}`;
      node.textContent = `${line.ok ? 'PASS' : 'FAIL'}  ${line.name}${line.ok ? '' : `  ${line.message}`}`;
    }
    root.appendChild(node);
  });
}
