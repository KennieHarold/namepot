import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NamepotModule", (m) => {
  const nameWrapper = m.getParameter("nameWrapper");
  const resolver = m.getParameter("resolver");
  const rootNode = m.getParameter("rootNode");
  const token = m.getParameter("token");

  // Deploy Pot implementation
  const potImplementation = m.contract("Pot", [], {
    id: "PotImplementation",
  });

  // Deploy UpgradeableBeacon with Pot implementation
  const beacon = m.contract(
    "MockUpgradeableBeacon",
    [potImplementation, m.getAccount(0)],
    {
      id: "PotBeacon",
    },
  );

  // Deploy ENSRegistrar
  const registrar = m.contract(
    "ENSRegistrar",
    [nameWrapper, resolver, rootNode],
    {
      id: "ENSRegistrar",
    },
  );

  // Deploy PotFactory
  const factory = m.contract("PotFactory", [beacon, registrar, token], {
    id: "PotFactory",
  });

  return {
    potImplementation,
    beacon,
    registrar,
    factory,
  };
});
