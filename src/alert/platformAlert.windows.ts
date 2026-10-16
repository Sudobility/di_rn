/**
 * Windows native alert dialog.
 *
 * React Native's own `Alert` relies on a native module (RCTAlertManager /
 * NativeDialogManagerAndroid) that is not wired through react-native-windows'
 * default export, so `Alert.alert` imported from `react-native` is a silent
 * no-op on Windows. react-native-windows ships its own `Alert` that drives the
 * native XAML `ContentDialog` through the core `Alert` turbo module
 * (`NativeDialogManagerWindows`), so use that directly.
 *
 * Resolved from the host app's `react-native-windows` at bundle time (this file
 * is only bundled for the Windows platform).
 */
// @ts-expect-error - react-native-windows is provided by the host app on Windows
import Alert from 'react-native-windows/Libraries/Alert/Alert.windows';

export const nativeAlert = Alert;
