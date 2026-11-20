// In-memory per-IP failed-attempt counters (design §5, rule 5; OWASP A07).
// Counters live only in this server process, so restarting `npm run dev`
// clears the block — the agreed behaviour for AC-06.
const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES = 5;

const failures = new Map<string, number[]>();

function recentFailures(ip: string): number[] {
  const now = Date.now();
  const kept = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (kept.length > 0) {
    failures.set(ip, kept);
  } else {
    failures.delete(ip);
  }
  return kept;
}

export function isThrottled(ip: string): boolean {
  return recentFailures(ip).length >= MAX_FAILURES;
}

export function recordFailure(ip: string): void {
  const kept = recentFailures(ip);
  kept.push(Date.now());
  // Store after the push: recentFailures() deletes the entry when empty,
  // so pushing alone could write to an orphaned array.
  failures.set(ip, kept);
}
