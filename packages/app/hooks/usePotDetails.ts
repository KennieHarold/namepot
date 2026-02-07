import { Address } from "viem";
import { useEnsText, useConnection } from "wagmi";

import { toBigInt, toNumber, toAddress } from "@/lib/utils";

const CHAIN_ID = parseInt(String(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID));
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

function useEnsValue(ensName: string | undefined, ensKey: string) {
  const {
    data: ensText,
    isLoading,
    isError,
  } = useEnsText({
    name: ensName,
    key: ensKey,
    chainId: CHAIN_ID,
    query: {
      enabled: !!ensName,
      staleTime: STALE_TIME,
    },
  });

  return { value: ensText, isLoading, isError };
}

export function usePotDetails(ensName: string | undefined) {
  const { address: connectedAddress } = useConnection();

  const goal = useEnsValue(ensName, "pot:goal");
  const deadline = useEnsValue(ensName, "pot:deadline");
  const quorum = useEnsValue(ensName, "pot:quorum");
  const approvals = useEnsValue(ensName, "pot:approvals");
  const totalDeposit = useEnsValue(ensName, "pot:totaldeposit");
  const memberCount = useEnsValue(ensName, "pot:membercount");
  const recipient = useEnsValue(ensName, "pot:recipient");
  const manager = useEnsValue(ensName, "pot:manager");

  const managerAddress = manager.value
    ? (String(manager.value) as Address)
    : undefined;

  const isManager =
    !!connectedAddress &&
    !!managerAddress &&
    connectedAddress.toLowerCase() === managerAddress.toLowerCase();

  const isLoading =
    goal.isLoading ||
    deadline.isLoading ||
    quorum.isLoading ||
    approvals.isLoading ||
    totalDeposit.isLoading ||
    memberCount.isLoading ||
    recipient.isLoading ||
    manager.isLoading;

  return {
    goal: toBigInt(goal.value),
    deadline: toNumber(deadline.value),
    quorum: toNumber(quorum.value),
    approvals: toNumber(approvals.value),
    totalDeposit: toBigInt(totalDeposit.value ?? "0"),
    memberCount: toNumber(memberCount.value),
    recipient: toAddress(recipient.value),
    managerAddress,
    isManager,
    isLoading,
  };
}
