"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  Address,
  encodePacked,
  keccak256,
  parseUnits,
  zeroAddress,
} from "viem";
import { enqueueSnackbar } from "notistack";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { createPotSchema } from "@/lib/schemas";
import { POT_FACTORY } from "@/lib/abis";
import { CreatePotFormData } from "@/lib/types";

const QUORUM_OPTIONS = [
  { value: 500, label: "50%" },
  { value: 750, label: "75%" },
  { value: 1000, label: "100%" },
] as const;

export default function CreatePotPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(createPotSchema),
    defaultValues: {
      label: "",
      quorum: 750,
      deadline: "",
      recipient: "",
      goal: "",
      tokenAddress: process.env.NEXT_PUBLIC_CURRENCY_TOKEN,
    },
    mode: "onTouched",
  });

  const router = useRouter();
  const { address } = useConnection();
  const { mutateAsync, isPending, data } = useWriteContract();
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash: data });

  const [redirectDomain, setRedirectDomain] = useState("");

  const onSubmit = async (data: CreatePotFormData) => {
    try {
      if (!address) {
        throw new Error("Address is undefined");
      }
      if (!process.env.NEXT_PUBLIC_POT_FACTORY_ADDRESS) {
        throw new Error("Factory is undefined");
      }

      const { label, goal, deadline, quorum, recipient } = data;
      const hash = keccak256(encodePacked(["string"], [label]));
      const deadlineUnix = BigInt(
        Math.floor(new Date(deadline).getTime() / 1000),
      );

      setRedirectDomain(label);

      await mutateAsync({
        address: process.env.NEXT_PUBLIC_POT_FACTORY_ADDRESS as Address,
        abi: POT_FACTORY,
        functionName: "createPot",
        args: [
          hash,
          label,
          parseUnits(goal, 18),
          deadlineUnix,
          quorum,
          address as Address,
          (recipient || zeroAddress) as Address,
        ],
      });
    } catch (error: unknown) {
      enqueueSnackbar({
        message: `Error creating pot: ${error}`,
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      enqueueSnackbar({
        message: "Successfully created pot!",
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" },
      });
      router.push(`/pot/${redirectDomain}`);
    }
  }, [isSuccess, router, redirectDomain]);

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

      <Typography variant="h4" gutterBottom>
        Create a Pot
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Set up a new collaborative savings pot with ENS integration.
      </Typography>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <div>
                <FormLabel required>Pot Name</FormLabel>
                <TextField
                  fullWidth
                  placeholder="e.g., sports-car"
                  {...register("label")}
                  error={!!errors.label}
                  helperText={errors.label?.message}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </div>

              <div>
                <FormLabel required>Quorum</FormLabel>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Percentage of members needed to approve execution
                </Typography>
                <Controller
                  name="quorum"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={field.value}
                      onChange={(_, val: number | null) => {
                        if (val !== null) field.onChange(val);
                      }}
                      size="small"
                    >
                      {QUORUM_OPTIONS.map((opt) => (
                        <ToggleButton key={opt.value} value={opt.value}>
                          {opt.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  )}
                />
                {errors.quorum && (
                  <FormHelperText error>{errors.quorum.message}</FormHelperText>
                )}
              </div>

              <div>
                <FormLabel required>Deadline</FormLabel>
                <TextField
                  fullWidth
                  type="datetime-local"
                  {...register("deadline")}
                  error={!!errors.deadline}
                  helperText={errors.deadline?.message}
                  size="small"
                  sx={{ mt: 0.5 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>

              <div>
                <FormLabel>Recipient Address</FormLabel>
                <TextField
                  fullWidth
                  placeholder="0x..."
                  {...register("recipient")}
                  error={!!errors.recipient}
                  helperText={errors.recipient?.message}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </div>

              <div>
                <FormLabel required>Goal</FormLabel>
                <TextField
                  fullWidth
                  type="number"
                  placeholder="Amount in token units"
                  {...register("goal")}
                  error={!!errors.goal}
                  helperText={errors.goal?.message}
                  size="small"
                  sx={{ mt: 0.5 }}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>

              <div>
                <FormLabel required>Token Address</FormLabel>
                <TextField
                  disabled
                  aria-readonly
                  fullWidth
                  placeholder="0x..."
                  {...register("tokenAddress")}
                  error={!!errors.tokenAddress}
                  helperText={errors.tokenAddress?.message}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </div>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isValid || isPending || isLoading}
                loading={isPending || isLoading}
                fullWidth
                sx={{
                  mt: 1,
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  },
                  "&.Mui-disabled": {
                    background: "#e0e0e0",
                  },
                }}
              >
                Create Pot
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
