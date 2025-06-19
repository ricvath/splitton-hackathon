import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Buffer } from 'buffer';
import App from "./App.tsx";
import "./index.css";

// Polyfill Buffer for TON libraries
window.Buffer = Buffer;

// Suppress browser extension errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('Could not establish connection. Receiving end does not exist.')) {
    event.preventDefault();
    return false;
  }
});

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Could not establish connection. Receiving end does not exist.')) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
