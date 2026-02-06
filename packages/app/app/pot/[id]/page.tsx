"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BoltIcon from "@mui/icons-material/Bolt";
import CallMadeIcon from "@mui/icons-material/CallMade";
import { MOCK_POT, MOCK_STATE } from "@/lib/mock";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

export default function PotPage() {
  const { id } = useParams<{ id: string }>();

  const pot = MOCK_POT;
  const { isMember, isManager } = MOCK_STATE;

  const [now, setNow] = useState(0);
  const [newMemberAddress, setNewMemberAddress] = useState("");

  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const timeLeft = pot.deadline - now;
  const isBeforeDeadline = timeLeft > 0;
  const progress =
    pot.goal > 0 ? Math.min((pot.raised / pot.goal) * 100, 100) : 0;
  const quorumLabel = `${pot.quorum / 10}%`;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, color: "text.secondary" }}
      >
        Back
      </Button>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4">{pot.label}.namepot.eth</Typography>
        <Chip
          label={isBeforeDeadline ? "Active" : "Deadline Passed"}
          color={isBeforeDeadline ? "success" : "warning"}
          size="small"
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 3, display: "block" }}
      >
        Pot #{id}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Pot Details
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isBeforeDeadline ? "Time Remaining" : "Deadline"}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color={isBeforeDeadline ? "primary" : "warning.main"}
            >
              {formatCountdown(timeLeft)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {pot.raised.toLocaleString()} / {pot.goal.toLocaleString()}{" "}
                tokens
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: "grey.100",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 6,
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {progress.toFixed(1)}% of goal reached
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <DetailItem label="Quorum" value={quorumLabel} />
            <DetailItem label="Members" value={String(pot.members.length)} />
            <DetailItem label="Approvals" value={String(pot.numApprovals)} />
            <DetailItem
              label="Recipient"
              value={truncateAddress(pot.recipient)}
            />
            <DetailItem
              label="Token"
              value={truncateAddress(pot.tokenAddress)}
            />
            <DetailItem label="Manager" value={truncateAddress(pot.manager)} />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>

          <Stack spacing={2}>
            {isMember && isBeforeDeadline && (
              <Button
                variant="contained"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={() => console.log("Deposit stub")}
                sx={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  },
                }}
              >
                Deposit
              </Button>
            )}

            {isManager && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="0x... member address"
                  value={newMemberAddress}
                  onChange={(e) => setNewMemberAddress(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => {
                    console.log("Add member stub:", newMemberAddress);
                    setNewMemberAddress("");
                  }}
                >
                  Add Member
                </Button>
              </Box>
            )}

            {isMember && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CallMadeIcon />}
                onClick={() => console.log("Withdraw stub")}
              >
                Withdraw
              </Button>
            )}

            {isMember && !isBeforeDeadline && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => console.log("Approve stub")}
              >
                Approve
              </Button>
            )}

            {isManager && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => console.log("Close pot stub")}
              >
                Close Pot
              </Button>
            )}

            {!isBeforeDeadline && (
              <Button
                variant="contained"
                startIcon={<BoltIcon />}
                onClick={() => console.log("Execute stub")}
                sx={{
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Execute
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.secondary">
          Demo roles:
        </Typography>
        {isMember && (
          <Chip
            label="Member"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {isManager && (
          <Chip
            label="Manager"
            size="small"
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>
    </Container>
  );
}
