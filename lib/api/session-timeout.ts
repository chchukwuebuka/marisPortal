/**
 * Session inactivity timeout management for the Student Portal.
 * Automatically logs out students / applicants if inactive for 15 minutes.
 */

export const STUDENT_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const STUDENT_ACTIVITY_STORAGE_KEY = "marist_student_last_activity";

const THROTTLE_MS = 3000;
let lastRecordedTime = 0;

const isBrowser = () => typeof window !== "undefined";

/**
 * Record user activity timestamp in localStorage.
 * Throttled to avoid unnecessary storage writes during rapid interactions.
 */
export function recordStudentActivity(force = false): void {
  if (!isBrowser()) return;
  const now = Date.now();
  if (!force && now - lastRecordedTime < THROTTLE_MS) return;

  lastRecordedTime = now;
  try {
    window.localStorage.setItem(STUDENT_ACTIVITY_STORAGE_KEY, String(now));
  } catch {
    /* storage unavailable in private mode — non-fatal */
  }
}

/**
 * Retrieve the timestamp of the last recorded student interaction.
 */
export function getLastStudentActivity(): number {
  if (!isBrowser()) return 0;
  try {
    const raw = window.localStorage.getItem(STUDENT_ACTIVITY_STORAGE_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Check whether the student session has been idle for more than 15 minutes.
 */
export function isStudentSessionExpired(): boolean {
  if (!isBrowser()) return false;
  const last = getLastStudentActivity();
  if (!last) return false;
  return Date.now() - last >= STUDENT_INACTIVITY_TIMEOUT_MS;
}

/**
 * Clear the stored activity timestamp upon logout.
 */
export function clearStudentSessionActivity(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STUDENT_ACTIVITY_STORAGE_KEY);
    lastRecordedTime = 0;
  } catch {
    /* ignore */
  }
}
