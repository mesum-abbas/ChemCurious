"use client";

import { useEffect } from "react";

/** How often an open tab asks the browser to check for a new service worker. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // In development a service worker fights hot reload and serves stale bundles,
    // so remove any worker left over from an earlier production test on localhost.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    let interval: number | undefined;

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };

    const register = () => {
      navigator.serviceWorker
        // updateViaCache "none": the browser always re-downloads sw.js itself to look for changes,
        // never trusting an HTTP-cached copy, so a new deploy's worker is picked up promptly.
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          registration = reg;
          interval = window.setInterval(checkForUpdate, UPDATE_CHECK_MS);
          document.addEventListener("visibilitychange", checkForUpdate);
        })
        .catch((error) => {
          console.error("[ChemCurious PWA] Service Worker registration failed:", error);
        });
    };

    // This effect often runs after the window "load" event has already fired (it did before,
    // so registration silently never happened on those visits). Register right away if so.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", checkForUpdate);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return null;
}
