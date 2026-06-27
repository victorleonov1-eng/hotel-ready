// Rate Limiting System - Prevent brute force attacks
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

/**
 * Check if user is rate-limited for login attempts
 */
export function isLoginRateLimited(email: string): { limited: boolean; minutesRemaining?: number } {
  try {
    const key = `${LOGIN_ATTEMPTS_KEY}:${email}`;
    const dataStr = localStorage.getItem(key);

    if (!dataStr) {
      return { limited: false };
    }

    const data: LoginAttempt = JSON.parse(dataStr);
    const now = Date.now();

    // Check if lockout has expired
    if (data.lockedUntil && now > data.lockedUntil) {
      localStorage.removeItem(key);
      return { limited: false };
    }

    // Check if still locked out
    if (data.lockedUntil && now < data.lockedUntil) {
      const minutesRemaining = Math.ceil((data.lockedUntil - now) / 60000);
      return { limited: true, minutesRemaining };
    }

    // Check if attempt window has expired (reset counter)
    if (now - data.firstAttempt > LOCKOUT_DURATION_MS) {
      localStorage.removeItem(key);
      return { limited: false };
    }

    // Check if max attempts exceeded
    if (data.count >= MAX_ATTEMPTS) {
      return { limited: true, minutesRemaining: Math.ceil((data.lockedUntil! - now) / 60000) };
    }

    return { limited: false };
  } catch (error) {
    console.error('[RATE-LIMIT] Error checking rate limit:', error);
    return { limited: false };
  }
}

/**
 * Record a failed login attempt
 */
export function recordFailedLoginAttempt(email: string): void {
  try {
    const key = `${LOGIN_ATTEMPTS_KEY}:${email}`;
    const dataStr = localStorage.getItem(key);
    const now = Date.now();

    let data: LoginAttempt;

    if (!dataStr) {
      data = {
        count: 1,
        firstAttempt: now,
      };
    } else {
      data = JSON.parse(dataStr);

      // Reset counter if window expired
      if (now - data.firstAttempt > LOCKOUT_DURATION_MS) {
        data = {
          count: 1,
          firstAttempt: now,
        };
      } else {
        data.count += 1;

        // Lock out if max attempts reached
        if (data.count >= MAX_ATTEMPTS) {
          data.lockedUntil = now + LOCKOUT_DURATION_MS;
        }
      }
    }

    localStorage.setItem(key, JSON.stringify(data));

    console.log(`[RATE-LIMIT] Failed login attempt ${data.count}/${MAX_ATTEMPTS} for ${email}`);

    if (data.count >= MAX_ATTEMPTS) {
      console.warn(`[RATE-LIMIT] Account locked for ${email} for 15 minutes`);
    }
  } catch (error) {
    console.error('[RATE-LIMIT] Error recording failed attempt:', error);
  }
}

/**
 * Clear failed login attempts for an email (call after successful login)
 */
export function clearLoginAttempts(email: string): void {
  try {
    const key = `${LOGIN_ATTEMPTS_KEY}:${email}`;
    localStorage.removeItem(key);
    console.log(`[RATE-LIMIT] Cleared login attempts for ${email}`);
  } catch (error) {
    console.error('[RATE-LIMIT] Error clearing attempts:', error);
  }
}

/**
 * Get remaining attempts for a user
 */
export function getRemainingAttempts(email: string): number {
  try {
    const key = `${LOGIN_ATTEMPTS_KEY}:${email}`;
    const dataStr = localStorage.getItem(key);

    if (!dataStr) {
      return MAX_ATTEMPTS;
    }

    const data: LoginAttempt = JSON.parse(dataStr);
    const remaining = Math.max(0, MAX_ATTEMPTS - data.count);

    return remaining;
  } catch (error) {
    console.error('[RATE-LIMIT] Error getting remaining attempts:', error);
    return MAX_ATTEMPTS;
  }
}
