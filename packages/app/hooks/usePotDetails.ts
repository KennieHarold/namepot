import { Address, erc20Abi } from "viem";
import { useEnsText, useReadContract, useConnection } from "wagmi";

import { POT } from "@/lib/abis";
import { toBigInt, toNumber, toAddress } from "@/lib/utils";

const CHAIN_ID = parseInt(String(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID));
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

function useEnsWithContractFallback(
  ensName: string | undefined,
  potAddress: Address | undefined,
  ensKey: string,
  functionName: string,
) {
  const {
    data: ensText,
    isLoading: isEnsLoading,
    isError: isEnsError,
  } = useEnsText({
    name: ensName,
    key: ensKey,
    chainId: CHAIN_ID,
    query: {
      enabled: !!ensName,
      staleTime: STALE_TIME,
    },
  });

  const shouldFallback = !ensText && !isEnsLoading;

  const {
    data: contractValue,
    isLoading: isContractLoading,
    isError: isContractError,
  } = useReadContract({
    address: potAddress,
    abi: POT,
    functionName,
    chainId: CHAIN_ID,
    query: {
      enabled: shouldFallback && !!potAddress,
      staleTime: STALE_TIME,
    },
  });

  const value = ensText ?? contractValue;
  const isLoading =
    isEnsLoading || (shouldFallback && !isEnsError && isContractLoading);
  const isError = isEnsError && isContractError;

  return { value, isLoading, isError };
}

function useTotalDeposit(
  ensName: string | undefined,
  potAddress: Address | undefined,
) {
  const {
    data: ensText,
    isLoading: isEnsLoading,
    isError: isEnsError,
  } = useEnsText({
    name: ensName,
    key: "pot:totaldeposit",
    chainId: CHAIN_ID,
    query: {
      enabled: !!ensName,
      staleTime: STALE_TIME,
    },
  });

  const shouldFallback = !ensText && !isEnsLoading;

  const { data: tokenAddress } = useReadContract({
    address: potAddress,
    abi: POT,
    functionName: "token",
    chainId: CHAIN_ID,
    query: {
      enabled: shouldFallback && !!potAddress,
      staleTime: STALE_TIME,
    },
  });

  const {
    data: tokenBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useReadContract({
    address: tokenAddress as Address | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [potAddress as Address],
    chainId: CHAIN_ID,
    query: {
      enabled: shouldFallback && !!tokenAddress && !!potAddress,
      staleTime: STALE_TIME,
    },
  });

  const value = ensText ?? tokenBalance;
  const isLoading =
    isEnsLoading || (shouldFallback && !isEnsError && isBalanceLoading);
  const isError = isEnsError && isBalanceError;

  return { value, isLoading, isError };
}

export function usePotDetails(
  ensName: string | undefined,
  potAddress: Address | undefined,
) {
  const { address: connectedAddress } = useConnection();

  const goal = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:goal",
    "goal",
  );
  const deadline = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:deadline",
    "deadline",
  );
  const quorum = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:quorum",
    "quorum",
  );
  const approvals = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:approvals",
    "numApprovals",
  );
  const totalDeposit = useTotalDeposit(ensName, potAddress);
  const memberCount = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:membercount",
    "memberCount",
  );
  const recipient = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:recipient",
    "recipient",
  );
  const manager = useEnsWithContractFallback(
    ensName,
    potAddress,
    "pot:manager",
    "manager",
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
    manager.isLoading;

  return {
    goal: toBigInt(goal.value),
    deadline: toNumber(deadline.value),
    quorum: toNumber(quorum.value),
    approvals: toNumber(approvals.value),
    totalDeposit: toBigInt(totalDeposit.value),
    memberCount: toNumber(memberCount.value),
    recipient: toAddress(recipient.value),
    managerAddress,
    isManager,
    isLoading,
  };
}
