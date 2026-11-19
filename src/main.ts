import "./style.css";
import { registerSW } from "virtual:pwa-register";
import { init } from "./app";

init();

// Offline support. The new service worker activates immediately (see sw.ts), so a reload shows the update.
registerSW({ immediate: true });
