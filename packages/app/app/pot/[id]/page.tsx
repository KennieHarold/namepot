"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useEnsAddress,
  useWriteContract,
  useConnection,
  useWaitForTransactionReceipt,
} from "wagmi";
import { usePotDetails } from "@/hooks/usePotDetails";
import { usePotMembers } from "@/hooks/usePotMembers";
import { useAllowance } from "@/hooks/useAllowance";
import { Address, erc20Abi, formatUnits, isAddress, parseUnits } from "viem";
import { enqueueSnackbar } from "notistack";
import { POT } from "@/lib/abis";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CancelIcon from "@mui/icons-material/Cancel";
import BoltIcon from "@mui/icons-material/Bolt";
import CallMadeIcon from "@mui/icons-material/CallMade";
import { formatCountdown, truncateAddress } from "@/lib/utils";

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
  const rootDomain = String(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
  const ensName = id?.endsWith(rootDomain) ? id : `${id}.${rootDomain}`;
  const { data: potAddress, isLoading: isPotAddressLoading } = useEnsAddress({
    name: ensName,
    chainId: parseInt(String(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)),
  });

  const {
    goal,
    deadline,
    quorum,
    approvals,
    totalDeposit,
    memberCount,
    recipient,
    managerAddress,
    isManager,
    isLoading: isDetailsLoading,
  } = usePotDetails(ensName);
  const { allowance, refetchAllowance } = useAllowance(potAddress ?? undefined);
  const { data: members = [], isLoading: isMembersLoading } = usePotMembers(
    ensName,
    memberCount,
  );

  const { address } = useConnection();
  const isMember = members.some(
    (member) => member.address.toLowerCase() === address?.toLowerCase(),
  );
  const { mutateAsync, isPending: isAddingMember } = useWriteContract();
  const {
    mutateAsync: approveAsync,
    isPending: isApproving,
    data: approvalHash,
  } = useWriteContract();
  const { mutateAsync: depositAsync, isPending: isDepositing } =
    useWriteContract();
  const { mutateAsync: approvePotAsync, isPending: isApprovingPot } =
    useWriteContract();

  const { isSuccess: isApprovalSuccess, isPending: isWaitingApproval } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
      query: { enabled: !!approvalHash },
    });

  const handleAddMember = async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!potAddress) {
        throw new Error("Pot address not found");
      }
      if (!isAddress(newMemberAddress)) {
        enqueueSnackbar({
          message: "Invalid Ethereum address",
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "right" },
        });
        return;
      }

      await mutateAsync({
        address: potAddress as Address,
        abi: POT,
        functionName: "addMember",
        args: [newMemberAddress as Address],
      });

      setNewMemberAddress("");
      enqueueSnackbar({
        message: "Member added successfully!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error adding member: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  const tokenAddress = process.env.NEXT_PUBLIC_CURRENCY_TOKEN as Address;

  const handleApprove = async () => {
    try {
      if (!address) throw new Error("Wallet not connected");
      if (!potAddress) throw new Error("Pot address not found");

      const amount = parseUnits(depositAmount, 18);
      await approveAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [potAddress as Address, amount],
      });

      await refetchAllowance();
      enqueueSnackbar({
        message: "Token approval successful!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error approving tokens: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  const handleApprovePot = async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!potAddress) {
        throw new Error("Pot address not found");
      }

      await approvePotAsync({
        address: potAddress as Address,
        abi: POT,
        functionName: "approve",
      });

      enqueueSnackbar({
        message: "Pot approval submitted!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error approving pot: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  const handleDeposit = async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (!potAddress) {
        throw new Error("Pot address not found");
      }

      const amount = parseUnits(depositAmount, 18);
      await depositAsync({
        address: potAddress as Address,
        abi: POT,
        functionName: "deposit",
        args: [amount],
      });

      setDepositAmount("");
      enqueueSnackbar({
        message: "Deposit successful!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error depositing: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  const [now, setNow] = useState(0);
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  if (isPotAddressLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!potAddress) {
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
        <Card>
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            <Typography variant="h5" gutterBottom>
              Pot Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The pot <strong>{ensName}</strong> could not be resolved to a
              contract address. It may not exist or hasn&apos;t been registered
              yet.
            </Typography>
            <Button component={Link} href="/" variant="contained">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const goalNum = Number(formatUnits(goal || BigInt(0), 18));
  const raisedNum = Number(formatUnits(totalDeposit || BigInt(0), 18));
  const timeLeft = (deadline ?? 0) - now;
  const isBeforeDeadline = timeLeft > 0;
  const progress = goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0;
  const quorumLabel = `${(quorum ?? 0) / 10}%`;
  const approvalsNeeded =
    memberCount && quorum ? Math.ceil((memberCount * quorum) / 1000) : 0;
  const approvalsProgress =
    approvalsNeeded > 0
      ? Math.min(((approvals ?? 0) / approvalsNeeded) * 100, 100)
      : 0;

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
        <Typography variant="h4">{ensName}</Typography>
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
        Contract Address: {potAddress}
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
                {raisedNum.toLocaleString()} / {goalNum.toLocaleString()} tokens
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
            <DetailItem label="Members" value={String(memberCount ?? 0)} />
            <DetailItem label="Approvals" value={String(approvals ?? 0)} />
            <DetailItem
              label="Recipient"
              value={truncateAddress(recipient || "")}
            />
            <DetailItem
              label="Token"
              value={truncateAddress(
                process.env.NEXT_PUBLIC_CURRENCY_TOKEN || "",
              )}
            />
            <DetailItem
              label="Manager"
              value={truncateAddress(managerAddress || "")}
            />
          </Box>
        </CardContent>
      </Card>

      {isManager && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Manage Members
            </Typography>

            <Stack spacing={2}>
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
                  onClick={handleAddMember}
                  disabled={isAddingMember || !newMemberAddress}
                  loading={isAddingMember}
                >
                  Invite
                </Button>
              </Box>

              <Divider />

              {isMembersLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : members.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Wallet ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((member, index) => (
                        <TableRow key={member.address}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {member?.ensName
                              ? member.ensName
                              : truncateAddress(member.address)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 1 }}
                >
                  No members yet
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {isMember && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Deposit / Withdraw
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ mb: 2 }}
            >
              {isBeforeDeadline && <Tab label="Deposit" />}
              <Tab label="Withdraw" />
            </Tabs>

            {/* Deposit Tab */}
            {isBeforeDeadline && activeTab === 0 && (
              <Stack spacing={2}>
                <TextField
                  size="small"
                  type="number"
                  placeholder="Amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  fullWidth
                />
                {depositAmount &&
                Number(depositAmount) > 0 &&
                allowance < parseUnits(depositAmount, 18) ? (
                  <Button
                    variant="contained"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={handleApprove}
                    disabled={
                      isApproving || (isWaitingApproval && !!approvalHash)
                    }
                    loading={
                      isApproving || (isWaitingApproval && !!approvalHash)
                    }
                    sx={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      },
                    }}
                  >
                    Approve Deposit
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={handleDeposit}
                    disabled={
                      !depositAmount ||
                      Number(depositAmount) <= 0 ||
                      isDepositing
                    }
                    loading={isDepositing}
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
              </Stack>
            )}

            {/* Withdraw Tab */}
            {((isBeforeDeadline && activeTab === 1) ||
              (!isBeforeDeadline && activeTab === 0)) && (
              <Stack spacing={2}>
                <TextField
                  size="small"
                  type="number"
                  placeholder="Amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<CallMadeIcon />}
                  onClick={() => console.log("Withdraw stub:", withdrawAmount)}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                >
                  Withdraw
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {!isBeforeDeadline && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Governance
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Approvals
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {approvals ?? 0} / {approvalsNeeded} members ({quorumLabel}{" "}
                  quorum)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={approvalsProgress}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: "grey.100",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 6,
                    background:
                      approvalsProgress >= 100
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {approvalsProgress.toFixed(1)}% of quorum reached
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              {isMember && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprovePot}
                  disabled={isApprovingPot}
                  loading={isApprovingPot}
                  fullWidth
                >
                  Approve
                </Button>
              )}

              <Button
                variant="contained"
                disabled={!isManager}
                startIcon={<BoltIcon />}
                onClick={() => console.log("Execute stub")}
                fullWidth
                sx={{
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Execute
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {isManager && (
        <Card sx={{ mb: 3, border: 1, borderColor: "error.light" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CancelIcon />}
              onClick={() => console.log("Close pot stub")}
              sx={{
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              Close Pot
            </Button>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          mt: 10,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Your role:
        </Typography>
        {isDetailsLoading ? (
          <CircularProgress size={16} />
        ) : (
          <>
            {isMember && !isManager && (
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
            {!isMember && !isManager && (
              <Typography variant="caption" color="text.secondary">
                Viewer (no role)
              </Typography>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
