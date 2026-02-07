// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IENSRegistrar {
    function issueSubnodeRecord(
        string calldata label,
        address target,
        address owner,
        string[] calldata keys,
        string[] calldata values
    ) external returns (bytes32 node);

    function getResolver() external view returns (address);
}
