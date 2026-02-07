import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, Address } from "viem";
import { sepolia, mainnet } from "viem/chains";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

const textClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const nameClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export interface PotMember {
  address: Address;
  ensName: string | null;
}

export function usePotMembers(
  ensName: string | undefined,
  memberCount: number | undefined,
) {
  return useQuery<PotMember[]>({
    queryKey: ["potMembers", ensName, memberCount],
    queryFn: async (): Promise<PotMember[]> => {
      if (!ensName || !memberCount) return [];

      const addressPromises = Array.from({ length: memberCount }, (_, i) =>
        textClient.getEnsText({
          name: ensName,
          key: `pot:member:${i}`,
        }),
      );
      const addresses = await Promise.all(addressPromises);
      const memberPromises = addresses
        .filter((addr): addr is string => !!addr)
        .map(async (address) => {
          let resolvedName: string | null = null;
          try {
            resolvedName = await nameClient.getEnsName({
              address: address as Address,
            });
          } catch {}
          return { address: address as Address, ensName: resolvedName };
        });

      return Promise.all(memberPromises);
    },
    enabled: !!ensName && !!memberCount && memberCount > 0,
    staleTime: STALE_TIME,
  });
}
