export interface PotData {
  contractAddress: string;
  label: string;
  quorum: number;
  deadline: number;
  recipient: string;
  goal: number;
  raised: number;
  tokenAddress: string;
  manager: string;
  members: string[];
  numApprovals: number;
  isClosed: boolean;
}

export interface CreatePotFormData {
  label: string;
  quorum: number;
  deadline: string;
  recipient?: string;
  goal: string;
  tokenAddress: string;
}
