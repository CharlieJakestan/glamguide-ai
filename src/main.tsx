import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find the root element");
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h1>Application Error</h1>
        <p>Failed to find the root element. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
  throw new Error("Failed to find the root element");
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}