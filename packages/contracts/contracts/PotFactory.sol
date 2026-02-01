// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IENSRegistrar.sol";

contract PotFactory {
    address public immutable POT_BEACON;

    IENSRegistrar public registrar;

    constructor(address beacon, address _registrar) {
        POT_BEACON = beacon;
        registrar = IENSRegistrar(_registrar);
    }

    event PotCreated(bytes32 indexed hash, address indexed contractAddress);

    function createPot(bytes32 hash, string calldata label) external {
        bytes memory bytecode = getMarketBytecode(POT_BEACON);
        address computedAddress = Create2.computeAddress(
            hash,
            keccak256(bytecode)
        );

        require(
            computedAddress.code.length == 0,
            "Create2: address already in use"
        );
        address contractAddress = Create2.deploy(0, hash, bytecode);

        string[] memory keys = new string[](1);
        string[] memory values = new string[](1);

        keys[0] = "pot:version";
        values[1] = "1";

        registrar.issueSubnodeRecord(
            0x0,
            label,
            contractAddress,
            msg.sender,
            keys,
            values
        );

        emit PotCreated(hash, contractAddress);
    }

    function getMarketBytecode(
        address impl
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                type(BeaconProxy).creationCode,
                abi.encode(impl, "")
            );
    }
}
