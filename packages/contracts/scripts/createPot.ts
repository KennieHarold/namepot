import { network } from "hardhat";
import { encodePacked, keccak256, parseUnits } from "viem";

const POT_FACTORY_ADDRESS = "0x7d83a33A7a0EDd9ccC42673F0F4D1dD194F53805";
const RECIPIENT = "0x7f70b3Df525E2A62b8678Fc3dA7eF4841ed08262";

const { viem } = await network.connect({
  network: "sepolia",
  chainType: "l1",
});

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const factory = await viem.getContractAt("PotFactory", POT_FACTORY_ADDRESS);

const label = "sports-car";
const hash = keccak256(encodePacked(["string"], [label]));
const goal = parseUnits("100", 18);
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
