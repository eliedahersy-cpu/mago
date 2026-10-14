/** "Download app": when the floating install button shows (pure, so it can be tested). */

export type FabView = 'hidden' | 'prompt' | 'ios';

/** Pages with their own bar at the bottom, or mid-purchase, where a floating button would get in the way. */
const QUIET_PATHS = ['/subscribe/build', '/mix-box', '/cart', '/checkout', '/order'];

export function fabView(s: { ready: boolean; installed: boolean; canPrompt: boolean; ios: boolean; dismissed: boolean; pathname: string }): FabView {
  if (!s.ready || s.installed || s.dismissed) return 'hidden';
  if (QUIET_PATHS.some((p) => s.pathname === p || s.pathname.startsWith(`${p}/`))) return 'hidden';
  if (s.canPrompt) return 'prompt';
  return s.ios ? 'ios' : 'hidden';
}

/** iPhone/iPad Safari have no install prompt (iPadOS reports a Mac with touch). */
export function isIosDevice(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export const INSTALL_HELP_IOS = 'Tap the Share button in Safari, then “Add to Home Screen”.';
export const INSTALL_HELP_OTHER = 'Open your browser menu and choose “Install app” or “Add to Home screen”.';
