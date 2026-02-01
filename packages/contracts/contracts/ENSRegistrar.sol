// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IENSRegistrar.sol";
import "./interfaces/INameWrapper.sol";
import "./interfaces/IResolver.sol";

contract ENSRegistrar is IENSRegistrar {
    INameWrapper public immutable nameWrapper;
    IResolver public immutable resolver;

    // namehash("namepot.eth")
    bytes32 public immutable rootNode;

    mapping(bytes32 => bytes32) public nodes;

    event SubnodeRecordIssued(
        string label,
        bytes32 node,
        address target,
        address finalOwner
    );

    constructor(address _nameWrapper, address _resolver, bytes32 _rootNode) {
        nameWrapper = INameWrapper(_nameWrapper);
        resolver = IResolver(_resolver);
        rootNode = _rootNode;
    }

    function issueSubnodeRecord(
        bytes32 node,
        string calldata label,
        address target,
        address owner,
        string[] calldata keys,
        string[] calldata values
    ) external {
        require(target != address(0) && owner != address(0), "Invalid address");
        require(
            keys.length == values.length,
            "Metadata length doesn't matched"
        );

        bytes32 finalNode = nameWrapper.setSubnodeRecord(
            node != 0x0 ? node : rootNode,
            label,
            address(this),
            address(resolver),
            0,
            0,
            0
        );

        resolver.setAddr(node, target);

        for (uint8 i = 0; i < keys.length; i++) {
            resolver.setText(node, keys[i], values[i]);
        }

        nameWrapper.setSubnodeRecord(
            rootNode,
            label,
            owner,
            address(resolver),
            0,
            0,
            0
        );

        nodes[keccak256(bytes(label))] = finalNode;

        emit SubnodeRecordIssued(label, finalNode, target, owner);
    }
}
