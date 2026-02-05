// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/INameWrapper.sol";

contract MockNameWrapper is INameWrapper {
    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address _owner,
        address _resolver,
        uint64 _ttl,
        uint32 _fuses,
        uint64 _expiry
    ) external pure returns (bytes32) {
        _owner;
        _resolver;
        _ttl;
        _fuses;
        _expiry;

        bytes32 labelHash = keccak256(bytes(label));
        bytes32 subnode = keccak256(abi.encodePacked(parentNode, labelHash));
        return subnode;
    }
}
