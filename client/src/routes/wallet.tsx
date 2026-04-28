import { createFileRoute } from "@tanstack/react-router";
import { walletSearchSchema } from "../features/wallet/wallet-search";
import { WalletPage } from "../pages/wallet-page";

export const Route = createFileRoute("/wallet")({
  validateSearch: walletSearchSchema,
  component: WalletPage,
});
