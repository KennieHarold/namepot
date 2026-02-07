import { Address, erc20Abi } from "viem";
import { useReadContract, useConnection } from "wagmi";

const CHAIN_ID = parseInt(String(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID));

export function useAllowance(spender: Address | undefined) {
  const { address: owner } = useConnection();
  const tokenAddress = process.env.NEXT_PUBLIC_CURRENCY_TOKEN as Address;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner as Address, spender as Address],
    chainId: CHAIN_ID,
    query: {
      enabled: !!owner && !!spender,
      staleTime: 0,
    },
  });

  return {
    allowance: allowance ?? BigInt(0),
    refetchAllowance,
  };
}
