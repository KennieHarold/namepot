import { network } from "hardhat";
import { encodePacked, keccak256, parseUnits, zeroAddress } from "viem";

const POT_FACTORY_ADDRESS = "0x245D88d88b16c04AEb2052e6f6125C688C7ddBCe";
const RECIPIENT = zeroAddress;

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const factory = await viem.getContractAt("PotFactory", POT_FACTORY_ADDRESS);

const label = "test-zero-address";
const hash = keccak256(encodePacked(["string"], [label]));
const goal = parseUnits("25", 18);
const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30); // 30 minutes from now
const quorum = 500; // 50%
const manager = walletClient.account.address;

console.log("Creating pot with the following parameters:");
console.log("  Label:", label);
console.log("  Hash:", hash);
console.log("  Goal:", goal.toString());
console.log("  Deadline:", deadline.toString());
console.log("  Quorum:", quorum);
console.log("  Manager:", manager);
console.log("  Recipient:", RECIPIENT);

const txHash = await factory.write.createPot([
  hash,
  label,
  goal,
  deadline,
  quorum,
  manager,
  RECIPIENT,
]);

console.log("Transaction hash:", txHash);

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log("Transaction confirmed in block:", receipt.blockNumber);
console.log("Status:", receipt.status);
