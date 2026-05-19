import { RouterProvider } from "@tanstack/react-router";
import { useWalletOverviewRealtimeSync } from "./api/wallet/wallet-query-options";
import { useAuth } from "./lib/auth-context";
import { router } from "./router";

export function App() {
  const auth = useAuth();
  useWalletOverviewRealtimeSync(auth.user?.id);
  return <RouterProvider router={router} context={{ auth }} />;
}
