'use client';

import { useEffect, useState } from 'react';
import { isIosDevice } from './install';

// Shared "Download app" (installable web app) state for the footer button and the floating button.
// Chrome, Edge and Android fire beforeinstallprompt (a native install dialog); iPhone/iPad Safari have
// none, so we show Add to Home Screen steps. Once installed (appinstalled event, a saved flag, or
// getInstalledRelatedApps) the buttons stay hidden for good, and never show inside the app itself.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'mago_app_installed';
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readFlag(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markInstalled() {
  installed = true;
  deferred = null;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Storage unavailable (private mode): the in-memory flag still hides the buttons for this visit.
  }
  emit();
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function start() {
  if (started) return;
  started = true;
  installed = isStandalone() || readFlag();
  navigator.serviceWorker?.register('/sw.js').catch(() => undefined);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', markInstalled);
  const related = (navigator as { getInstalledRelatedApps?: () => Promise<unknown[]> }).getInstalledRelatedApps;
  related
    ?.call(navigator)
    .then((apps) => {
      if (apps.length) markInstalled();
    })
    .catch(() => undefined);
}

export function useInstallState() {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    start();
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    // Render the buttons only after the browser has been asked (server and first render agree).
    queueMicrotask(() => setReady(true));
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return {
    ready,
    installed: ready && installed,
    canPrompt: ready && deferred !== null,
    ios: ready && isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints),
    /** Shows the native dialog; false when the browser has none (show the instructions instead). */
    async install(): Promise<boolean> {
      if (!deferred) return false;
      const event = deferred;
      await event.prompt();
      const { outcome } = await event.userChoice;
      deferred = null;
      if (outcome === 'accepted') markInstalled();
      else emit();
      return true;
    },
  };
}
