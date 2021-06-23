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
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }
    struct StakeInfo {
        uint256 lastRewardBlock; // Last block number that NOODLEs distribution occurs.
        uint256 accNoodlePerShare; // Accumulated NOODLEs per share, times 1e12. See below.
        uint256 noodlePerBlock; // Accumulated NOODLEs per share, times 1e12. See below.
    }
    // The NOODLE TOKEN!
    INoodleGameERC20 public noodle;
    // NOODLE tokens created per block.
    address public owner;
    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    // Info of each pool.
    // INoodleGameERC20 lpToken; // gameToken
    mapping(INoodleGameERC20 => StakeInfo) public stakeInfoMap;
    // Info of each user that stakes LP tokens.
    mapping(INoodleGameERC20 => mapping(address => UserInfo)) public userInfoMap;
    event Deposit(address indexed user, address indexed lpToken, uint256 amount);
    event Withdraw(address indexed user, address indexed lpToken, uint256 amount);
    event EmergencyWithdraw(address indexed user, address indexed lpToken, uint256 amount);

    constructor(INoodleGameERC20 _noodle, address _owner) {
        noodle = _noodle;
        owner = _owner;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(INoodleGameERC20 lpToken, uint256 _noodlePerBlock) public {
        console.log('xxxxx:', msg.sender, owner);
        require(msg.sender == address(owner), 'not owner');
        uint256 lastRewardBlock = block.number;
        stakeInfoMap[lpToken] = StakeInfo({
            lastRewardBlock: lastRewardBlock,
            accNoodlePerShare: 0,
            noodlePerBlock: _noodlePerBlock
        });
    }

    // View function to see pending NOODLEs on frontend.
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

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(INoodleGameERC20 lpToken) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        //游戏结束就不再产出
        // if (lpToken.endTime() > block.timestamp) {
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
    }

    // Deposit LP tokens to NoodleStaking for NOODLE allocation.
    function deposit(INoodleGameERC20 lpToken, uint256 _amount) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][msg.sender];
        updatePool(lpToken);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accNoodlePerShare).div(1e12).sub(user.rewardDebt);
            safeNoodleTransfer(msg.sender, pending);
        }
        lpToken.transferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accNoodlePerShare).div(1e12);
        emit Deposit(msg.sender, address(lpToken), _amount);
    }

    // Withdraw LP tokens from NoodleStaking.
    function withdraw(INoodleGameERC20 lpToken, uint256 _amount) public {
        StakeInfo storage pool = stakeInfoMap[lpToken];
        UserInfo storage user = userInfoMap[lpToken][msg.sender];
        require(user.amount >= _amount, 'withdraw: not good');
        updatePool(lpToken);
        uint256 pending = user.amount.mul(pool.accNoodlePerShare).div(1e12).sub(user.rewardDebt);
        safeNoodleTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accNoodlePerShare).div(1e12);
        lpToken.transfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, address(lpToken), _amount);
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
