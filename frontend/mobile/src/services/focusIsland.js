import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Xiaomi HyperOS "Super Island": the system's own island. It only draws notifications from
// apps Xiaomi has authorised, so everything here answers "not handled" (false) on other
// phones and on Xiaomi phones where this app is not authorised; the caller then uses the
// app's own island (see components/Toast.js).
const native = Platform.OS === 'android' ? NativeModules.FocusIsland : null;

let supportedPromise = null;
export function focusIslandSupported() {
  if (!native) return Promise.resolve(false);
  if (!supportedPromise) supportedPromise = native.isSupported().catch(() => false);
  return supportedPromise;
}

let permissionPromise = null;
async function notificationsAllowed() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true; // runtime permission exists from Android 13
  if (!permissionPromise) {
    permissionPromise = PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS').then(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED,
      () => false,
    );
  }
  return permissionPromise;
}

// Resolves true when the system island took the message.
export async function showFocusIsland(title, text) {
  if (!(await focusIslandSupported())) return false;
  if (!(await notificationsAllowed())) return false;
  return native.show(title, text).catch(() => false);
}
