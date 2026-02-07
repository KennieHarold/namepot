// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IPot {
    function initialize(
        bytes32 _node,
        address _resolver,
        uint256 _goal,
        uint128 _deadline,
        uint16 _quorum,
        address _manager,
        address _recipient,
        address _token
    ) external;
}
