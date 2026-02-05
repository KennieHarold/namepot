// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Pot is Initializable {
    using SafeERC20 for IERC20;

    uint256 public goal;
    uint256 public memberCount;

    uint128 public deadline;
    uint16 public quorum;
    uint8 public numApprovals;

    address public manager;
    address public recipient;

    IERC20 public token;

    mapping(address => bool) private isMember;
    mapping(address => uint256) private memberDeposit;
    mapping(address => bool) private hasApproved;

    event MemberAdded(address indexed memberAddress);
    event PotDeposit(address indexed memberAddress, uint256 amount);
    event Approved(address indexed memberAddress);
    event Executed();
    event Withdrawn(address indexed memberAddress, uint256 amount);
    event PotClosed();

    function initialize(
        uint256 _goal,
        uint128 _deadline,
        uint16 _quorum,
        address _manager,
        address _recipient,
        address _token
    ) public initializer {
        require(_goal != 0, "Invalid goal");
        require(_deadline < block.timestamp, "Invalid deadline");
        require(_recipient != address(0), "Invalid recipient");

        goal = _goal;
        deadline = _deadline;
        quorum = _quorum;
        numApprovals = 0;
        manager = _manager;
        recipient = _recipient;
        token = IERC20(_token);
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Not manager");
        _;
    }

    modifier onlyActivePot() {
        require(
            manager != address(0) && recipient != address(0),
            "Pot already closed"
        );
        _;
    }

    function addMember(
        address memberAddress
    ) external onlyManager onlyActivePot {
        require(memberAddress != address(0), "Invalid address");

        isMember[memberAddress] = true;
        memberDeposit[memberAddress] = 0;
        memberCount++;

        emit MemberAdded(memberAddress);
    }

    function deposit(uint256 amount) external onlyActivePot {
        require(isMember[msg.sender], "Not a member");
        require(amount != 0, "Invalid amount");
        require(block.timestamp < deadline, "Deadline passed");

        memberDeposit[msg.sender] += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit PotDeposit(msg.sender, amount);
    }

    function approve() external onlyActivePot {
        require(isMember[msg.sender], "Not a member");
        require(block.timestamp >= deadline, "Too early");
        require(token.balanceOf(address(this)) >= goal, "Goal not reached");
        require(!hasApproved[msg.sender], "Already approved");

        hasApproved[msg.sender] = true;
        numApprovals++;

        emit Approved(msg.sender);
    }

    function execute() external onlyManager onlyActivePot {
        require(block.timestamp >= deadline, "Too early");
        require(token.balanceOf(address(this)) >= goal, "Goal not reached");

        uint256 approvalsRate = (numApprovals / memberCount) * 1000;
        require(approvalsRate >= quorum, "Quorum not reached");

        token.safeTransfer(recipient, goal);

        emit Executed();
    }

    function withdraw(uint256 amount) external {
        require(isMember[msg.sender], "Not a member");
        require(amount != 0, "Invalid amount");

        uint256 balance = token.balanceOf(address(this));
        require(balance > amount, "Insufficient balance");
        require(memberDeposit[msg.sender] >= amount, "Insufficient balance");

        memberDeposit[msg.sender] -= amount;
        token.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function closePot() external onlyManager onlyActivePot {
        recipient = address(0);
        manager = address(0);

        emit PotClosed();
    }
}
