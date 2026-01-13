# NoodleSwap Architecture Documentation

## Overview

NoodleSwap is a decentralized prediction game platform that combines automated market making (AMM) principles with prediction markets, incorporating a comprehensive staking and governance system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Web3 Frontend / DApp)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      The Graph Subgraph                         │
│              (Event Indexing & Query Layer)                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Smart Contracts Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ GameFactory  │  │ NoodleStaking│  │NoodleLocking │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Game      │  │  StakeInfo   │  │  LockInfo    │         │
│  │  (AMM Pool)  │  │   (Pools)    │  │   (Pools)    │         │
│  └──────┬───────┘  └──────────────┘  └──────────────┘         │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  GameERC20   │  │NoodleToken   │  │LockNoodleToken│        │
│  │ (LP Tokens)  │  │   (NOODLE)   │  │ (lockNOODLE) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Game Contract

**Purpose**: Individual prediction game with AMM-based market making

**Key Features**:
- Automated Market Maker (AMM) for dynamic odds
- Multi-option prediction markets
- Liquidity provision with LP tokens
- Challenge and voting mechanism
- NFT-based proof of participation

**State Variables**:
```solidity
// Time configuration
uint256 confirmResultSlot = 300;  // Result confirmation period
uint256 confirmSlot = 300;        // Challenge period
uint256 voteSlot = 300;           // Voting period

// Game state
address creator;                   // Game creator
address token;                     // Betting token
uint8 originOption;               // Initially submitted result
uint8 challengeOption;            // Challenged option
uint8 winOption;                  // Final winning option
uint256 endTime;                  // Game end time

// Options data
OptionDataStruct[] options;       // Market options
mapping(uint256 => PlayInfoStruct) playInfoMap;  // User positions
```

**AMM Formula**:
The contract uses a constant product formula similar to Uniswap, but adapted for multi-option markets:

```
For each option i:
  odds_i = (total_liquidity / option_i_liquidity) * (1 - fee_rate)
```

### 2. GameFactory Contract

**Purpose**: Factory pattern for creating new games and managing deployments

**Responsibilities**:
- Deploy new Game contracts
- Register games with NoodleStaking
- Maintain game registry
- Configure initial parameters

**Flow**:
```
User → createGame() → Deploy Game Contract → Transfer Initial Liquidity → 
       Register with Staking → Emit GameCreated Event
```

### 3. NoodleStaking Contract

**Purpose**: LP token staking for NOODLE rewards

**Architecture**:
```
NoodleStaking
├── Multiple StakeInfo (one per LP token)
│   ├── lastRewardBlock
│   ├── accNoodlePerShare
│   ├── noodlePerBlock
│   └── endTimeSec
└── UserInfo mapping per pool
    ├── amount (LP tokens deposited)
    └── rewardDebt (for reward calculation)
```

**Reward Calculation**:
```solidity
// Pending reward formula
pendingReward = (user.amount * pool.accNoodlePerShare / 1e12) - user.rewardDebt

// Pool update formula
multiplier = currentBlock - pool.lastRewardBlock
noodleReward = multiplier * pool.noodlePerBlock
pool.accNoodlePerShare += (noodleReward * 1e12) / lpSupply
```

### 4. NoodleLocking Contract

**Purpose**: Token locking for governance voting power

**Architecture**:
```
NoodleLocking
├── LockingPoolInfo
│   ├── lastRewardBlock
│   ├── accNoodlePerShare
│   ├── noodlePerBlock
│   └── startTimeSec
└── LockedBalance mapping per user
    ├── amount (locked NOODLE)
    ├── end (unlock timestamp)
    └── start (lock start)
```

**Key Mechanisms**:
- **Lock Creation**: Users lock NOODLE, receive lockNOODLE (1:1)
- **Lock Duration**: Flexible, up to 4 years (MAXTIME)
- **Reward Calculation**: Based on lock duration and percentage of total locked
- **Unlock**: Only possible after lock period expires

**Reward Formula**:
```solidity
lockedBlocks = (user.end - user.start) / blockSpeed
lockedPercentage = user.amount / totalLockedAmount
pendingReward = noodlePerBlock * lockedBlocks * lockedPercentage
```

### 5. Token System

#### NOODLE Token
- **Type**: ERC20
- **Purpose**: Governance, rewards, staking collateral
- **Use Cases**:
  - Stake to become result submitter
  - Challenge incorrect results
  - Staking pool rewards

#### lockNOODLE Token
- **Type**: ERC20 (mintable/burnable)
- **Purpose**: Voting rights representation
- **Mechanics**:
  - Minted 1:1 when NOODLE is locked
  - Non-transferable during lock period
  - Burned when unlocking
  - Used for governance voting

#### LP Tokens (GameERC20)
- **Type**: ERC20 per game
- **Purpose**: Represent liquidity provider share
- **Features**:
  - Permit (EIP-2612) support
  - Domain separator for signatures
  - Transferable

#### PlayNFT
- **Type**: ERC721
- **Purpose**: Proof of participation in games
- **Features**:
  - One NFT per bet
  - Required for claiming rewards
  - Tracks bet position

## Data Flow

### Game Lifecycle

