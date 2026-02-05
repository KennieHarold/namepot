import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

import { network } from "hardhat";
import {
  Address,
  getAddress,
  keccak256,
  toHex,
  PublicClient,
  encodePacked,
} from "viem";

describe("ENSRegistrar", async function () {
  const { viem } = await network.connect();

  let publicClient: PublicClient;
  let deployer: { account: { address: Address } };
  let owner: { account: { address: Address } };
  let target: { account: { address: Address } };

  let mockNameWrapper: { address: Address };
  let mockResolver: { address: Address };
  let registrar: { address: Address };

  const ROOT_NODE = keccak256(toHex("namepot.eth"));

  beforeEach(async () => {
    publicClient = await viem.getPublicClient();
    const wallets = await viem.getWalletClients();
    [deployer, owner, target] = wallets;

    mockNameWrapper = await viem.deployContract("MockNameWrapper");
    mockResolver = await viem.deployContract("MockResolver");

    registrar = await viem.deployContract("ENSRegistrar", [
      mockNameWrapper.address,
      mockResolver.address,
      ROOT_NODE,
    ]);
  });

  describe("Constructor", () => {
    it("should set nameWrapper correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const nameWrapper = await registrarContract.read.nameWrapper();
      assert.strictEqual(
        getAddress(nameWrapper),
        getAddress(mockNameWrapper.address),
      );
    });

    it("should set resolver correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const resolver = await registrarContract.read.resolver();
      assert.strictEqual(
        getAddress(resolver),
        getAddress(mockResolver.address),
      );
    });

    it("should set rootNode correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const rootNode = await registrarContract.read.rootNode();
      assert.strictEqual(rootNode, ROOT_NODE);
    });
  });

  describe("issueSubnodeRecord", () => {
    it("should issue subnode record successfully", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const label = "testPot";
      const keys = ["pot:version", "pot:goal"];
      const values = ["1", "1000"];

      const hash = await registrarContract.write.issueSubnodeRecord(
        [label, target.account!.address, owner.account!.address, keys, values],
        { account: deployer.account!.address },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.status, "success");
    });

    it("should emit SubnodeRecordIssued event", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const label = "eventPot";
      const keys = ["pot:version"];
      const values = ["1"];

      const hash = await registrarContract.write.issueSubnodeRecord(
        [label, target.account!.address, owner.account!.address, keys, values],
        { account: deployer.account!.address },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.ok(receipt.logs.length > 0);
    });

    it("should store node mapping correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const label = "mappingPot";
      const keys: string[] = [];
      const values: string[] = [];

      await registrarContract.write.issueSubnodeRecord(
        [label, target.account!.address, owner.account!.address, keys, values],
        { account: deployer.account!.address },
      );

      const labelHash = keccak256(toHex(label));
      const storedNode = await registrarContract.read.nodes([labelHash]);

      // Node should be computed as keccak256(rootNode, labelHash)
      const expectedNode = keccak256(
        encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash]),
      );
      assert.strictEqual(storedNode, expectedNode);
    });

    it("should set resolver address correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );
      const resolverContract = await viem.getContractAt(
        "MockResolver",
        mockResolver.address,
      );

      const label = "resolverPot";
      const keys: string[] = [];
      const values: string[] = [];

      await registrarContract.write.issueSubnodeRecord(
        [label, target.account!.address, owner.account!.address, keys, values],
        { account: deployer.account!.address },
      );

      const labelHash = keccak256(toHex(label));
      const node = keccak256(
        encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash]),
      );

      const resolvedAddress = await resolverContract.read.addr([node]);
      assert.strictEqual(
        getAddress(resolvedAddress),
        getAddress(target.account!.address),
      );
    });

    it("should set text records correctly", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );
      const resolverContract = await viem.getContractAt(
        "MockResolver",
        mockResolver.address,
      );

      const label = "textPot";
      const keys = ["pot:version", "pot:goal", "pot:deadline"];
      const values = ["1", "1000000", "1700000000"];

      await registrarContract.write.issueSubnodeRecord(
        [label, target.account!.address, owner.account!.address, keys, values],
        { account: deployer.account!.address },
      );

      const labelHash = keccak256(toHex(label));
      const node = keccak256(
        encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash]),
      );

      const version = await resolverContract.read.text([node, "pot:version"]);
      const goal = await resolverContract.read.text([node, "pot:goal"]);
      const deadline = await resolverContract.read.text([node, "pot:deadline"]);

      assert.strictEqual(version, "1");
      assert.strictEqual(goal, "1000000");
      assert.strictEqual(deadline, "1700000000");
    });

    it("should revert if target is zero address", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      await assert.rejects(
        async () => {
          await registrarContract.write.issueSubnodeRecord(
            [
              "invalidPot",
              "0x0000000000000000000000000000000000000000",
              owner.account!.address,
              [],
              [],
            ],
            { account: deployer.account!.address },
          );
        },
        { message: /Invalid address/ },
      );
    });

    it("should revert if owner is zero address", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      await assert.rejects(
        async () => {
          await registrarContract.write.issueSubnodeRecord(
            [
              "invalidPot",
              target.account!.address,
              "0x0000000000000000000000000000000000000000",
              [],
              [],
            ],
            { account: deployer.account!.address },
          );
        },
        { message: /Invalid address/ },
      );
    });

    it("should revert if keys and values length mismatch", async () => {
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      await assert.rejects(
        async () => {
          await registrarContract.write.issueSubnodeRecord(
            [
              "mismatchPot",
              target.account!.address,
              owner.account!.address,
              ["key1", "key2"],
              ["value1"], // Missing value
            ],
            { account: deployer.account!.address },
          );
        },
        { message: /Metadata length doesn't matched/ },
      );
    });
  });
});
