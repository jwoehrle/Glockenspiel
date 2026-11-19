/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";

declare const self: ServiceWorkerGlobalScope;

// Hashed build assets, injected by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Offline: every navigation inside the scope gets the app shell, except pull-request previews below the live
// site (/Glockenspiel/pr-preview/pr-<n>/). Those have their own worker; without the exception the live worker
// would answer a preview URL with the live app.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { denylist: [/\/pr-preview\//] }));

self.addEventListener("install", () => void self.skipWaiting());
clientsClaim();

// Remove caches of the hand-written worker used before the build step (glock-v1 … glock-vN).
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("glock-v")).map((k) => caches.delete(k)))),
  );
});