```
1. Game Creation
   Factory.createGame() → Deploy Game → Initialize Options → 
   Add Initial Liquidity → Register Staking Pool

2. Active Game Phase
   Users → placeGame() → Update AMM State → Mint PlayNFT → 
   Emit Events → Index in Subgraph

3. Liquidity Provision
   Users → addLiquidity() → Update Pool → Mint LP Tokens → 
   Users → deposit() in Staking → Earn Rewards

4. Game End
   Time Expires → Result Submission Period Begins

5. Result Submission
   Submitter → stakeGame() → Deposit NOODLE → openGame(option) →
   Confirmation Period Begins

6. Challenge Phase (Optional)
   Challenger → challengeGame(option) → Deposit NOODLE → 
   Voting Period Begins → Community Votes

7. Settlement
   If No Challenge: Original result stands after confirmSlot
   If Challenge: Voting determines winner after voteSlot

8. Reward Distribution
   Winners → getAward() → Burn NFT → Transfer Winnings
   Voters → getVoteAward() → Claim Voting Rewards
   LPs → removeLiquidity() → Share Pool Profits/Losses
```

### Staking Flow

```
LP Holder
    │
    ├─→ deposit(lpToken, amount)
    │      ├─→ Update pool rewards
    │      ├─→ Calculate pending rewards
    │      ├─→ Transfer pending to user
    │      ├─→ Transfer LP from user
    │      └─→ Update user state
    │
    ├─→ harvest(lpToken)
    │      ├─→ Update pool rewards
    │      ├─→ Calculate pending
    │      └─→ Transfer NOODLE to user
    │
    └─→ withdraw(lpToken, amount)
           ├─→ Update pool rewards
           ├─→ Calculate pending rewards
           ├─→ Transfer pending to user
           ├─→ Update user state
           └─→ Transfer LP to user
```

### Locking Flow

```
NOODLE Holder
    │
    ├─→ createLock(amount, unlockTime)
    │      ├─→ Transfer NOODLE to contract
    │      ├─→ Mint lockNOODLE to user
    │      ├─→ Record lock details
    │      └─→ Update total locked amount
    │
    ├─→ increaseAmount(amount)
    │      ├─→ Transfer additional NOODLE
    │      ├─→ Mint additional lockNOODLE
    │      └─→ Update lock amount
    │
    ├─→ increaseUnlockTime(newTime)
    │      ├─→ Extend lock period
    │      └─→ Update unlock time
    │
    └─→ withdraw()
           ├─→ Check lock expired
           ├─→ Calculate rewards
           ├─→ Transfer NOODLE + rewards
           ├─→ Burn lockNOODLE
           └─→ Clear lock state
```

## Gas Optimization Strategies

### 1. Storage Packing
```solidity
// Packed into single slot (32 bytes)
address public creator;           // 20 bytes
uint8 public originOption;        // 1 byte
uint8 public challengeOption;     // 1 byte
uint8 public winOption;           // 1 byte
uint8 private voteFlag;           // 1 byte
uint8 private receiveFlag;        // 1 byte
uint8 public feeRate;             // 1 byte
// Total: 26 bytes (fits in 1 slot)
```

### 2. Immutable Variables
```solidity
// Not stored in contract storage
address public immutable noodleToken;
address public immutable lockNoodleToken;
address public immutable playNFT;
```

### 3. Unchecked Arithmetic
```solidity
for (uint8 i = 0; i < len; ) {
    // ... operations ...
    unchecked { ++i; }  // Save gas on overflow check
}
```

### 4. Efficient Loops
- Cache array length
- Minimize storage reads
- Use memory variables for repeated access

## Security Considerations

### 1. Reentrancy Protection
- Transfer tokens after state updates
- Use `TransferHelper.safeTransferFrom()`
- Follow checks-effects-interactions pattern

### 2. Time-Based Logic
- Multiple configurable time slots
- Clear state transitions
- Timestamp validation

### 3. Access Control
- Owner-only functions for critical operations
- Require statements for authorization
- Stake requirements for privileged actions

### 4. Integer Overflow/Underflow
- Solidity 0.8.x built-in protection
- Unchecked only where safe
- SafeMath library for additional safety

### 5. Challenge Mechanism
- Economic incentives for honest reporting
- Community voting for dispute resolution
- Slashing for incorrect submissions

## Event System

All contracts emit comprehensive events for:
- Off-chain indexing (The Graph)
- User interface updates
- Transaction verification
- Historical record

Example event structure:
```solidity
event _placeGame(
    address indexed game,
    address indexed token,
    address indexed sender,
    uint8[] options,
    uint256[] optionNum,
    uint256[] tokenIds,
    uint256[] currentOptions
);
```

## Upgrade Strategy

The contracts are **not upgradeable** by design:
- Immutable once deployed
- New versions deployed separately
- Migration through user action
- Factory can deploy new versions

## Testing Strategy

### Unit Tests
- Individual contract functions
- Edge cases and boundary conditions
- Error handling

### Integration Tests
- Multi-contract interactions
- End-to-end workflows
- State transitions

### Coverage Areas
- Game creation and lifecycle
- AMM calculations
- Staking rewards
- Locking mechanics
- Voting processes

## Future Enhancements

Potential areas for improvement:
1. **Multi-token Support**: Support multiple betting tokens per game
2. **Dynamic Fee Adjustment**: Market-driven fee rates
3. **Advanced AMM**: Concentrated liquidity, custom curves
4. **Cross-chain**: Deploy on multiple chains
5. **Governance**: DAO-controlled parameters
6. **Flash Loans**: Liquidity optimization

---

This architecture enables a fully decentralized prediction market platform with strong economic incentives, community governance, and transparent operation.
