pragma solidity ^0.8.3;

import 'hardhat/console.sol';

import './libraries/openzeppelin/contracts/utils/math/SafeMath.sol';
import './interfaces/ILockNoodleERC20.sol';
import './interfaces/INoodleGameERC20.sol';

import './interfaces/IGameFactory.sol';
import './interfaces/INoodleLocking.sol';
import './interfaces/IERC20.sol';

contract NoodleLocking is INoodleLocking {
    using SafeMath for uint256;

    struct LockedBalance {
        uint256 amount; //锁仓数量
        uint256 end; //解锁日期
        uint256 start; //开始锁仓日期
    }
    struct LockingPoolInfo {
        uint256 lastRewardBlock; // Last block number that NOODLEs distribution occurs.
        uint256 accNoodlePerShare; // 单位份额的收益基数
        uint256 noodlePerBlock; // 每区块产出数量,因为是个比例,放大1e12倍解决小数问题
        uint256 startTimeSec; // 初始区块
    }

    uint256 constant WEEK = 7 * 86400; // all future times are rounded by week
    uint256 constant MAXTIME = 4 * 365 * 86400; // 4 years
    uint256 constant MULTIPLIER = 10**18;

    uint256 private _totalLockedAmount = 0; // 锁仓总量

    address constant ZERO_ADDRESS = address(0x0);
    address public _noodleToken; //NOODLE Token
    address public _lockNoodleTOken; //锁仓代币
    // The NOODLE TOKEN!
    ILockNoodleERC20 public noodle; //治理代币,产出币
    ILockNoodleERC20 public lockNoodleToken; // lock noodle token 锁仓币

    // Info of each user that locking noodle tokens.
    mapping(address => LockedBalance) public lockedUserInfo;
    // Info of locking pool
    mapping(ILockNoodleERC20 => LockingPoolInfo) public lockingPoolInfoMap;

    //
    address public owner;
    uint256 public blockSpeed;

    event EventCommitOwnership(address indexed admin);
    event EventApplyOwnership(address indexed admin);
    event EventDeposit(address indexed provider, uint256 value, uint256 indexed lockTime, uint256 tx);
    event EventWithdraw(address indexed provider, uint256 value, uint256 ts);
    event EventSupply(uint256 prevSupply, uint256 supply);
    event EventLockingPoolInfo(address indexed noodleToken, uint256 accNoodlePerShare);
    event EventLockingPoolInfoAdd(address indexed lockedToken, uint256 noodlePerBlock);

    constructor(
        address _noodleAddr,
        address _lockNoodleTokenAddr,
        uint256 _blockSpeed
    ) {
        /*
        @notice Contract constructor
        @param noodletoken_addr `ERC20 NOODLE TOKEN` token address
        @param locknoodletoken_addr `ERC20 LOCK NOODLE TOKEN` token address
        @param _blockSpeed 区块速度
        */
        _noodleToken = _noodleAddr;
        _lockNoodleTOken = _lockNoodleTokenAddr;
        owner = msg.sender;
        blockSpeed = _blockSpeed;

        noodle = ILockNoodleERC20(_noodleAddr);
        lockNoodleToken = ILockNoodleERC20(_lockNoodleTokenAddr);
    }

    // Add a new noodleToken to the pool. Can only be called by the owner.
    // XXX DO NOT add the same noodleToken token more than once. Rewards will be messed up if you do.
    function addLockingPoolInfo(uint256 _noodlePerBlock) external {
        require(msg.sender == address(owner), 'not owner');
        require(lockingPoolInfoMap[noodle].lastRewardBlock == 0, 'already added');
        uint256 lastRewardBlock = block.number;
        lockingPoolInfoMap[noodle] = LockingPoolInfo({
            lastRewardBlock: lastRewardBlock,
            accNoodlePerShare: 0,
            noodlePerBlock: _noodlePerBlock,
            startTimeSec: block.timestamp
        });
        emit EventLockingPoolInfoAdd(_noodleToken, _noodlePerBlock);
    }

    // 更新锁仓池子收益数据
    function updateLockingPoolInfo() public {
        LockingPoolInfo storage pool = lockingPoolInfoMap[noodle];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        //
        if (pool.startTimeSec >= block.timestamp) {
            return;
        }
        uint256 noodleTokenSupply = noodle.balanceOf(address(this)); // noodle token 锁仓总量
        if (noodleTokenSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 noodleReward = multiplier.mul(pool.noodlePerBlock); //总区块奖励
        // noodle.mint(address(this), noodleReward);
        pool.accNoodlePerShare = pool.accNoodlePerShare.add(noodleReward.mul(1e12).div(noodleTokenSupply)); //计算锁仓奖励份额
        pool.lastRewardBlock = block.number;
        emit EventLockingPoolInfo(address(_noodleToken), pool.accNoodlePerShare);
    }

    function lockedAmount(address _addr) public view returns (uint256 ret) {
        /*
        @notice Get locked amount of `_addr`
        @param _addr User wallet
        @return locked amount
        */
        ret = lockedUserInfo[_addr].amount;
    }

    function lockedEnd(address _addr) public view returns (uint256 ret) {
        /*
        @notice Get timestamp when `_addr`'s lock finishes
        @param _addr User wallet
        @return Epoch time of the lock end
        */
        ret = lockedUserInfo[_addr].end;
    }

    function lockedBegin(address _addr) public view returns (uint256 ret) {
        /*
        @notice Get timestamp when `_addr`'s lock start
        @param _addr User wallet
        @return Epoch time of the lock start
        */
        ret = lockedUserInfo[_addr].start;
    }

    function fetchTotalLockedAmount() public view returns (uint256) {
        return _totalLockedAmount;
    }

    function _depositFor(
        address _addr,
        uint256 _value,
        uint256 unlock_time,
        LockedBalance storage locked_balance
    ) internal {
        /*
        @notice Deposit and lock tokens for a user
        @param _addr User's wallet address
        @param _value Amount to deposit
        @param unlock_time New time when to unlock the tokens, or 0 if unchanged
        @param locked_balance Previous locked amount / timestamp
        */
        LockedBalance storage _locked = locked_balance;

        // Adding to existing lock, or if a lock is expired - creating a new one
        _locked.amount += uint256(_value);
        if (unlock_time != 0) {
            _locked.end = unlock_time;
        }
        _locked.start = block.timestamp;
        lockedUserInfo[_addr] = _locked;
        _totalLockedAmount += _locked.amount;
        require(noodle.transferFrom(_addr, address(this), _value), 'transferFrom failed');
        //铸造lock Noodle
        require(lockNoodleToken.mint(_addr, _value), 'mint lockNoodle failed');

        emit EventDeposit(_addr, _value, _locked.end, block.timestamp);
    }

    function createLock(uint256 _value, uint256 _unlockTime) external {
        /*
        @notice Deposit `_value` tokens for `msg.sender` and lock until `_unlock_time`
        @param _value Amount to deposit
        @param _unlock_time Epoch time when tokens unlock, rounded down to whole weeks
        */
        // assert_not_contract(msg.sender);
        require(_value > 0, 'need non-zero value');
        require(noodle.balanceOf(msg.sender) >= _value, 'insufficient noodle token balance');
        LockedBalance storage _locked = lockedUserInfo[msg.sender];

        require(_locked.amount == 0, 'Withdraw old tokens first');
        // uint256 unlock_time = (_unlockTime / WEEK) * WEEK; // Locktime is rounded down to weeks

        // require(unlock_time > block.timestamp, 'Can only lock until time in the future');
        // require(unlock_time <= block.timestamp + MAXTIME, 'lock can be 4 years max');

        _depositFor(msg.sender, _value, _unlockTime, _locked);
    }

    function increaseAmount(uint256 _value) external {
        /*
    @notice Deposit `_value` additional tokens for `msg.sender`
            without modifying the unlock time
    @param _value Amount of tokens to deposit and add to the lock
    */
        // assert_not_contract(msg.sender);
        LockedBalance storage _locked = lockedUserInfo[msg.sender];

        require(_value > 0, 'need non-zero value');
        require(_locked.amount > 0, 'No existing lock found');
        require(_locked.end > block.timestamp, 'Cannot add to expired lock. Withdraw');

        _depositFor(msg.sender, _value, 0, _locked);
    }

    function increaseUnlockTime(uint256 _unlockTime) external {
        /*
    @notice Extend the unlock time for `msg.sender` to `_unlock_time`
    @param _unlock_time New epoch time for unlocking
    */
        // assert_not_contract(msg.sender);
        LockedBalance storage _locked = lockedUserInfo[msg.sender];
        uint256 unlock_time = (_unlockTime / WEEK) * WEEK; // Locktime is rounded down to weeks

        require(_locked.end > block.timestamp, 'Lock expired');
        require(_locked.amount > 0, 'Nothing is locked');
        require(unlock_time > _locked.end, 'Can only increase lock duration');
        require(unlock_time <= block.timestamp + MAXTIME, 'noodletoken lock can be 4 years max');

        _depositFor(msg.sender, 0, unlock_time, _locked);
    }

    function withdraw() external {
        /*
        @notice Withdraw all tokens for `msg.sender`
        @dev Only possible if the lock has expired
        */
        LockedBalance storage _locked = lockedUserInfo[msg.sender];
        require(block.timestamp >= _locked.end, "The lock didn't expire");
        uint256 value = uint256(_locked.amount);
        require(value > 0, 'Zero Lock Noodle Token Amount');
        // LockedBalance storage old_locked = _locked;

        //return unlocked noodle token to user
        require(noodle.balanceOf(address(this)) >= value, 'Locking Pool Insufficient Balance');
        require(noodle.transfer(msg.sender, value), 'withdraw failed');

        //distribute noodle token reward to user
        uint256 rewardAmount = _pendingNoodleReward(msg.sender);
        if (rewardAmount > 0) {
            safeNoodleTransfer(msg.sender, rewardAmount);
        }

        // burn all lockNoodle Token
        require(lockNoodleToken.burn(msg.sender, lockNoodleToken.balanceOf(msg.sender)));

        _locked.end = 0;
        _locked.start = 0;
        _locked.amount = 0;
        lockedUserInfo[msg.sender] = _locked;
        _totalLockedAmount -= value;

        emit EventWithdraw(msg.sender, value, block.timestamp);
        // emit Supply(supply_before, supply_before - value);
    }

    function _pendingNoodleReward(address _user) internal view returns (uint256) {
        LockingPoolInfo storage pool = lockingPoolInfoMap[noodle];
        LockedBalance storage user = lockedUserInfo[_user];
        // uint256 noodleSupply = noodle.balanceOf(address(this)); //锁仓总数量

        require(
            pool.noodlePerBlock > 0 && user.end > 0 && user.start > 0 && _totalLockedAmount > 0 && blockSpeed > 0,
            '_pendingNoodleReward failed'
        );
        uint256 lockedBlocks = (user.end - user.start).div(blockSpeed); //锁仓区块数量
        uint256 lockedPencentage = user.amount.div(_totalLockedAmount); //锁仓百分比
        uint256 pendingReward = pool.noodlePerBlock.mul(lockedBlocks).mul(lockedPencentage); // 锁仓奖励= 每个区块奖励 × 锁仓区块总数 × 锁仓百分比
        return pendingReward;
    }

    // 计算用户锁仓到期奖励
    function getPendingReward(address _user) external view returns (uint256) {
        return _pendingNoodleReward(_user);
    }

    // Safe noodle transfer function, just in case if rounding error causes pool to not have enough NOODLEs.
    function safeNoodleTransfer(address _to, uint256 _amount) internal {
        uint256 noodleBal = noodle.balanceOf(address(this));
        require(noodleBal > 0, 'insufficient noodle token balance');
        if (_amount > noodleBal) {
            noodle.transfer(_to, noodleBal);
        } else {
            noodle.transfer(_to, _amount);
        }
    }
}
