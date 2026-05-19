import { createFileRoute } from "@tanstack/react-router";
import { walletSearchSchema } from "../../features/wallet/utils/wallet-search";
import { WalletPage } from "../../pages/wallet/wallet-page";

export const Route = createFileRoute("/wallet/")({
  validateSearch: walletSearchSchema,
  component: WalletPage,
});
