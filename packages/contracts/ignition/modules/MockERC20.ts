import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockERC20Module", (m) => {
  const token = m.contract("MockERC20", ["Mock USDC", "MUSDC"], {
    id: "MockERC20",
  });

  m.call(token, "mint", [m.getAccount(0), 1_000_000_000n * 10n ** 18n], {
    id: "MintInitialSupply",
  });

  return { token };
});
