import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { BranchProvider } from "./context/BranchContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <BranchProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: {
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "0.875rem",
                },
              }}
            />
          </BranchProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
