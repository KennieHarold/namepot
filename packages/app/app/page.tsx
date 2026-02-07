"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";

export default function Home() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const label = search.trim();
    if (!label) {
      return;
    }
    router.push(`/pot/${label}`);
  };
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          py: 8,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h3" gutterBottom>
            Find your pot
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search for savings pots by ENS name
          </Typography>
        </Box>

        <TextField
          fullWidth
          placeholder="Search pots by ENS name (e.g., sports-car.namepot.eth)"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            maxWidth: 600,
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              height: 56,
              bgcolor: "background.paper",
            },
          }}
        />

        <Typography variant="body2" color="text.secondary">
          or
        </Typography>

        <Button
          component={Link}
          href="/create"
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1rem",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            },
          }}
        >
          Create Pot
        </Button>
      </Box>
    </Container>
  );
}
