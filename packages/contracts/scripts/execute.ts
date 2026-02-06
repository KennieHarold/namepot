import { network } from "hardhat";

const POT_ADDRESS = "0x12838e5d507178502fA605F12F42181F01FFbb6e";

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const pot = await viem.getContractAt("Pot", POT_ADDRESS);

console.log("Manager:", walletClient.account.address);
console.log("Pot:", POT_ADDRESS);

console.log("\nExecuting pot...");
const txHash = await pot.write.execute();
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

console.log("Transaction hash:", txHash);
console.log("Status:", receipt.status);
