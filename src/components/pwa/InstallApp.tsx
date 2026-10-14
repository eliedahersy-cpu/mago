'use client';

import { Download, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fabView, INSTALL_HELP_IOS, INSTALL_HELP_OTHER } from '@/lib/pwa/install';
import { useInstallState } from '@/lib/pwa/install-state';

const DISMISS_KEY = 'mago_app_fab_dismissed';

/** Small "Download app" button in the footer. Hidden once the app is installed, and inside the app. */
export function InstallAppButton() {
  const state = useInstallState();
  const [help, setHelp] = useState<string | null>(null);
  if (!state.ready || state.installed) return null;

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={async () => {
          if (!(await state.install())) setHelp(state.ios ? INSTALL_HELP_IOS : INSTALL_HELP_OTHER);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-sun/70 px-4 py-2 font-display text-xs font-semibold tracking-wide text-sun uppercase transition-colors hover:bg-sun hover:text-forest focus-visible:bg-sun focus-visible:text-forest"
      >
        <Download size={15} aria-hidden /> Download app
      </button>
      {help ? (
        <p role="status" className="mt-2 max-w-xs text-xs leading-relaxed text-cream-light/85">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Floating "Download app" button: only where the store can really be installed (Chrome/Edge/Android
 * with an install prompt, or iPhone/iPad Safari), never in the installed app, never over checkout or
 * a page's own bottom bar, and gone for good once installed. "×" hides it for the rest of the visit.
 */
export function InstallAppFab() {
  const state = useInstallState();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    let hidden = false;
    try {
      hidden = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      // Storage blocked: show it, and "×" still hides it until the page reloads.
    }
    queueMicrotask(() => setDismissed(hidden));
  }, []);

  const view = fabView({ ...state, dismissed, pathname: pathname ?? '/' });
  if (view === 'hidden') return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="complementary"
      aria-label="Download the MAGO app"
      className="fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 motion-safe:animate-[mago-fab-in_.35s_ease_both]"
    >
      {help ? (
        <p role="status" className="max-w-72 rounded-2xl bg-cream-light px-3.5 py-2.5 text-sm text-ink shadow-lg ring-1 ring-forest/10">
          {INSTALL_HELP_IOS}
        </p>
      ) : null}
      <div className="flex items-center rounded-full bg-forest text-cream-light shadow-[0_10px_30px_rgba(2,48,37,0.3)]">
        <button
          type="button"
          onClick={async () => {
            if (!(await state.install())) setHelp(true);
          }}
          className="inline-flex items-center gap-2.5 rounded-l-full py-1.5 pr-3 pl-1.5 font-display text-sm font-semibold"
        >
          <Image src="/app-icons/icon-192.png" alt="" width={30} height={30} className="rounded-full" />
          Download app
          <Download size={16} aria-hidden />
        </button>
        <button type="button" onClick={dismiss} aria-label="Hide" className="grid h-full place-items-center rounded-r-full border-l border-cream-light/25 py-2.5 pr-3.5 pl-3 opacity-85 hover:opacity-100">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
