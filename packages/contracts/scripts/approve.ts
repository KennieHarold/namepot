import { network } from "hardhat";
import { privateKeyToAccount } from "viem/accounts";

const POT_ADDRESS = "0x12838e5d507178502fA605F12F42181F01FFbb6e";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY is required");
}

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const publicClient = await viem.getPublicClient();
const account = privateKeyToAccount(privateKey as `0x${string}`);

const pot = await viem.getContractAt("Pot", POT_ADDRESS);

console.log("Wallet:", account.address);
console.log("Pot:", POT_ADDRESS);

console.log("\nApproving pot...");
const txHash = await pot.write.approve({ account });
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

console.log("Transaction hash:", txHash);
console.log("Status:", receipt.status);
