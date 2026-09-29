// Heavy decorative effects (WebGL backgrounds) only on capable desktop browsers:
// never on phones, and never when the person asked for less motion / data saving
// or the device reports little memory or few cores.
export function canRunHeavyEffects() {
  const nav = navigator;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (nav.connection && nav.connection.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if ((nav.hardwareConcurrency || 8) < 4) return false;
  return window.matchMedia('(min-width: 768px)').matches;
}

// Runs after first paint so the form is interactive before any optional work.
export function whenIdle(callback) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 300);
  return () => clearTimeout(id);
}
