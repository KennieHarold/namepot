"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
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
import type { CreatePotFormData } from "@/lib/types";

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
  } = useForm<CreatePotFormData>({
    resolver: yupResolver(createPotSchema),
    defaultValues: {
      label: "",
      quorum: 750,
      deadline: "",
      recipient: "",
      goal: "",
      tokenAddress: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (data: CreatePotFormData) => {
    console.log("Create pot:", data);
  };

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
                <FormLabel required>Recipient Address</FormLabel>
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
                />
              </div>

              <div>
                <FormLabel required>Token Address</FormLabel>
                <TextField
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
                disabled={!isValid}
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
