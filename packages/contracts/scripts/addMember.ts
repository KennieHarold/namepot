import { network } from "hardhat";
import { getAddress } from "viem";

const POT_ADDRESS = "0x12838e5d507178502fA605F12F42181F01FFbb6e";
const MEMBER_ADDRESS = "0x6c610Cc4d50Ebf8672173F7Ad58c266734399592";

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const pot = await viem.getContractAt("Pot", POT_ADDRESS);

const memberAddress = getAddress(MEMBER_ADDRESS);

console.log("Manager:", walletClient.account.address);
console.log("Pot:", POT_ADDRESS);
console.log("Adding member:", memberAddress);

const txHash = await pot.write.addMember([memberAddress]);
const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

console.log("\nTransaction hash:", txHash);
console.log("Status:", receipt.status);
