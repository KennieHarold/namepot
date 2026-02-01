// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IResolver {
    function setAddr(bytes32 node, address a) external;
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;
}
