/**
 * React Native implementation of AlertInterface using the platform's native
 * alert dialog.
 *
 * On iOS, Android and macOS this is React Native's built-in `Alert`. On Windows
 * it is react-native-windows' native XAML dialog (see `platformAlert.windows.ts`).
 *
 * @ai-context RN AlertInterface implementation using the native alert dialog
 * @ai-pattern Stateless singleton service delegating to the platform alert
 * @ai-usage Initialize once at app startup, then call getAlertService().alert(...)
 *
 * @example
 * ```ts
 * // At app startup:
 * initializeAlertService();
 *
 * // Anywhere in your app (via the DI singleton):
 * import { getAlertService } from '@sudobility/di';
 * getAlertService().alert('Title', 'Message', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'OK', onPress: () => doThing() },
 * ]);
 * ```
 */

import {
  type AlertInterface,
  type AlertButton,
  initializeAlertService as initializeDiAlertService,
} from '@sudobility/di/interfaces';
import type { Optional } from '@sudobility/types';
// Extensionless so the host bundler can pick the platform variant
// (`platformAlert.windows`) on Windows.
import { nativeAlert } from './platformAlert';

/**
 * React Native implementation of AlertInterface.
 *
 * Stateless — delegates to the platform's native alert dialog. No React
 * component needs to be mounted (unlike the banner-based info service).
 */
export class RNAlertService implements AlertInterface {
  /**
   * Show a native alert dialog with the given title, message and buttons.
   */
  alert(
    title: string,
    message?: Optional<string>,
    buttons?: Optional<AlertButton[]>
  ): void {
    nativeAlert.alert(title, message ?? undefined, buttons ?? undefined);
  }
}

/**
 * Create a new `RNAlertService` instance.
 */
export function createRNAlertService(): RNAlertService {
  return new RNAlertService();
}

// Singleton instance
let alertServiceInstance: RNAlertService | null = null;

/**
 * Initialize the alert service singleton.
 *
 * Also registers with `@sudobility/di` so `getAlertService()` works from both
 * packages. If already initialized, this call is a no-op.
 *
 * @param service - Optional `RNAlertService` instance. If omitted, a new one is created.
 */
export function initializeAlertService(service?: RNAlertService): void {
  if (alertServiceInstance) {
    return;
  }
  alertServiceInstance = service ?? new RNAlertService();
  // Also register with @sudobility/di so getAlertService() from that package works
  initializeDiAlertService(alertServiceInstance);
}

/**
 * Get the alert service singleton.
 *
 * @throws Error if the service has not been initialized via `initializeAlertService()`.
 */
export function getAlertService(): RNAlertService {
  if (!alertServiceInstance) {
    throw new Error(
      'Alert service not initialized. Call initializeAlertService() at app startup.'
    );
  }
  return alertServiceInstance;
}

/**
 * Reset the alert service singleton to `null` (for testing teardown).
 */
export function resetAlertService(): void {
  alertServiceInstance = null;
}
