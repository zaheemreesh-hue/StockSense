import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { registerSW } from "virtual:pwa-register";

// PWA auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New version available. Reload to update?")) updateSW(true);
  },
  onOfflineReady() {
    console.log("StockSense is ready for offline use");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
