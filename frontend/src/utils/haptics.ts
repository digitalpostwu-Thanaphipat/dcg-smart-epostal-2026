/**
 * haptics.ts - Native Illusion Vibration Utility
 * Provides tactile feedback for mobile PWA users.
 */

export const haptics = {
  /**
   * light - Subtle pulse for navigation or selection
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * medium - Standard pulse for successful actions (e.g. Add to list)
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  },

  /**
   * heavy - Strong pulse for major completions (e.g. Save to DB)
   */
  heavy: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  },

  /**
   * error - Distinct double-pulse for failures
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * success - Harmonic double-pulse for success
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  },

  /**
   * notification - Generic notification pulse
   */
  notification: (type: 'success' | 'warning' | 'error' = 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'error') navigator.vibrate([100, 50, 100]);
      else if (type === 'warning') navigator.vibrate([50, 100, 50]);
      else navigator.vibrate(50);
    }
  }
};
