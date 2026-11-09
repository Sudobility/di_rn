# @sudobility/di_rn

React Native implementations of the dependency-injection (DI) services defined in
[`@sudobility/di`](https://www.npmjs.com/package/@sudobility/di), used by the Signa
Email (0xmail) mobile apps.

This is a **library**, not an app. Each service class implements an interface from
`@sudobility/di/interfaces` and registers itself into the DI container, so
platform-agnostic code can call `getXxxService()` without knowing it is running on
React Native. It ships compiled ESM from `dist/` (type `module`); there is no app to
launch here.

Provided services: storage, networking, environment/config, theme, local
notifications, navigation, logging, info banner (toast), native alert dialog, plus a
native-module diagnostics helper and a centralized app-initialization orchestrator.
Firebase and analytics services are re-exported from `@sudobility/di/rn` for
convenience.

## Installation

This package is published to **GitHub Packages** under the `@sudobility` scope, not
the public npm registry. Add this to your project's `.npmrc`:

```
@sudobility:registry=https://npm.pkg.github.com
```

(with a GitHub token that has `read:packages`), then install:

```bash
bun add @sudobility/di_rn          # or: npm install @sudobility/di_rn
```

### Peer dependencies

Install these in your app (they are `peerDependencies`):

```bash
bun add @sudobility/di @sudobility/types @sudobility/components-rn react react-native
```

`@sudobility/auth_lib` and `@sudobility/subscription_lib` are optional and loaded
dynamically if present.

### Native dependencies

Services lazy-load the native modules below via `require()` in a try/catch, so a
missing module degrades gracefully instead of crashing at import. Install and link
(autolinking) the ones you use in the consuming app:

```bash
bun add @react-native-async-storage/async-storage   # storage
bun add @react-native-community/netinfo              # network status
bun add @notifee/react-native                        # notifications
bun add @react-navigation/native                     # navigation
bun add @react-native-firebase/analytics             # analytics (via @sudobility/di/rn)
```

Call `checkNativeModules()` at runtime to see which are actually linked.

## Usage

### Centralized initialization

```typescript
import { initializeRNApp } from '@sudobility/di_rn';

// Sets up, in order: Storage -> Firebase -> Firebase Analytics -> Network -> Info,
// then runs an optional i18n callback. Returns the analytics service.
const analytics = await initializeRNApp({
  firebaseOptions: { enableAnalytics: true, enableMessaging: true },
  initializeI18n: async () => {
    /* app-specific */
  },
});
```

Firebase Auth and RevenueCat are intentionally **not** initialized here — apps wire
those up separately (`@sudobility/auth_lib`, `@sudobility/subscription_lib`).

### Storage

```typescript
import { rnStorage, advancedRNStorage, getStorageService } from '@sudobility/di_rn';

await rnStorage.setItem('key', 'value');
const value = await rnStorage.getItem('key');

// Advanced storage with TTL
await advancedRNStorage.setItem('key', 'value', 60000); // 60s TTL
const v = await advancedRNStorage.getItem('key'); // null if expired

const storageService = getStorageService(); // DI singleton
```

### Network

```typescript
import { rnNetworkClient, rnNetworkService } from '@sudobility/di_rn';

const response = await rnNetworkClient.get<User>('/api/user');
const isOnline = rnNetworkService.isOnline();
const unsubscribe = rnNetworkService.watchNetworkStatus((online) => {
  console.log('online:', online);
});
```

### Environment & config

```typescript
import { rnEnvProvider, rnAppConfig } from '@sudobility/di_rn';

const apiUrl = rnEnvProvider.get('VITE_INDEXER_URL');
const { indexerBackendUrl, walletConnectProjectId } = rnAppConfig;
```

### Theme

```typescript
import { rnThemeService } from '@sudobility/di_rn';

rnThemeService.applyTheme('dark'); // 'light' | 'dark' | 'system'
const theme = rnThemeService.getResolvedTheme(); // 'light' | 'dark'
const unsubscribe = rnThemeService.watchSystemTheme((t) => console.log(t));
```

### Navigation

```typescript
import { rnNavigationService } from '@sudobility/di_rn';

// In your NavigationContainer:
//   onReady={() => rnNavigationService.setNavigationRef(navigationRef)}
//   onStateChange={(state) => rnNavigationService.onStateChange(state)}

rnNavigationService.navigate('EmailDetail', { state: { emailId: '123' } });
rnNavigationService.goBack('Inbox'); // go back, or navigate to 'Inbox' at root
```

### Info banner (toast)

Renders via the `Banner` component from `@sudobility/components-rn`.

```tsx
import { InfoBanner, initializeInfoService, getInfoService } from '@sudobility/di_rn';
import { InfoType } from '@sudobility/types';

initializeInfoService(); // once at startup

function App() {
  return (
    <>
      <AppContent />
      <InfoBanner />
    </>
  );
}

// Anywhere:
getInfoService().show('Done', 'Saved', InfoType.SUCCESS);
```

### Native alert dialog

```typescript
import { initializeAlertService, getAlertService } from '@sudobility/di_rn';

initializeAlertService(); // once at startup
getAlertService().alert('Title', 'Message', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', onPress: () => doThing() },
]);
```

### Notifications

```typescript
import { rnNotificationService } from '@sudobility/di_rn';

const { granted } = await rnNotificationService.requestPermission();
await rnNotificationService.showNotification('New Email', {
  body: 'You have a new message',
  data: { emailId: '123' },
});
```

### Logging

```typescript
import { rnLogger } from '@sudobility/di_rn';

rnLogger.info('App started');
const authLogger = rnLogger.child('Auth');
authLogger.info('User logged in');
```

### Analytics

Analytics (`rnAnalyticsClient`, `FirebaseAnalyticsService`,
`MeasurementProtocolAnalyticsService`, and their singleton helpers) are re-exported
from `@sudobility/di/rn` — see that package for the API. `initializeRNApp()` wires up
Firebase Analytics for you.

### Diagnostics

```typescript
import { checkNativeModules } from '@sudobility/di_rn';

const { summary, modules } = checkNativeModules();
console.log(summary); // "Native modules: 5/5 available. All modules linked."
```

## Configuration

`RNEnvProvider` reads from `process.env` (injected by the Metro/Expo bundler at build
time). The `VITE_` prefix matches the web counterpart of the app. Common keys:

```env
VITE_INDEXER_URL=https://indexer.0xmail.box
VITE_WILDDUCK_URL=https://wildduck.0xmail.box
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
VITE_PRIVY_APP_ID=your-app-id
VITE_REVENUECAT_API_KEY=your-api-key
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_MOCK_DATA=true   # optional: enable mock-data fallback
```

## Development

The package manager is **Bun**. Run `bun install` first.

```bash
bun run build       # Compile TypeScript -> dist/ (tsc, then fix ESM import extensions)
bun run dev         # tsc --watch
bun run clean       # rm -rf dist
bun run typecheck   # tsc --noEmit
bun run lint        # ESLint on src/
bun run lint:fix    # ESLint --fix
bun run format      # Prettier on src/
bun run test:unit   # Run Vitest once (same as: bunx vitest run)
```

Tests live in `tests/*.test.ts` and `src/**/__tests__/*.test.ts`, with global native
mocks in `tests/setup.ts`. CI/CD runs via the reusable workflow
`johnqh/workflows/.github/workflows/unified-cicd.yml@main` on push/PR to `main` and
`develop`, publishing on release.

## License

BUSL-1.1
