import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

import { network } from "hardhat";
import {
  Address,
  getAddress,
  parseEther,
  PublicClient,
  WalletClient,
  TestClient,
} from "viem";

describe("Pot", async function () {
  const { viem } = await network.connect();

  let publicClient: PublicClient;
  let testClient: TestClient;
  let manager: WalletClient;
  let recipient: WalletClient;
  let member1: WalletClient;
  let member2: WalletClient;
  let member3: WalletClient;
  let nonMember: WalletClient;

  let token: { address: Address };
  let pot: { address: Address };

  const GOAL = parseEther("100");
  const ONE_DAY = 86400n;

  async function getDeadline(offset: bigint = ONE_DAY): Promise<bigint> {
    const block = await publicClient.getBlock();
    return block.timestamp + offset;
  }

  async function advanceTime(seconds: number) {
    await testClient.increaseTime({ seconds });
    await testClient.mine({ blocks: 1 });
  }

  async function initializePot(
    potAddress: Address,
    goal: bigint,
    deadline: bigint,
    quorum: number,
    managerAddr: Address,
    recipientAddr: Address,
    tokenAddr: Address
  ) {
    const potContract = await viem.getContractAt("Pot", potAddress);
    await potContract.write.initialize(
      [goal, deadline, quorum, managerAddr, recipientAddr, tokenAddr],
      { account: manager.account!.address }
    );
  }

  beforeEach(async () => {
    publicClient = await viem.getPublicClient();
    testClient = await viem.getTestClient();
    const wallets = await viem.getWalletClients();
    [manager, recipient, member1, member2, member3, nonMember] = wallets;

    token = await viem.deployContract("MockERC20", ["Test Token", "TEST"]);

    const deadline = await getDeadline();
    pot = await viem.deployContract("Pot");

    await initializePot(
      pot.address,
      GOAL,
      deadline,
      500, // 50% quorum
      manager.account!.address,
      recipient.account!.address,
      token.address
    );
  });

  describe("Initialization", () => {
    it("should initialize with correct values", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      const goal = await potContract.read.goal();
      const quorum = await potContract.read.quorum();
      const potManager = await potContract.read.manager();
      const potRecipient = await potContract.read.recipient();

      assert.strictEqual(goal, GOAL);
      assert.strictEqual(quorum, 500);
      assert.strictEqual(
        getAddress(potManager),
        getAddress(manager.account!.address)
      );
      assert.strictEqual(
        getAddress(potRecipient),
        getAddress(recipient.account!.address)
      );
    });

    it("should revert if goal is zero", async () => {
      const newPot = await viem.deployContract("Pot");
      const deadline = await getDeadline();

      await assert.rejects(
        async () => {
          await initializePot(
            newPot.address,
            0n,
            deadline,
            500,
            manager.account!.address,
            recipient.account!.address,
            token.address
          );
        },
        { message: /Invalid goal/ }
      );
    });

    it("should revert if recipient is zero address", async () => {
      const newPot = await viem.deployContract("Pot");
      const deadline = await getDeadline();

      await assert.rejects(
        async () => {
          await initializePot(
            newPot.address,
            GOAL,
            deadline,
            500,
            manager.account!.address,
            "0x0000000000000000000000000000000000000000",
            token.address
          );
        },
        { message: /Invalid recipient/ }
      );
    });

    it("should revert if already initialized", async () => {
      const deadline = await getDeadline();

      await assert.rejects(
        async () => {
          await initializePot(
            pot.address,
            GOAL,
            deadline,
            500,
            manager.account!.address,
            recipient.account!.address,
            token.address
          );
        },
        { message: /InvalidInitialization/ }
      );
    });
  });

  describe("addMember", () => {
    it("should allow manager to add a member", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });

      const memberCount = await potContract.read.memberCount();
      assert.strictEqual(memberCount, 1n);
    });

    it("should emit MemberAdded event", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      const hash = await potContract.write.addMember(
        [member1.account!.address],
        {
          account: manager.account!.address,
        }
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.strictEqual(receipt.logs.length, 1);
    });

    it("should revert if non-manager tries to add member", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.addMember([member1.account!.address], {
            account: member1.account!.address,
          });
        },
        { message: /Not manager/ }
      );
    });

    it("should revert if adding zero address", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.addMember(
            ["0x0000000000000000000000000000000000000000"],
            {
              account: manager.account!.address,
            }
          );
        },
        { message: /Invalid address/ }
      );
    });
  });

  describe("deposit", () => {
    beforeEach(async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });

      await tokenContract.write.mint(
        [member1.account!.address, parseEther("200")],
        {
          account: manager.account!.address,
        }
      );

      await tokenContract.write.approve([pot.address, parseEther("200")], {
        account: member1.account!.address,
      });
    });

    it("should allow member to deposit", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.deposit([parseEther("50")], {
        account: member1.account!.address,
      });

      const balance = await tokenContract.read.balanceOf([pot.address]);
      assert.strictEqual(balance, parseEther("50"));
    });

    it("should emit PotDeposit event", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      const hash = await potContract.write.deposit([parseEther("50")], {
        account: member1.account!.address,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.ok(receipt.logs.length > 0);
    });

    it("should revert if non-member tries to deposit", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.deposit([parseEther("50")], {
            account: nonMember.account!.address,
          });
        },
        { message: /Not a member/ }
      );
    });

    it("should revert if deposit amount is zero", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.deposit([0n], {
            account: member1.account!.address,
          });
        },
        { message: /Invalid amount/ }
      );
    });
  });

  describe("approve", () => {
    beforeEach(async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });
      await potContract.write.addMember([member2.account!.address], {
        account: manager.account!.address,
      });

      await tokenContract.write.mint(
        [member1.account!.address, parseEther("100")],
        {
          account: manager.account!.address,
        }
      );

      await tokenContract.write.approve([pot.address, parseEther("100")], {
        account: member1.account!.address,
      });

      await potContract.write.deposit([parseEther("100")], {
        account: member1.account!.address,
      });
    });

    it("should allow member to approve after deadline and goal reached", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      // Advance time past deadline
      await advanceTime(86401);

      await potContract.write.approve({
        account: member1.account!.address,
      });

      const numApprovals = await potContract.read.numApprovals();
      assert.strictEqual(numApprovals, 1);
    });

    it("should revert if deadline not passed", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.approve({
            account: member1.account!.address,
          });
        },
        { message: /Too early/ }
      );
    });

    it("should revert if goal not reached", async () => {
      // Deploy new pot with higher goal
      const newPot = await viem.deployContract("Pot");
      const deadline = await getDeadline();

      await initializePot(
        newPot.address,
        parseEther("1000"), // Higher goal
        deadline,
        500,
        manager.account!.address,
        recipient.account!.address,
        token.address
      );

      const newPotContract = await viem.getContractAt("Pot", newPot.address);
      await newPotContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });

      await advanceTime(86401);

      await assert.rejects(
        async () => {
          await newPotContract.write.approve({
            account: member1.account!.address,
          });
        },
        { message: /Goal not reached/ }
      );
    });

    it("should revert if member already approved", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await advanceTime(86401);

      await potContract.write.approve({
        account: member1.account!.address,
      });

      await assert.rejects(
        async () => {
          await potContract.write.approve({
            account: member1.account!.address,
          });
        },
        { message: /Already approved/ }
      );
    });
  });

  describe("execute", () => {
    beforeEach(async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });
      await potContract.write.addMember([member2.account!.address], {
        account: manager.account!.address,
      });

      await tokenContract.write.mint(
        [member1.account!.address, parseEther("100")],
        {
          account: manager.account!.address,
        }
      );

      await tokenContract.write.approve([pot.address, parseEther("100")], {
        account: member1.account!.address,
      });

      await potContract.write.deposit([parseEther("100")], {
        account: member1.account!.address,
      });

      await advanceTime(86401);
    });

    it("should execute when quorum is reached", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      // Both members approve (100% approval rate)
      await potContract.write.approve({
        account: member1.account!.address,
      });
      await potContract.write.approve({
        account: member2.account!.address,
      });

      await potContract.write.execute({
        account: manager.account!.address,
      });

      const recipientBalance = await tokenContract.read.balanceOf([
        recipient.account!.address,
      ]);
      assert.strictEqual(recipientBalance, parseEther("100"));
    });

    it("should revert if quorum not reached", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      // No members approve (0% approval rate, need 50% quorum)
      await assert.rejects(
        async () => {
          await potContract.write.execute({
            account: manager.account!.address,
          });
        },
        { message: /Quorum not reached/ }
      );
    });

    it("should revert if non-manager tries to execute", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await potContract.write.approve({
        account: member1.account!.address,
      });
      await potContract.write.approve({
        account: member2.account!.address,
      });

      await assert.rejects(
        async () => {
          await potContract.write.execute({
            account: member1.account!.address,
          });
        },
        { message: /Not manager/ }
      );
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });

      await tokenContract.write.mint(
        [member1.account!.address, parseEther("100")],
        {
          account: manager.account!.address,
        }
      );

      await tokenContract.write.approve([pot.address, parseEther("100")], {
        account: member1.account!.address,
      });

      await potContract.write.deposit([parseEther("100")], {
        account: member1.account!.address,
      });
    });

    it("should allow member to withdraw their deposit", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      await potContract.write.withdraw([parseEther("50")], {
        account: member1.account!.address,
      });

      const memberBalance = await tokenContract.read.balanceOf([
        member1.account!.address,
      ]);
      assert.strictEqual(memberBalance, parseEther("50"));
    });

    it("should revert if non-member tries to withdraw", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.withdraw([parseEther("50")], {
            account: nonMember.account!.address,
          });
        },
        { message: /Not a member/ }
      );
    });

    it("should revert if withdraw amount is zero", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.withdraw([0n], {
            account: member1.account!.address,
          });
        },
        { message: /Invalid amount/ }
      );
    });

    it("should revert if withdraw amount exceeds deposit", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.withdraw([parseEther("150")], {
            account: member1.account!.address,
          });
        },
        { message: /Insufficient balance/ }
      );
    });
  });

  describe("closePot", () => {
    it("should allow manager to close pot", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await potContract.write.closePot({
        account: manager.account!.address,
      });

      const potManager = await potContract.read.manager();
      const potRecipient = await potContract.read.recipient();

      assert.strictEqual(
        potManager,
        "0x0000000000000000000000000000000000000000"
      );
      assert.strictEqual(
        potRecipient,
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("should revert if non-manager tries to close pot", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);

      await assert.rejects(
        async () => {
          await potContract.write.closePot({
            account: member1.account!.address,
          });
        },
        { message: /Not manager/ }
      );
    });

    it("should revert deposit after pot is closed", async () => {
      const potContract = await viem.getContractAt("Pot", pot.address);
      const tokenContract = await viem.getContractAt(
        "MockERC20",
        token.address
      );

      // Add member first before closing
      await potContract.write.addMember([member1.account!.address], {
        account: manager.account!.address,
      });

      await tokenContract.write.mint(
        [member1.account!.address, parseEther("100")],
        {
          account: manager.account!.address,
        }
      );

      await tokenContract.write.approve([pot.address, parseEther("100")], {
        account: member1.account!.address,
      });

      await potContract.write.closePot({
        account: manager.account!.address,
      });

      // Try to deposit after pot is closed
      await assert.rejects(
        async () => {
          await potContract.write.deposit([parseEther("50")], {
            account: member1.account!.address,
          });
        },
        { message: /Pot already closed/ }
      );
    });
  });
});
