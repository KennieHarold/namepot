// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "./interfaces/IPot.sol";
import "./interfaces/IResolver.sol";

contract Pot is IPot, Initializable, ERC1155Holder {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public goal;
    uint256 public memberCount;
    uint256 public totalDeposit;

    uint128 public deadline;
    uint16 public quorum;
    uint8 public numApprovals;

    bool public executed;

    address public manager;
    address public recipient;

    IERC20 public token;
    IResolver public resolver;

    bytes32 public node;

    mapping(address => bool) private isMember;
    mapping(address => uint256) private memberDeposit;
    mapping(address => bool) private hasApproved;

    event MemberAdded(address indexed memberAddress);
    event PotDeposit(address indexed memberAddress, uint256 amount);
    event Approved(address indexed memberAddress);
    event PaymentClaimed();
    event Withdrawn(address indexed memberAddress, uint256 amount);
    event PotClosed();

    function initialize(
        bytes32 _node,
        address _resolver,
        uint256 _goal,
        uint128 _deadline,
        uint16 _quorum,
        address _manager,
        address _recipient,
        address _token
    ) public initializer {
        require(_goal != 0, "Invalid goal");
        require(_deadline > block.timestamp, "Invalid deadline");

        node = _node;
        resolver = IResolver(_resolver);
        goal = _goal;
        deadline = _deadline;
        quorum = _quorum;
        numApprovals = 0;
        manager = _manager;
        recipient = _recipient;
        token = IERC20(_token);

        isMember[_manager] = true;
        memberDeposit[_manager] = 0;
        memberCount = 1;

        _setTextRecord("pot:member:0", Strings.toHexString(_manager));
        _setTextRecord("pot:membercount", Strings.toString(1));
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Not manager");
        _;
    }

    modifier onlyActivePot() {
        require(manager != address(0), "Pot already closed");
        _;
    }

    function addMember(
        address memberAddress
    ) external onlyManager onlyActivePot {
        require(memberAddress != address(0), "Invalid address");

        isMember[memberAddress] = true;
        memberDeposit[memberAddress] = 0;
        ++memberCount;

        _setTextRecord(
            string.concat("pot:member:", Strings.toString(memberCount - 1)),
            Strings.toHexString(memberAddress)
        );
        _setTextRecord("pot:membercount", Strings.toString(memberCount));

        emit MemberAdded(memberAddress);
    }

    function deposit(uint256 amount) external onlyActivePot {
        require(isMember[msg.sender], "Not a member");
        require(amount != 0, "Invalid amount");
        require(block.timestamp < deadline, "Deadline passed");

        memberDeposit[msg.sender] += amount;
        totalDeposit += amount;

        token.safeTransferFrom(msg.sender, address(this), amount);

        _setTextRecord("pot:totaldeposit", Strings.toString(totalDeposit));

        emit PotDeposit(msg.sender, amount);
    }

    function approve() external onlyActivePot {
        require(isMember[msg.sender], "Not a member");
        require(block.timestamp >= deadline, "Too early");
        require(token.balanceOf(address(this)) >= goal, "Goal not reached");
        require(!hasApproved[msg.sender], "Already approved");

        hasApproved[msg.sender] = true;
        ++numApprovals;

        _setTextRecord("pot:approvals", Strings.toString(numApprovals));

        emit Approved(msg.sender);
    }

    function claimPayment(bytes calldata signature) external onlyActivePot {
        require(msg.sender == recipient, "Not recipient");
        require(!executed, "Already executed");
        require(block.timestamp >= deadline, "Too early");
        require(token.balanceOf(address(this)) >= goal, "Goal not reached");

        address finalRecipient = recipient != address(0)
            ? recipient
            : msg.sender;

        require(finalRecipient == msg.sender, "Invalid recipient");

        uint256 approvalsRate = (uint256(numApprovals) * 1000) / memberCount;
        require(approvalsRate >= quorum, "Quorum not reached");

        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), finalRecipient, goal)
        );
        address signer = messageHash.toEthSignedMessageHash().recover(
            signature
        );
        require(signer == manager, "Invalid signature");

        executed = true;
        token.safeTransfer(finalRecipient, goal);

        _setTextRecord("pot:executed", "true");

        emit PaymentClaimed();
    }

    function withdraw(uint256 amount) external {
        require(isMember[msg.sender], "Not a member");
        require(amount != 0, "Invalid amount");

        uint256 balance = token.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        require(memberDeposit[msg.sender] >= amount, "Insufficient balance");

        memberDeposit[msg.sender] -= amount;
        token.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function closePot() external onlyManager onlyActivePot {
        manager = address(0);

        emit PotClosed();
    }

    function setTextRecord(
        string memory key,
        string memory value
    ) external onlyManager {
        _setTextRecord(key, value);
    }

    function _setTextRecord(string memory key, string memory value) internal {
        resolver.setText(node, key, value);
    }
}
