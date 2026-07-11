// src/main.tsx
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element in index.html. Bootstrap terminated.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
