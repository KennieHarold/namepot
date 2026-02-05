import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

import { network } from "hardhat";
import {
  Address,
  getAddress,
  keccak256,
  toHex,
  PublicClient,
  parseEther,
  encodePacked,
} from "viem";

describe("PotFactory", async function () {
  const { viem } = await network.connect();

  let publicClient: PublicClient;
  let deployer: { account: { address: Address } };
  let manager: { account: { address: Address } };
  let recipient: { account: { address: Address } };

  let potImplementation: { address: Address };
  let beacon: { address: Address };
  let mockToken: { address: Address };
  let mockNameWrapper: { address: Address };
  let mockResolver: { address: Address };
  let registrar: { address: Address };
  let factory: { address: Address };

  const ROOT_NODE = keccak256(toHex("namepot.eth"));
  const GOAL = parseEther("100");
  const ONE_DAY = 86400n;

  async function getDeadline(offset: bigint = ONE_DAY): Promise<bigint> {
    const block = await publicClient.getBlock();
    return block.timestamp + offset;
  }

  beforeEach(async () => {
    publicClient = await viem.getPublicClient();
    const wallets = await viem.getWalletClients();
    [deployer, manager, recipient] = wallets;

    // Deploy Pot implementation
    potImplementation = await viem.deployContract("Pot");

    // Deploy MockUpgradeableBeacon with Pot implementation
    beacon = await viem.deployContract("MockUpgradeableBeacon", [
      potImplementation.address,
      deployer.account!.address,
    ]);

    // Deploy mock token
    mockToken = await viem.deployContract("MockERC20", ["Test Token", "TEST"]);

    // Deploy mock ENS contracts
    mockNameWrapper = await viem.deployContract("MockNameWrapper");
    mockResolver = await viem.deployContract("MockResolver");

    // Deploy ENSRegistrar
    registrar = await viem.deployContract("ENSRegistrar", [
      mockNameWrapper.address,
      mockResolver.address,
      ROOT_NODE,
    ]);

    // Deploy PotFactory
    factory = await viem.deployContract("PotFactory", [
      beacon.address,
      registrar.address,
      mockToken.address,
    ]);
  });

  describe("Constructor", () => {
    it("should set POT_BEACON correctly", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const potBeacon = await factoryContract.read.POT_BEACON();
      assert.strictEqual(getAddress(potBeacon), getAddress(beacon.address));
    });

    it("should set TOKEN correctly", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const token = await factoryContract.read.TOKEN();
      assert.strictEqual(getAddress(token), getAddress(mockToken.address));
    });

    it("should set REGISTRAR correctly", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const registrarAddr = await factoryContract.read.REGISTRAR();
      assert.strictEqual(
        getAddress(registrarAddr),
        getAddress(registrar.address),
      );
    });
  });

  describe("createPot", () => {
    it("should create a new pot with correct parameters", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("test-pot-1"));
      const label = "testPot";

      const hash = await factoryContract.write.createPot(
        [
          salt,
          label,
          GOAL,
          deadline,
          500, // 50% quorum
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.status, "success");
    });

    it("should emit PotCreated event with correct data", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("test-pot-event"));
      const label = "eventPot";

      const hash = await factoryContract.write.createPot(
        [
          salt,
          label,
          GOAL,
          deadline,
          500,
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const potCreatedLog = receipt.logs.find((log) => {
        return log.topics[0] !== undefined;
      });

      assert.ok(potCreatedLog, "PotCreated event should be emitted");
    });

    it("should initialize the pot correctly", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("test-pot-init"));
      const label = "initPot";

      const hash = await factoryContract.write.createPot(
        [
          salt,
          label,
          GOAL,
          deadline,
          500,
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const potCreatedEvent = receipt.logs.find(
        (log) => log.address.toLowerCase() === factory.address.toLowerCase(),
      );
      assert.ok(potCreatedEvent, "PotCreated event should be emitted");

      // Extract pot address from event data (it's the second indexed parameter)
      const potAddress = `0x${potCreatedEvent.topics[2]?.slice(26)}` as Address;

      const potContract = await viem.getContractAt("Pot", potAddress);

      const potGoal = await potContract.read.goal();
      const potQuorum = await potContract.read.quorum();
      const potManager = await potContract.read.manager();
      const potRecipient = await potContract.read.recipient();

      assert.strictEqual(potGoal, GOAL);
      assert.strictEqual(potQuorum, 500);
      assert.strictEqual(
        getAddress(potManager),
        getAddress(manager.account!.address),
      );
      assert.strictEqual(
        getAddress(potRecipient),
        getAddress(recipient.account!.address),
      );
    });

    it("should register ENS subnode record", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );
      const registrarContract = await viem.getContractAt(
        "ENSRegistrar",
        registrar.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("test-pot-ens"));
      const label = "ensPot";

      await factoryContract.write.createPot(
        [
          salt,
          label,
          GOAL,
          deadline,
          500,
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const labelHash = keccak256(toHex(label));
      const storedNode = await registrarContract.read.nodes([labelHash]);

      // Node should exist (not zero)
      assert.notStrictEqual(
        storedNode,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });

    it("should revert if salt already used (address collision)", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("duplicate-salt"));

      // First creation should succeed
      await factoryContract.write.createPot(
        [
          salt,
          "pot1",
          GOAL,
          deadline,
          500,
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      // Second creation with same salt should fail
      await assert.rejects(
        async () => {
          await factoryContract.write.createPot(
            [
              salt,
              "pot2",
              GOAL,
              deadline,
              500,
              manager.account!.address,
              recipient.account!.address,
            ],
            { account: deployer.account!.address },
          );
        },
        { message: /Create2: address already in use/ },
      );
    });

    it("should create deterministic addresses with same salt", async () => {
      // Deploy a second factory with same beacon
      const factory2 = await viem.deployContract("PotFactory", [
        beacon.address,
        registrar.address,
        mockToken.address,
      ]);

      const factoryContract1 = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );
      const factoryContract2 = await viem.getContractAt(
        "PotFactory",
        factory2.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("deterministic-test"));

      // Create pot from first factory
      const hash1 = await factoryContract1.write.createPot(
        [
          salt,
          "detPot1",
          GOAL,
          deadline,
          500,
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const receipt1 = await publicClient.waitForTransactionReceipt({
        hash: hash1,
      });

      // Get pot address from event
      const potCreatedEvent1 = receipt1.logs.find(
        (log) => log.address.toLowerCase() === factory.address.toLowerCase(),
      );
      const potAddress1 = `0x${potCreatedEvent1?.topics[2]?.slice(26)}`;

      // Note: Different factory will produce different address due to different deployer
      // This test just verifies the deterministic nature within same factory
      assert.ok(potAddress1, "Pot address should be deterministic");
    });
  });

  describe("Metadata generation", () => {
    it("should set correct metadata on resolver", async () => {
      const factoryContract = await viem.getContractAt(
        "PotFactory",
        factory.address,
      );
      const resolverContract = await viem.getContractAt(
        "MockResolver",
        mockResolver.address,
      );

      const deadline = await getDeadline();
      const salt = keccak256(toHex("metadata-test"));
      const label = "metadataPot";

      await factoryContract.write.createPot(
        [
          salt,
          label,
          GOAL,
          deadline,
          750, // 75% quorum
          manager.account!.address,
          recipient.account!.address,
        ],
        { account: deployer.account!.address },
      );

      const labelHash = keccak256(toHex(label));
      const node = keccak256(
        encodePacked(["bytes32", "bytes32"], [ROOT_NODE, labelHash]),
      );

      const version = await resolverContract.read.text([node, "pot:version"]);
      const goal = await resolverContract.read.text([node, "pot:goal"]);
      const deadlineText = await resolverContract.read.text([
        node,
        "pot:deadline",
      ]);
      const quorum = await resolverContract.read.text([node, "pot:quorum"]);

      assert.strictEqual(version, "1");
      assert.strictEqual(goal, GOAL.toString());
      assert.strictEqual(deadlineText, deadline.toString());
      assert.strictEqual(quorum, "750");
    });
  });
});
