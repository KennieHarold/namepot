import { describe, it } from "node:test";

import { network } from "hardhat";

describe("PotFactory", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("should deploy", async function () {
    await viem.deployContract("PotFactory");
  });
});
