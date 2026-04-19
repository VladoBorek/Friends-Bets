import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { useAuth } from "./lib/auth-context";

export function AppRoot() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}
