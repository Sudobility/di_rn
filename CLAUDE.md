# di_rn — AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave work in the working tree.
> Run `git commit` / `git push` / `gh pr create` **only when the user explicitly asks
> in that turn**. Finishing a task is not permission to commit it. Do not create
> feature branches; stay on the current branch.

## What it is

`@sudobility/di_rn` — React Native implementations of the DI service interfaces from
`@sudobility/di/interfaces`, for the Signa Email (0xmail) mobile apps. It is a
**library** (compiled ESM in `dist/`, `type: module`), not an app — there is nothing
to launch. Each service implements an interface and registers itself into the
`@sudobility/di` container so platform-agnostic code can call `getXxxService()`.

- **Package manager: Bun** (never npm for dev; the registry is GitHub Packages).
- **License**: BUSL-1.1.

## Commands

```bash
bun install            # required before anything (no node_modules is checked in)
bun run build          # bunx tsc, then scripts/fix-esm-imports.mjs (adds .js extensions)
bun run dev            # tsc --watch
bun run typecheck      # tsc --noEmit
bun run lint           # eslint src    (lint:fix to auto-fix)
bun run format         # prettier --write src
bun run test:unit      # vitest run  (there is NO "test" script — use test:unit)
bunx vitest run --coverage   # v8 coverage, 50% thresholds
```

CI/CD: reusable workflow `johnqh/workflows/.github/workflows/unified-cicd.yml@main`
on push/PR to `main`/`develop`; publishes on release.

## Source layout (`src/`)

Each domain has `<domain>.rn.ts`; several add a `-singleton.ts` or `index.ts` barrel.

- `index.ts` — single public barrel (all exports).
- `initialize/` — `initializeRNApp()` orchestrator (see below).
- `storage/` — `RNStorage`, `AdvancedRNStorage` (TTL), singletons (AsyncStorage).
- `network/` — `RNNetworkClient` (fetch + AbortController timeout), `RNNetworkService`
  (NetInfo online/offline), singletons. Note: separate singletons for client & service.
- `env/` — `RNEnvProvider` (`process.env`), `createRNAppConfig()`.
- `theme/` — `RNThemeService` (Appearance API, light/dark/system + font size).
- `notification/` — `RNNotificationService` (Notifee: local notifications, badges,
  permissions). `requestPermission()` returns a result object, not a boolean.
- `logging/` — `RNLogger` (prefixed console, child loggers), `RNLoggerProvider`.
- `navigation/` — `RNNavigationService` (React Navigation imperative API). `navigate`
  takes `(path, { state: {...} })` — params go under `state`, not as the 2nd arg directly.
- `info/` — `RNInfoService` (observable banner state, auto-dismiss) + `InfoBanner`
  component / `useInfoBanner` hook. **Renders via `Banner` from
  `@sudobility/components-rn`** (NOT react-native-toast-message). `InfoBanner` takes
  no props.
- `alert/` — `RNAlertService` (native dialog). `platformAlert.ts` + a
  `platformAlert.windows.ts` variant picked by the bundler (extensionless import).
- `diagnostics.ts` — `checkNativeModules()` reports which native modules are linked.

Tests: `tests/*.test.ts` + `src/**/__tests__/*.test.ts`; global native mocks in
`tests/setup.ts`. `vitest.config.ts` runs them.

## Conventions & patterns

- **Singleton trio** per service: `initializeXxx(instance?)`, `getXxx()`,
  `resetXxx()`. Storage/Notification/Navigation/Logger `get*()` auto-create if null;
  Info/Alert `get*()` **throw** if not initialized. Theme/Network `reset*()` call
  `dispose()` to tear down native listeners. Each module also exports a
  pre-instantiated instance (`rnStorage`, `rnNetworkClient`, `rnThemeService`, …).
- **DI bridge**: `initializeInfoService()` / `initializeAlertService()` register with
  the local singleton **and** `@sudobility/di`, so `getInfoService()` /
  `getAlertService()` work from either package.
- **Lazy native-module loading**: native modules are loaded on demand via
  `require()` inside try/catch, so a missing/unlinked module warns instead of crashing
  at import. (ESLint `no-require-imports` is off for this reason.) Setter hooks like
  `setNetInfoModule` / `setNotifeeModule` / `setAppearanceModule` /
  `setAsyncStorageModule` allow DI-based mocking in tests.
- **Deferred init**: services with native listeners (`RNNetworkService`,
  `RNThemeService`) defer `initialize...()` until first use via `ensureInitialized()`.
- **Observable**: `Set<Listener>`; `watch*/subscribe` returns an unsubscribe fn. Used
  by Network, Theme, Info, Navigation. `useInfoBanner` bridges it to React state.

### `initializeRNApp(options)` order (initialize/initialize.ts)

1. Storage → 2. Firebase DI service → 3. Firebase Analytics → 4. Network → 5. Info →
6. optional `initializeI18n()` callback. Returns the `FirebaseAnalyticsService`.

**Firebase Auth and RevenueCat are intentionally NOT initialized here** — apps wire
those up separately via `@sudobility/auth_lib` and `@sudobility/subscription_lib`.
(These are optional peers loaded dynamically elsewhere, not inside `initializeRNApp`.)

## Dependencies

- **Required peers**: `@sudobility/di` (interfaces implemented here),
  `@sudobility/types` (`Optional`, `InfoType`, `NetworkClient`),
  `@sudobility/components-rn` (`Banner` for InfoBanner), `react`, `react-native`.
- **Optional peers**: `@sudobility/auth_lib`, `@sudobility/subscription_lib`.
- **Native deps** (installed by the consuming app, lazy-required here):
  `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`,
  `@notifee/react-native`, `@react-navigation/native`,
  `@react-native-firebase/analytics`. These five are what `checkNativeModules()`
  checks.
- **Re-exports** from `@sudobility/di/rn`: `RNFirebaseService`,
  `RNFirebaseAnalyticsService`, `RNAnalyticsClient`,
  `MeasurementProtocolAnalyticsService`, and their singleton helpers.

## Build / TS config gotchas

- Imports in source use **explicit `.js` extensions** (ESM). `bun run build` runs
  `scripts/fix-esm-imports.mjs` after `tsc` to normalize emitted import extensions —
  don't hand-edit `dist/`.
- `tsconfig`: target ES2020, module ESNext, `moduleResolution: bundler`,
  `customConditions: ["react-native"]`, `jsx: react-jsx`. Full strict set including
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals/Parameters`. Test files are excluded from the build.
- Prettier: semi, singleQuote, `trailingComma: es5`, printWidth 80.
- `src/_node_globals.d.ts` declares RN/Node globals (`__DEV__`, `require`, etc.).

## Environment variables

Read by `RNEnvProvider` via `process.env` (injected by Metro/Expo at build time).
`VITE_` prefix matches the web app. Keys: `VITE_INDEXER_URL`, `VITE_WILDDUCK_URL`,
`VITE_WALLETCONNECT_PROJECT_ID`, `VITE_PRIVY_APP_ID`, `VITE_REVENUECAT_API_KEY`,
`VITE_FIREBASE_*`, `VITE_MOCK_DATA`. App defaults point at `*.0xmail.box`.

## Adding a service

1. `src/<domain>/<domain>.rn.ts` implementing the interface from
   `@sudobility/di/interfaces`; lazy-`require()` any native module.
2. Add the singleton trio; export a pre-created instance.
3. Export from `src/index.ts`. If needed at startup, add to `initializeRNApp()` in order.
4. Test under `tests/` or `src/**/__tests__/`; add native mocks to `tests/setup.ts`.
