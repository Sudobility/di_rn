/**
 * @fileoverview Centralized React Native app initialization
 * @description Provides a single initialization function for RN apps
 * that sets up all DI services in the correct order.
 */

import {
  initializeNetworkService as initializeDiNetworkService,
  initializeFirebaseService,
  FirebaseAnalyticsService,
  initializeFirebaseAnalytics,
  getAnalyticsService,
  resetAnalyticsService,
  type AnalyticsEventParams,
  type FirebaseInitOptions,
} from '@sudobility/di/rn';
import { initializeStorageService } from '../index.js';
import { initializeInfoService } from '../info/index.js';

// Re-export analytics types and functions from di for convenience
export {
  FirebaseAnalyticsService,
  initializeFirebaseAnalytics,
  getAnalyticsService,
  resetAnalyticsService,
  type AnalyticsEventParams,
};

// ============================================================================
// RN App Initialization
// ============================================================================

/**
 * Firebase options for RN
 */
export interface RNFirebaseOptions {
  /** Enable Firebase Analytics (default: true) */
  enableAnalytics?: boolean;
  /** Enable Firebase Messaging (default: true) */
  enableMessaging?: boolean;
  /** Enable development mode (default: false) */
  enableDevelopmentMode?: boolean;
}

/**
 * Configuration options for RN app initialization
 */
export interface RNAppInitOptions {
  /** Optional: Initialize i18n (app-specific, pass your initializeI18n function) */
  initializeI18n?: () => void | Promise<void>;

  /** Firebase options */
  firebaseOptions?: RNFirebaseOptions;
}

/**
 * Initialize a React Native application with all required DI services.
 *
 * This function sets up services in the correct order:
 * 1. Storage service
 * 2. Firebase DI service (analytics, messaging, etc.)
 * 3. Firebase Analytics singleton
 * 4. Network service
 * 5. Info service
 * 6. i18n (if provided)
 *
 * Note: Firebase Auth is NOT initialized here. Apps using Firebase Auth should
 * call initializeFirebaseAuth() from @sudobility/auth_lib separately.
 *
 * Subscriptions/RevenueCat are intentionally NOT initialized here. RevenueCat is
 * optional and platform-specific; each app initializes it at startup via
 * `initializeSubscription` from @sudobility/subscription_lib with the adapter
 * from @sudobility/subscription_pages_rn (React Native).
 *
 * @param options - Configuration options
 * @returns The initialized analytics service
 */
export async function initializeRNApp(
  options: RNAppInitOptions = {}
): Promise<FirebaseAnalyticsService> {
  const { initializeI18n, firebaseOptions } = options;

  // 1. Initialize storage service
  initializeStorageService();

  // 2. Initialize Firebase DI service (configured via native files, options just enable/disable features)
  initializeFirebaseService(firebaseOptions as FirebaseInitOptions);

  // 3. Initialize Firebase Analytics singleton (higher-level wrapper)
  const analytics = initializeFirebaseAnalytics();

  // 4. Initialize network service (for online/offline status detection)
  // Note: For authenticated API calls, apps should use FirebaseAuthNetworkService directly
  // from @sudobility/auth_lib, which provides automatic token refresh on 401 responses.
  initializeDiNetworkService();

  // 5. Initialize info service
  initializeInfoService();

  // 6. Initialize i18n (app-specific)
  if (initializeI18n) {
    await initializeI18n();
  }

  return analytics;
}
