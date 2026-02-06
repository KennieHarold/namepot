// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./interfaces/IENSRegistrar.sol";
import "./interfaces/INameWrapper.sol";
import "./interfaces/IResolver.sol";

contract ENSRegistrar is IENSRegistrar, ERC1155Holder {
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
        string calldata label,
        address target,
        address owner,
        string[] calldata keys,
        string[] calldata values
    ) external returns (bytes32 node) {
        require(target != address(0) && owner != address(0), "Invalid address");
        require(
            keys.length == values.length,
            "Metadata length doesn't matched"
        );

        node = nameWrapper.setSubnodeRecord(
            rootNode,
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

        nodes[keccak256(bytes(label))] = node;

        emit SubnodeRecordIssued(label, node, target, owner);
    }
}
