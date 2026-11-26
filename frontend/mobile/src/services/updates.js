import { version as APP_VERSION } from '../../package.json';

// New versions ship as a GitHub Release with the signed APK attached (see .github/workflows/android-release.yml).
// The app asks GitHub for the latest release and, when it is newer, offers the APK. Android installs it over the
// current app because both are signed with the same release key.
// ponytail: the user taps "Baixar" and confirms the install; a silent in-app installer needs a native module.
export const RELEASES_API = 'https://api.github.com/repos/aluiz0953/App-de-Estoque/releases/latest';
export const RELEASES_PAGE = 'https://aluiz0953.github.io/App-de-Estoque/';

export { APP_VERSION };

const parts = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

// 1 when a > b, -1 when a < b, 0 when equal (major.minor.patch).
export function compareVersions(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1;
  }
  return 0;
}

// { version, url, notes } of a newer release, or null (same version, no APK, offline, rate-limited).
export async function checkForUpdate() {
  try {
    const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const release = await res.json();
    const apk = (release.assets || []).find((a) => a.name.endsWith('.apk'));
    if (!apk || compareVersions(release.tag_name, APP_VERSION) <= 0) return null;
    return { version: release.tag_name.replace(/^v/, ''), url: apk.browser_download_url, notes: release.body || '' };
  } catch {
    return null;
  }
}
