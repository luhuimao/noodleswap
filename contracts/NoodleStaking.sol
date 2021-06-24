// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import 'hardhat/console.sol';

import './libraries/openzeppelin/contracts/utils/math/SafeMath.sol';
import './interfaces/INoodleGameERC20.sol';

import './interfaces/IGameFactory.sol';

contract NoodleStaking {
    using SafeMath for uint256;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // 提供的lpToken的数量
        uint256 rewardDebt; // 收益起始点
    }
    struct StakeInfo {
        uint256 lastRewardBlock; // Last block number that NOODLEs distribution occurs.
        uint256 accNoodlePerShare; // 单位份额的收益基数
        uint256 noodlePerBlock; // 每区块产出数量,因为是个比例,放大1e12倍解决小数问题
        uint256 endTimeSec; // 奖励结束区块
    }
    // The NOODLE TOKEN!
    INoodleGameERC20 public noodle; //治理代币,产出币
    // 控制谁能添加质押游戏对
    address public owner;
    // 质押游戏对map
    mapping(INoodleGameERC20 => StakeInfo) public stakeInfoMap;
    // Info of each user that stakes LP tokens.
    mapping(INoodleGameERC20 => mapping(address => UserInfo)) public userInfoMap;
    event EventDeposit(address indexed lpToken, address indexed user, uint256 amount);
    event EventWithdraw(address indexed lpToken, address indexed user, uint256 amount);
    event EventHarvest(address indexed lpToken, address indexed user, uint256 amount);
    event EventStakeInfoAdd(address indexed lpToken, uint256 noodlePerBlock, uint256 endTimeSec);
    event EventUpdatePool(address indexed lpToken, uint256 accNoodlePerShare);

    constructor(INoodleGameERC20 _noodle, address _owner) {
        noodle = _noodle;
        owner = _owner;
    }

    // modifier ensureEnd(uint256 endTimeSec) {
    //     require(endTimeSec >= block.timestamp, 'TIME END');
    //     _;
    // }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function addStakeInfo(
        INoodleGameERC20 lpToken,
        uint256 _noodlePerBlock,
        uint256 _endTimeSec
    ) public {
        require(msg.sender == address(owner), 'not owner');
        require(stakeInfoMap[lpToken].lastRewardBlock == 0, 'already added');
        require(_endTimeSec > block.timestamp, 'end time err');
        uint256 lastRewardBlock = block.number;
        stakeInfoMap[lpToken] = StakeInfo({
            lastRewardBlock: lastRewardBlock,
            endTimeSec: _endTimeSec,
            accNoodlePerShare: 0,
            noodlePerBlock: _noodlePerBlock
        });
        emit EventStakeInfoAdd(address(lpToken), _noodlePerBlock, _endTimeSec);
    }

    // 当前未领取的收益
    function getPendingReward(INoodleGameERC20 lpToken, address _user) external view returns (uint256) {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][_user];
        uint256 accNoodlePerShare = pool.accNoodlePerShare;
        uint256 lpSupply = lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = block.number - pool.lastRewardBlock;
            uint256 noodleReward = multiplier.mul(pool.noodlePerBlock); //.mul(pool.allocPoint).div(totalAllocPoint);
            accNoodlePerShare = accNoodlePerShare.add(noodleReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accNoodlePerShare).div(1e12).sub(user.rewardDebt);
    }

    // 更新池子收益数据
    function updateStakeInfo(INoodleGameERC20 lpToken) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        //游戏结束
        if (pool.endTimeSec <= block.timestamp) {
            return;
        }
        //游戏结束就不再产出
        // if (lpToken.endTime() > block.timestamp) {
        //     pool.noodlePerBlock = 0;
        //     return;
        // }
        uint256 lpSupply = lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 noodleReward = multiplier.mul(pool.noodlePerBlock); //.mul(pool.allocPoint).div(totalAllocPoint);
        // noodle.mint(address(this), noodleReward);
        pool.accNoodlePerShare = pool.accNoodlePerShare.add(noodleReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
        emit EventUpdatePool(address(lpToken), pool.accNoodlePerShare);
    }

    // 存入lp
    function deposit(INoodleGameERC20 lpToken, uint256 _amount) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][msg.sender];
        require(pool.endTimeSec > block.timestamp, 'end time err');
        updateStakeInfo(lpToken);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accNoodlePerShare).div(1e12).sub(user.rewardDebt);
            safeNoodleTransfer(msg.sender, pending);
            emit EventHarvest(address(lpToken), msg.sender, pending);
        }
        lpToken.transferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accNoodlePerShare).div(1e12);
        emit EventDeposit(address(lpToken), msg.sender, _amount);
    }

    // 赎回lp
    function withdraw(INoodleGameERC20 lpToken, uint256 _amount) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][msg.sender];
        require(user.amount >= _amount, 'withdraw: not good');
        updateStakeInfo(lpToken);
        uint256 pending = user.amount.mul(pool.accNoodlePerShare).div(1e12).sub(user.rewardDebt);
        safeNoodleTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accNoodlePerShare).div(1e12);
        lpToken.transfer(address(msg.sender), _amount);
        emit EventHarvest(address(lpToken), msg.sender, pending);
        emit EventWithdraw(address(lpToken), msg.sender, _amount);
    }

    // 主动收获
    function harvest(INoodleGameERC20 lpToken) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][msg.sender];
        if (user.amount > 0) {
            updateStakeInfo(lpToken);
            uint256 pending = user.amount.mul(pool.accNoodlePerShare).div(1e12).sub(user.rewardDebt);
            safeNoodleTransfer(msg.sender, pending);
            user.rewardDebt = user.amount.mul(pool.accNoodlePerShare).div(1e12);
            emit EventHarvest(address(lpToken), msg.sender, pending);
        }
    }

    // Safe noodle transfer function, just in case if rounding error causes pool to not have enough NOODLEs.
    function safeNoodleTransfer(address _to, uint256 _amount) internal {
        uint256 noodleBal = noodle.balanceOf(address(this));
        if (_amount > noodleBal) {
            noodle.transfer(_to, noodleBal);
        } else {
            noodle.transfer(_to, _amount);
        }
    }
}
