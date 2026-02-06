import { Address } from "viem";

export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function toBigInt(raw: unknown): bigint | undefined {
  if (raw == null) return undefined;
  try {
    return BigInt(raw as string | number | bigint);
  } catch {
    return undefined;
  }
}

export function toNumber(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  return isNaN(n) ? undefined : n;
}

export function toAddress(raw: unknown): Address | undefined {
  if (raw == null) return undefined;
  return String(raw) as Address;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
