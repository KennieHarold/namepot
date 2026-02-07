"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  useWriteContract,
  useConnection,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, Hex, formatUnits } from "viem";
import { enqueueSnackbar } from "notistack";
import { POT } from "@/lib/abis";
import { truncateAddress } from "@/lib/utils";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const { signature } = useParams<{ signature: string }>();
  const searchParams = useSearchParams();
  const potAddress = searchParams.get("pot") as Address | null;
  const amount = searchParams.get("amount");
  const { address, isConnected } = useConnection();

  const {
    mutateAsync: claimAsync,
    isPending: isClaiming,
    data: claimHash,
  } = useWriteContract();

  const { isSuccess: isClaimSuccess, isPending: isWaitingClaim } =
    useWaitForTransactionReceipt({
      hash: claimHash,
      query: { enabled: !!claimHash },
    });

  const [hasClaimed, setHasClaimed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleClaim = async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!potAddress) {
        throw new Error("Pot address not found");
      }
      if (!signature) {
        throw new Error("Signature not found");
      }

      await claimAsync({
        address: potAddress,
        abi: POT,
        functionName: "claimPayment",
        args: [signature as Hex],
      });

      setHasClaimed(true);
      enqueueSnackbar({
        message: "Payment claimed successfully!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error claiming payment: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  if (!potAddress || !signature) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Back
        </Button>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>
              Invalid Payment Link
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This payment link is missing required information.
            </Typography>
            <Button component={Link} href="/" variant="contained">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const isProcessing = isClaiming || (isWaitingClaim && !!claimHash);
  const isComplete = isClaimSuccess || hasClaimed;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, color: "text.secondary" }}
      >
        Back
      </Button>

      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" gutterBottom>
            Claim Payment
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Pot Contract
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {truncateAddress(potAddress)}
              </Typography>
            </Box>
            {amount && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {Number(formatUnits(BigInt(amount), 18)).toLocaleString()} tokens
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Signature
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ wordBreak: "break-all" }}
              >
                {truncateAddress(signature)}
              </Typography>
            </Box>
            {mounted && address && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Your Wallet
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {truncateAddress(address)}
                </Typography>
              </Box>
            )}
          </Box>

          {isComplete ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" color="success.main">
                Payment Claimed
              </Typography>
              {claimHash && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ wordBreak: "break-all", mt: 1, display: "block" }}
                >
                  Tx: {claimHash}
                </Typography>
              )}
            </Box>
          ) : mounted && !isConnected ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Chip label="Wallet not connected" color="warning" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Connect your wallet to claim this payment.
              </Typography>
            </Box>
          ) : (
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={
                isProcessing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AccountBalanceWalletIcon />
                )
              }
              onClick={handleClaim}
              disabled={isProcessing}
              sx={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                },
              }}
            >
              {isProcessing ? "Claiming..." : "Claim Payment"}
            </Button>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
