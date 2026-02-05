// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract MockUpgradeableBeacon is UpgradeableBeacon {
    constructor(
        address implementation_,
        address initialOwner
    ) UpgradeableBeacon(implementation_, initialOwner) {}
}
