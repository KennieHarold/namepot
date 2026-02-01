// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Pot is Initializable {
    using SafeERC20 for IERC20;

    uint256 public goal;
    uint128 public deadline;
    uint16 public quorum;

    IERC20 public token;

    mapping(address => bool) private isMember;
    mapping(address => uint256) private memberDeposit;

    function initialize() public initializer {}

    function addMember(address memberAddress) external {
        require(memberAddress != address(0), "Invalid address");
        isMember[memberAddress] = true;
        memberDeposit[memberAddress] = 0;
    }

    function deposit(uint256 amount) external {
        memberDeposit[msg.sender] += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw() external {}

    function proposePayment() external {}

    function approvePayment() external {}

    function executePayment() external {}

    function closePot() external {}
}
