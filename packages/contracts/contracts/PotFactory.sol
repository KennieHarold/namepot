// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IENSRegistrar.sol";
import "./interfaces/IPot.sol";

contract PotFactory {
    address public immutable POT_BEACON;
    address public immutable token;

    IENSRegistrar public immutable registrar;

    constructor(address beacon, address _registrar, address _token) {
        POT_BEACON = beacon;
        registrar = IENSRegistrar(_registrar);
        token = _token;
    }

    event PotCreated(bytes32 indexed hash, address indexed potAddress);

    function createPot(
        bytes32 hash,
        string calldata label,
        uint256 goal,
        uint128 deadline,
        uint16 quorum,
        address manager,
        address recipient
    ) external {
        bytes memory bytecode = _getMarketBytecode(POT_BEACON);
        address computedAddress = Create2.computeAddress(
            hash,
            keccak256(bytecode)
        );

        require(
            computedAddress.code.length == 0,
            "Create2: address already in use"
        );
        address potAddress = Create2.deploy(0, hash, bytecode);

        (string[] memory keys, string[] memory values) = _generatePotMetadata(
            goal,
            deadline,
            quorum,
            manager,
            recipient
        );

        bytes32 node = registrar.issueSubnodeRecord(
            label,
            potAddress,
            potAddress,
            keys,
            values
        );

        IPot(potAddress).initialize(
            node,
            registrar.getResolver(),
            goal,
            deadline,
            quorum,
            manager,
            recipient,
            token
        );

        emit PotCreated(hash, potAddress);
    }

    function _getMarketBytecode(
        address impl
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                type(BeaconProxy).creationCode,
                abi.encode(impl, "")
            );
    }

    function _generatePotMetadata(
        uint256 goal,
        uint128 deadline,
        uint16 quorum,
        address manager,
        address recipient
    ) internal pure returns (string[] memory keys, string[] memory values) {
        keys = new string[](6);
        values = new string[](6);

        keys[0] = "pot:version";
        values[0] = "1";

        keys[1] = "pot:goal";
        values[1] = Strings.toString(goal);

        keys[2] = "pot:deadline";
        values[2] = Strings.toString(deadline);

        keys[3] = "pot:quorum";
        values[3] = Strings.toString(quorum);

        keys[4] = "pot:manager";
        values[4] = Strings.toHexString(manager);

        keys[5] = "pot:recipient";
        values[5] = Strings.toHexString(recipient);
    }
}
