import type { PotData } from "./types";

const MOCK_DEADLINE = 1771027200;

export const MOCK_POT: PotData = {
  contractAddress: "0x12838e5d507178502fA605F12F42181F01FFbb6e",
  label: "sports-car",
  quorum: 750,
  deadline: MOCK_DEADLINE,
  recipient: "0x1234567890abcdef1234567890abcdef12345678",
  goal: 10000,
  raised: 3500,
  tokenAddress: "0x3C67613Ba1f2835882262cC89FA63cE6bE8F95cF",
  manager: "0xABcdEF0123456789abcdef0123456789ABCDEF01",
  members: [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
  ],
  numApprovals: 1,
  isClosed: false,
};

export const MOCK_STATE = {
  isMember: true,
  isManager: true,
};
