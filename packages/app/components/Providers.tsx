"use client";

import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { WagmiProvider, http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";

import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import theme from "@/lib/theme";

export const DEFAULT_CHAIN_ID = 11155111;

const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [DEFAULT_CHAIN_ID]: http(),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
