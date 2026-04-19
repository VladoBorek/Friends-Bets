import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setConfig as setApiClientConfig } from "@kubb/plugin-client/clients/fetch";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { AuthProvider } from "./lib/auth-provider";
import "./index.css";
import { Toaster } from "sonner";

setApiClientConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3000" : ""),
  headers: {
    "content-type": "application/json",
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="dark"
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
