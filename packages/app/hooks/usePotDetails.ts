import { useState } from "react";
import { Address, zeroAddress } from "viem";
import { useEnsText, useConnection, useReadContract } from "wagmi";

import { toBigInt, toNumber, toAddress } from "@/lib/utils";
import { POT } from "@/lib/abis";

export type PotStatus = "Active" | "Approving" | "Executed" | "Closed";

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

export function usePotDetails(
  ensName: string | undefined,
  potAddress: Address | undefined,
) {
  const { address: connectedAddress } = useConnection();

  const goal = useEnsValue(ensName, "pot:goal");
  const deadline = useEnsValue(ensName, "pot:deadline");
  const quorum = useEnsValue(ensName, "pot:quorum");
  const approvals = useEnsValue(ensName, "pot:approvals");
  const totalDeposit = useEnsValue(ensName, "pot:totaldeposit");
  const memberCount = useEnsValue(ensName, "pot:membercount");
  const recipient = useEnsValue(ensName, "pot:recipient");
  const manager = useEnsValue(ensName, "pot:manager");
  const executed = useEnsValue(ensName, "pot:executed");

  const { data: onChainManager, isLoading: isManagerLoading } = useReadContract(
    {
      address: potAddress,
      abi: POT,
      functionName: "manager",
      query: {
        enabled: !!potAddress,
        staleTime: STALE_TIME,
      },
    },
  );

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
    manager.isLoading ||
    executed.isLoading ||
    isManagerLoading;

  const deadlineNum = toNumber(deadline.value);
  const [now] = useState(() => Math.floor(Date.now() / 1000));

  let status: PotStatus = "Active";
  if (onChainManager === zeroAddress) {
    status = "Closed";
  } else if (executed.value === "true") {
    status = "Executed";
  } else if (deadlineNum && now >= deadlineNum) {
    status = "Approving";
  }

  return {
    goal: toBigInt(goal.value),
    deadline: deadlineNum,
    quorum: toNumber(quorum.value),
    approvals: toNumber(approvals.value),
    totalDeposit: toBigInt(totalDeposit.value ?? "0"),
    memberCount: toNumber(memberCount.value),
    recipient: toAddress(recipient.value),
    managerAddress,
    isManager,
    isLoading,
    status,
  };
}
