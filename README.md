# NoodleSwap 🍜

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.3-blue)](https://docs.soliditylang.org/)

NoodleSwap is a decentralized prediction game platform built on Ethereum, combining automated market making (AMM) principles with prediction markets. Users can create and participate in prediction games, provide liquidity, stake tokens for rewards, and participate in decentralized governance through voting mechanisms.

## 🌟 Key Features

### 1. **Prediction Game Platform**
- Create custom prediction games with multiple options
- Market-driven odds based on AMM mechanism
- Automated settlement with challenge and voting system
- NFT-based proof of participation

### 2. **Liquidity Provision**
- Add/remove liquidity to game pools
- Earn LP tokens representing pool share
- Automated market making for dynamic odds
- Fee distribution to liquidity providers

### 3. **Token Staking (NoodleStaking)**
- Stake LP tokens to earn NOODLE rewards
- Time-weighted reward distribution
- Multiple staking pools support
- Real-time reward calculation

### 4. **Token Locking (NoodleLocking)**
- Lock NOODLE tokens for voting power
- Earn rewards based on lock duration
- Receive lockNOODLE tokens (veNOODLE-style)
- Flexible lock period (up to 4 years)

### 5. **Governance & Challenge System**
- Stake NOODLE tokens to become result submitter
- Challenge incorrect results
- Community voting with lockNOODLE
- Incentivized accurate reporting

### 6. **The Graph Integration**
- Real-time indexing of game events
- Historical data queries
- User activity tracking
- Comprehensive GraphQL API

## 📚 Architecture

### Core Contracts

```
contracts/
├── Game.sol                    # Main game contract with AMM logic
├── GameFactory.sol             # Factory for creating new games
├── GameERC20.sol              # LP token implementation
├── NoodleTokenERC20.sol       # Main governance token
├── LockNoodleTokenERC20.sol   # Vote-escrowed token
├── NoodleStaking.sol          # LP staking for rewards
├── NoodleLocking.sol          # Token locking for governance
├── PlayNFT.sol                # NFT proof of participation
└── ConfigurableParametersContract.sol  # Global parameters
```

### Token System

- **NOODLE**: Main governance and reward token
- **lockNOODLE**: Vote-escrowed NOODLE for governance rights
- **LP Tokens**: Represent liquidity pool shares (per game)
- **PlayNFT**: Proof of game participation

## 🚀 Getting Started

### Prerequisites

- Node.js v14+
- npm or yarn
- Hardhat
- Foundry (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/NoodleDAO/noodleswap.git
cd noodleswap

# Install dependencies
npm install
```

### Compile Contracts

```bash
# Using Hardhat
npm run compile

# Using Foundry
forge build
```

### Run Tests

```bash
# Using Hardhat
npm test

# Run specific test
npx hardhat test test/GameFactory.spec.ts
```

### Deploy Contracts

```bash
# Deploy to localhost
npm run dev
npm run deploy:ganache

# Deploy to testnet (Rinkeby)
npm run deploy:rinkeby

# Deploy to mainnet
npm run deploy:mainnet
```

## 📖 How It Works

### 1. Creating a Game

```solidity
// Factory creates a new game
gameFactory.createGame(
    tokenAddress,      // ERC20 token for bets
    "Who will win?",   // Game name
    "WIN",            // Short name
    ["Team A", "Team B"], // Options
    [1000, 1000],     // Initial odds
    "https://...",    // Result source
    endTime           // Game end timestamp
)
```

### 2. Placing Bets

Users can place bets on game outcomes:
- Bets are placed with ERC20 tokens
- Each bet mints a PlayNFT as proof
- Odds adjust based on AMM formula
- 0.5% fee collected for rewards

### 3. Providing Liquidity

```solidity
// Add liquidity to a game
game.addLiquidity(
    amount,      // Token amount
    spread,      // Slippage tolerance
    deadline     // Transaction deadline
)
// Receive LP tokens
```

### 4. Staking LP Tokens

```solidity
// Stake LP tokens for NOODLE rewards
noodleStaking.deposit(lpToken, amount)

// Harvest rewards
noodleStaking.harvest(lpToken)

// Withdraw
noodleStaking.withdraw(lpToken, amount)
```

### 5. Locking for Governance

```solidity
// Lock NOODLE tokens
noodleLocking.createLock(amount, unlockTime)

// Receive lockNOODLE tokens
// Use for voting on game results
```

### 6. Result Submission & Challenges

**Submit Result:**
```solidity
// Stake NOODLE to submit result
game.stakeGame(deadline)
game.openGame(winningOption)
```

**Challenge Result:**
```solidity
// Challenge incorrect result
game.challengeGame(correctOption)
```

**Community Voting:**
```solidity
// Vote with lockNOODLE
game.addVote(optionNumber)
```

## 🔍 The Graph Subgraph

The project includes a comprehensive subgraph for indexing all game activities.

### Schema Entities

- **ConfigAddress**: Platform configuration
- **Game & GameInfo**: Game details and state
- **BetInfo**: User bet records
- **NFTInfo**: PlayNFT tracking
- **VoteInfo**: Voting records
- **NoodleStaking**: Staking pool data
- **NoodleLocking**: Locking pool data
- **StakeUser**: User staking positions
- **LockUser**: User locking positions

### Subgraph Commands

```bash
# Initialize subgraph
npm run graph:codegen
npm run graph:build

# Deploy to local Graph node
npm run graph:create-localhost
npm run graph:deploy-localhost

# Deploy to hosted service
npm run graph:deploy-bsc
npm run graph:deploy-rinkeby
```

### Example Queries

```graphql
# Get all active games
{
  gameInfos(where: { _endSec_gt: "1640000000" }) {
    id
    _gameName
    _optionName
    _endSec
    _winOption
  }
}

# Get user bets
{
  betInfos(where: { sender: "0x..." }) {
    game {
      _gameName
    }
    options
    optionNum
    timestamp
  }
}

# Get staking positions
{
  stakeUsers(where: { owner: "0x..." }) {
    amount
    harvestAll
    stakeInfo {
      lpToken
      noodlePerBlock
    }
  }
}
```

## 🧪 Testing

The project includes comprehensive test suites:

```
test/
├── ConfigAddress.spec.ts           # Configuration tests
├── ERC20Faucet.spec.ts            # Faucet tests
├── GameERC20.spec.ts              # LP token tests
├── GameFactory.spec.ts            # Factory tests
├── LockNoodleTokenERC20.spec.ts   # lockNOODLE tests
└── NoodleLocking.spec.ts          # Locking mechanism tests
```

Run all tests:
```bash
npm test
```

Run with coverage:
```bash
npm run coverage
```

## 📊 Gas Optimization

The contracts include several gas optimizations:

- **Storage Packing**: Variables packed into storage slots
- **Immutable Variables**: For factory-set addresses
- **Unchecked Arithmetic**: Where overflow is impossible
- **Efficient Loops**: Minimized storage reads
- **Event Emissions**: Indexed parameters for efficient filtering

## 🔐 Security Features

- **Slippage Protection**: Deadline and spread parameters
- **Reentrancy Guards**: Safe token transfers
- **Access Control**: Owner-only functions
- **Time Locks**: Enforceable game timelines
- **Challenge Mechanism**: Decentralized result verification

## 🛠️ Development Scripts

```bash
# Compilation
npm run compile              # Compile contracts
./compile.sh                # Alternative compile script

# Testing
npm test                    # Run all tests
npm run coverage           # Generate coverage report

# Deployment
./deploy.sh                # Deploy all contracts
./deploy-configadress.sh   # Deploy config contract

# Subgraph
./init-subgraph.sh        # Initialize subgraph
./generate-abis.sh        # Generate ABIs for subgraph

# Docker
./docker-compose-up.sh    # Start local development environment
./init-docker-compose.sh  # Initialize Docker services

# Local blockchain
npm run dev               # Start Hardhat node
./ganache.sh             # Start Ganache
```

## 📝 Contract Addresses

Deployment addresses are configured in `.config.ts` (not tracked in git).

Example structure:
```typescript
export const config = {
  networks: {
    mainnet: {
      configAddress: "0x...",
      factoryAddress: "0x...",
      noodleToken: "0x...",
      stakingAddress: "0x...",
      // ...
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Repository**: https://github.com/NoodleDAO/noodleswap
- **Documentation**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Twitter**: [Coming Soon]

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. The contracts have not been formally audited. Do not use in production with real funds without proper security audits.

## 📞 Support

For questions and support:
- Open an issue on GitHub
- Join our Discord community
- Contact the development team

---

Built with ❤️ by the NoodleDAO team