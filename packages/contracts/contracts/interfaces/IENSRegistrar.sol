// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IENSRegistrar {
    function issueSubnodeRecord(
        bytes32 node,
        string calldata label,
        address target,
        address owner,
        string[] calldata keys,
        string[] calldata values
    ) external;
}
