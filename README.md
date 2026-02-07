# Namepot

A decentralized collaborative savings application built on Ethereum. Users create named savings pots registered as ENS subdomains (e.g., `sports-car.namepot.eth`), invite members to deposit ERC20 tokens toward a shared goal, and use quorum-based governance to approve fund distribution.

## How It Works

1. **Create a Pot** - A manager creates a pot with a name, goal amount, deadline, and quorum threshold. The pot is deployed as a smart contract and registered as an ENS subdomain.
2. **Add Members** - The manager invites members by their wallet addresses.
3. **Deposit Funds** - Members contribute ERC20 tokens before the deadline.
4. **Approve Execution** - After the deadline (and if the goal is met), members vote to approve releasing funds.
5. **Claim Payment** - Once quorum is reached, the recipient claims funds using a manager-signed QR code link.

Members can withdraw their contributions at any time, and the manager can close the pot when it's no longer needed.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.28, Hardhat, OpenZeppelin |
| Frontend | Next.js 16, React 19, Material-UI 7, Tailwind CSS |
| Blockchain Integration | Wagmi, Viem |
| Forms & Validation | React Hook Form, Yup |
| State Management | TanStack React Query |
| Package Manager | pnpm (monorepo) |

## Project Structure

```
packages/
  contracts/    # Solidity smart contracts (Hardhat)
  app/          # Next.js frontend application
```

### Contracts

- **Pot.sol** - Individual pot logic: deposits, withdrawals, approvals, payment claims
- **PotFactory.sol** - Factory for deploying new pots via Create2 + BeaconProxy pattern
- **ENSRegistrar.sol** - Registers pots as ENS subdomains and manages text records

### App

- `/` - Search for existing pots or create new ones
- `/create` - Form to configure and deploy a new pot
- `/pot/[id]` - Pot dashboard with deposit/withdraw, member management, and governance
- `/payment/[signature]` - Payment claim page accessed via QR code

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create `packages/app/.env.local`:

```
NEXT_PUBLIC_POT_FACTORY_ADDRESS=<deployed PotFactory address>
NEXT_PUBLIC_CURRENCY_TOKEN=<ERC20 token address>
NEXT_PUBLIC_ROOT_DOMAIN=namepot.eth
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
```

Create `packages/contracts/.env`:

```
INFURA_API_KEY=<your Infura API key>
DEPLOYER_PRIVATE_KEY=<deployer wallet private key>
ETHERSCAN_V2_API_KEY=<Etherscan API key>
```

### Run the App

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Run Contract Tests

```bash
pnpm test
```

### Deploy Contracts

```bash
pnpm contracts:deploy
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Build contracts and app |
| `pnpm test` | Run smart contract tests |
| `pnpm contracts:build` | Build contracts only |
| `pnpm contracts:test` | Test contracts only |
| `pnpm contracts:deploy` | Deploy contracts via Hardhat Ignition |
| `pnpm contracts:verify` | Verify contracts on Etherscan |
| `pnpm app:dev` | Start app dev server |
| `pnpm app:build` | Build app for production |
| `pnpm app:start` | Start production server |

## Network

Currently deployed on **Sepolia testnet** (chain ID: 11155111).

## License

UNLICENSED
