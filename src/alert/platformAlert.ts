/**
 * The platform's native alert dialog.
 *
 * iOS, Android and macOS use React Native's built-in `Alert`, which is a
 * native dialog on each of those platforms. Windows has its own variant
 * (`platformAlert.windows.ts`); see the note there.
 *
 * React Native is loaded lazily via `require()` inside a try-catch rather than
 * with a static `import`, matching the lazy native-module loading used across
 * this package (see `theme.rn.ts`, `network.rn.ts`, `storage.rn.ts`). This
 * avoids crashes when RN is not linked and keeps RN's Flow-typed entry point
 * out of the module graph at import time, so the package (and the test runner)
 * can import this file without pulling in — and trying to transform —
 * `react-native` itself.
 */

/** Minimal surface of React Native's `Alert` that this package uses. */
export interface NativeAlert {
  alert(
    title: string,
    message?: string,
    buttons?: unknown,
    options?: unknown
  ): void;
}

let AlertModule: NativeAlert | null = null;

/**
 * Lazily load and return React Native's `Alert`.
 *
 * Uses `require()` inside a try-catch to avoid crashes when React Native is
 * not available (e.g., in test environments without native modules). The
 * module is cached after the first successful load.
 *
 * @returns The native `Alert`, or `null` if not available.
 */
function getAlert(): NativeAlert | null {
  if (!AlertModule) {
    try {
      const RN: { Alert: NativeAlert } = require('react-native');
      AlertModule = RN.Alert;
    } catch (e) {
      console.warn('Alert not available:', e);
    }
  }
  return AlertModule;
}

/**
 * Platform native alert. Delegates to RN's `Alert`, loaded on first use. If
 * React Native is unavailable the call is a safe no-op.
 */
export const nativeAlert: NativeAlert = {
  alert(title, message, buttons, options): void {
    getAlert()?.alert(title, message, buttons, options);
  },
};
