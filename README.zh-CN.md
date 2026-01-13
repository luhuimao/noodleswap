# NoodleSwap 🍜

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.3-blue)](https://docs.soliditylang.org/)

[English](./README.md) | 简体中文

NoodleSwap 是一个建立在以太坊上的去中心化预测游戏平台，将自动做市商（AMM）原理与预测市场相结合。用户可以创建和参与预测游戏、提供流动性、质押代币获得奖励，并通过投票机制参与去中心化治理。

## 🌟 核心功能

### 1. **预测游戏平台**
- 创建自定义多选项预测游戏
- 基于 AMM 机制的市场驱动赔率
- 带有挑战和投票系统的自动结算
- 基于 NFT 的参与证明

### 2. **流动性提供**
- 向游戏池添加/移除流动性
- 获得代表池份额的 LP 代币
- 动态赔率的自动做市
- 手续费分配给流动性提供者

### 3. **代币质押（NoodleStaking）**
- 质押 LP 代币以赚取 NOODLE 奖励
- 时间加权奖励分配
- 支持多个质押池
- 实时奖励计算

### 4. **代币锁仓（NoodleLocking）**
- 锁定 NOODLE 代币获得投票权
- 根据锁仓时长获得奖励
- 获得 lockNOODLE 代币（类似 veToken）
- 灵活的锁仓期限（最长 4 年）

### 5. **治理与挑战系统**
- 质押 NOODLE 代币成为结果提交者
- 挑战不正确的结果
- 使用 lockNOODLE 进行社区投票
- 激励准确的结果报告

### 6. **The Graph 集成**
- 游戏事件的实时索引
- 历史数据查询
- 用户活动追踪
- 全面的 GraphQL API

## 📚 架构

### 核心合约

```
contracts/
├── Game.sol                    # 主游戏合约，包含 AMM 逻辑
├── GameFactory.sol             # 创建新游戏的工厂合约
├── GameERC20.sol              # LP 代币实现
├── NoodleTokenERC20.sol       # 主治理代币
├── LockNoodleTokenERC20.sol   # 投票托管代币
├── NoodleStaking.sol          # LP 质押获得奖励
├── NoodleLocking.sol          # 代币锁仓用于治理
├── PlayNFT.sol                # 参与证明 NFT
└── ConfigurableParametersContract.sol  # 全局参数配置
```

### 代币系统

- **NOODLE**：主治理和奖励代币
- **lockNOODLE**：用于治理权的投票托管 NOODLE
- **LP 代币**：代表流动性池份额（每个游戏）
- **PlayNFT**：游戏参与证明

## 🚀 快速开始

### 前置要求

- Node.js v14+
- npm 或 yarn
- Hardhat
- Foundry（可选）

### 安装

```bash
# 克隆仓库
git clone https://github.com/NoodleDAO/noodleswap.git
cd noodleswap

# 安装依赖
npm install
```

### 编译合约

```bash
# 使用 Hardhat
npm run compile

# 使用 Foundry
forge build
```

### 运行测试

```bash
# 使用 Hardhat
npm test

# 运行特定测试
npx hardhat test test/GameFactory.spec.ts
```

### 部署合约

```bash
# 部署到本地网络
npm run dev
npm run deploy:ganache

# 部署到测试网（Rinkeby）
npm run deploy:rinkeby

# 部署到主网
npm run deploy:mainnet
```

## 📖 工作原理

### 1. 创建游戏

```solidity
// 工厂合约创建新游戏
gameFactory.createGame(
    tokenAddress,      // 用于下注的 ERC20 代币
    "谁会获胜？",       // 游戏名称
    "WIN",            // 简称
    ["队伍 A", "队伍 B"], // 选项
    [1000, 1000],     // 初始赔率
    "https://...",    // 结果来源
    endTime           // 游戏结束时间戳
)
```

### 2. 下注

用户可以对游戏结果下注：
- 使用 ERC20 代币下注
- 每次下注都会铸造一个 PlayNFT 作为证明
- 赔率根据 AMM 公式调整
- 收取 0.5% 手续费用于奖励

### 3. 提供流动性

```solidity
// 向游戏添加流动性
game.addLiquidity(
    amount,      // 代币数量
    spread,      // 滑点容忍度
    deadline     // 交易截止时间
)
// 获得 LP 代币
```

### 4. 质押 LP 代币

```solidity
// 质押 LP 代币以获得 NOODLE 奖励
noodleStaking.deposit(lpToken, amount)

// 收获奖励
noodleStaking.harvest(lpToken)

// 提取
noodleStaking.withdraw(lpToken, amount)
```

### 5. 锁仓参与治理

```solidity
// 锁定 NOODLE 代币
noodleLocking.createLock(amount, unlockTime)

// 获得 lockNOODLE 代币
// 用于对游戏结果进行投票
```

### 6. 结果提交与挑战

**提交结果：**
```solidity
// 质押 NOODLE 提交结果
game.stakeGame(deadline)
game.openGame(winningOption)
```

**挑战结果：**
```solidity
// 挑战不正确的结果
game.challengeGame(correctOption)
```

**社区投票：**
```solidity
// 使用 lockNOODLE 投票
game.addVote(optionNumber)
```

## 🔍 The Graph 子图

项目包含一个全面的子图，用于索引所有游戏活动。

### 模式实体

- **ConfigAddress**：平台配置
- **Game & GameInfo**：游戏详情和状态
- **BetInfo**：用户下注记录
- **NFTInfo**：PlayNFT 追踪
- **VoteInfo**：投票记录
- **NoodleStaking**：质押池数据
- **NoodleLocking**：锁仓池数据
- **StakeUser**：用户质押仓位
- **LockUser**：用户锁仓仓位

### 子图命令

```bash
# 初始化子图
npm run graph:codegen
npm run graph:build

# 部署到本地 Graph 节点
npm run graph:create-localhost
npm run graph:deploy-localhost

# 部署到托管服务
npm run graph:deploy-bsc
npm run graph:deploy-rinkeby
```

### 查询示例

```graphql
# 获取所有活跃游戏
{
  gameInfos(where: { _endSec_gt: "1640000000" }) {
    id
    _gameName
    _optionName
    _endSec
    _winOption
  }
}

# 获取用户下注
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

# 获取质押仓位
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

## 🧪 测试

项目包含全面的测试套件：

```
test/
├── ConfigAddress.spec.ts           # 配置测试
├── ERC20Faucet.spec.ts            # 水龙头测试
├── GameERC20.spec.ts              # LP 代币测试
├── GameFactory.spec.ts            # 工厂测试
├── LockNoodleTokenERC20.spec.ts   # lockNOODLE 测试
└── NoodleLocking.spec.ts          # 锁仓机制测试
```

运行所有测试：
```bash
npm test
```

运行覆盖率测试：
```bash
npm run coverage
```

## 📊 Gas 优化

合约包含多项 Gas 优化：

- **存储打包**：变量打包到存储槽中
- **不可变变量**：用于工厂设置的地址
- **无检查算术**：在不可能溢出的地方
- **高效循环**：最小化存储读取
- **事件发射**：索引参数以实现高效过滤

## 🔐 安全特性

- **滑点保护**：截止时间和滑点参数
- **重入保护**：安全的代币转账
- **访问控制**：仅所有者函数
- **时间锁**：可执行的游戏时间线
- **挑战机制**：去中心化结果验证

## 🛠️ 开发脚本

```bash
# 编译
npm run compile              # 编译合约
./compile.sh                # 备用编译脚本

# 测试
npm test                    # 运行所有测试
npm run coverage           # 生成覆盖率报告

# 部署
./deploy.sh                # 部署所有合约
./deploy-configadress.sh   # 部署配置合约

# 子图
./init-subgraph.sh        # 初始化子图
./generate-abis.sh        # 为子图生成 ABI

# Docker
./docker-compose-up.sh    # 启动本地开发环境
./init-docker-compose.sh  # 初始化 Docker 服务

# 本地区块链
npm run dev               # 启动 Hardhat 节点
./ganache.sh             # 启动 Ganache
```

## 📝 合约地址

部署地址配置在 `.config.ts` 中（不在 git 中跟踪）。

示例结构：
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

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件。

## 🔗 链接

- **仓库**：https://github.com/NoodleDAO/noodleswap
- **文档**：[即将推出]
- **Discord**：[即将推出]
- **Twitter**：[即将推出]

## ⚠️ 免责声明

这是实验性软件。使用风险自负。合约尚未经过正式审计。在没有适当安全审计的情况下，请勿在生产环境中使用真实资金。

## 📞 支持

如有问题和支持需求：
- 在 GitHub 上提出 issue
- 加入我们的 Discord 社区
- 联系开发团队

---

由 NoodleDAO 团队用 ❤️ 打造
