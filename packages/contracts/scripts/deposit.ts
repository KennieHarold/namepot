import { network } from "hardhat";
import {
  createWalletClient,
  http,
  parseUnits,
  getContract,
  erc20Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const POT_ADDRESS = "0x12838e5d507178502fA605F12F42181F01FFbb6e";
const TOKEN_ADDRESS = "0x3C67613Ba1f2835882262cC89FA63cE6bE8F95cF";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY env variable is required");
}

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const publicClient = await viem.getPublicClient();
const account = privateKeyToAccount(privateKey as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(publicClient.transport.url),
});

const pot = await viem.getContractAt("Pot", POT_ADDRESS);
const token = getContract({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  client: { public: publicClient, wallet: walletClient },
});

const amount = parseUnits("50", 18);

console.log("Wallet:", account.address);
console.log("Pot:", POT_ADDRESS);
console.log("Amount:", amount.toString());

// Approve token spend
console.log("\nApproving token spend...");
const approveTxHash = await token.write.approve([POT_ADDRESS, amount]);
const approveReceipt = await publicClient.waitForTransactionReceipt({
  hash: approveTxHash,
});
console.log("Approve tx:", approveTxHash);
console.log("Approve status:", approveReceipt.status);

// Deposit into pot
console.log("\nDepositing into pot...");
const depositTxHash = await pot.write.deposit([amount], {
  account,
});
const depositReceipt = await publicClient.waitForTransactionReceipt({
  hash: depositTxHash,
});
console.log("Deposit tx:", depositTxHash);
console.log("Deposit status:", depositReceipt.status);
