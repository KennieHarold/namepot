// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IResolver.sol";

contract MockResolver is IResolver {
    mapping(bytes32 => address) public addresses;
    mapping(bytes32 => mapping(string => string)) public texts;

    function setAddr(bytes32 node, address a) external {
        addresses[node] = a;
    }

    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external {
        texts[node][key] = value;
    }

    function addr(bytes32 node) external view returns (address) {
        return addresses[node];
    }

    function text(
        bytes32 node,
        string calldata key
    ) external view returns (string memory) {
        return texts[node][key];
    }
}
