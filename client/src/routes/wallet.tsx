import { createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "../pages/wallet-page";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});
