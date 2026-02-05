// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IENSRegistrar.sol";
import "./interfaces/IPot.sol";

contract PotFactory {
    address public immutable POT_BEACON;
    address public immutable TOKEN;

    IENSRegistrar public immutable REGISTRAR;

    constructor(address beacon, address _registrar, address token) {
        POT_BEACON = beacon;
        REGISTRAR = IENSRegistrar(_registrar);
        TOKEN = token;
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
            quorum
        );

        REGISTRAR.issueSubnodeRecord(
            0x0,
            label,
            potAddress,
            msg.sender,
            keys,
            values
        );

        IPot(potAddress).initialize(
            goal,
            deadline,
            quorum,
            manager,
            recipient,
            TOKEN
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
        uint16 quorum
    ) internal pure returns (string[] memory keys, string[] memory values) {
        keys = new string[](4);
        values = new string[](4);

        keys[0] = "pot:version";
        values[1] = "1";

        keys[1] = "pot:goal";
        values[1] = Strings.toString(goal);

        keys[2] = "pot:deadline";
        values[2] = Strings.toString(deadline);

        keys[3] = "pot:quorum";
        values[3] = Strings.toString(quorum);
    }
}
