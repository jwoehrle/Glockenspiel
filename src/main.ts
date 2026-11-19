import "./style.css";
import { registerSW } from "virtual:pwa-register";
import { init } from "./app";

init();

// Pull-request previews: a small label, so a preview is never mistaken for the live app.
if (import.meta.env.VITE_PREVIEW) {
  const label = document.getElementById("preview");
  if (label) {
    label.textContent = `Vorschau ${import.meta.env.VITE_PREVIEW}`;
    label.hidden = false;
  }
  document.title = `${document.title} (${import.meta.env.VITE_PREVIEW})`;
}

// Offline support. The new service worker activates immediately (see sw.ts), so a reload shows the update.
registerSW({ immediate: true });
