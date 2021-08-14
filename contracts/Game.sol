// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import './interfaces/IGame.sol';
// import './interfaces/IVote.sol';
import './GameERC20.sol';
import './libraries/SafeMath.sol';
import './libraries/TransferHelper.sol';
import './libraries/LGame.sol';
import './interfaces/IERC20.sol';
import './ConfigurableParametersContract.sol';
import 'hardhat/console.sol';

contract Game is IGame, GameERC20, ConfigurableParametersContract {
    using SafeMath for uint256;
    using LGame for LGame.PlayInfoStruct;
    using LGame for mapping(uint256 => LGame.PlayInfoStruct);

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'NoodleSwapGame: EXPIRED');
        _;
    }

    modifier gameEndCheck(uint256 gameEndTime) {
        require(gameEndTime > block.timestamp, 'NoodleSwapGame: Game End');
        _;
    }

    uint256 public confirmResultSlot = 300;   //游戏结束时间到可输入结果时间，单位为s，设置为1h
    uint256 public confirmSlot = 300;         //结果确认后时间，单位为s，设置为4h
    uint256 public voteSlot = 300;            //投票时间，单位为s,设置为4h

    address public creator;
    address public token;
    
    uint256 public endTime;             //结束game时间
    uint256 public confirmResultTime;   //输入结果时间
    uint256 public challengeTime;       //质疑时间
    uint256 public startVoteTime;       //开始投票时间
    
    address public openAddress;         //原始输入地址
    uint8  public originOption = 200;   //原始输入结果
    address public challengeAddress;    //挑战地址
    uint8  public challengeOption = 200;//挑战结果
    uint8  public winOption = 200;      //最终结果
    
    uint8 private voteFlag = 100;       //投票标志
    uint8 private receiveFlag = 200;    //领奖标志
    
    uint256 public confirmResultAward = 100;  //结果输出者是否领奖
    mapping(address => uint8) public voteMap; //投票数据 

    
    LGame.OptionDataStruct[] public options;

    mapping(uint256 => LGame.PlayInfoStruct) public playInfoMap;

    //手续费率
    uint256 public feeRate = 5;  //0.5%

    //总手续费
    uint256 public fee = 0;

    address public noodleToken;

    address public lockNoodleToken;
    
    address public playNFT;

    constructor(
        address _creator,
        address _token,
        string memory _shortGameName,
        uint256[] memory _optionNum,
        uint256 _endTime,
        address _noodleToken,
        address _lockNoodleToken,
        address _playNFT
    ) GameERC20(_shortGameName) {
        creator = _creator;
        token = _token;
        endTime = _endTime;
        noodleToken = _noodleToken;
        lockNoodleToken = _lockNoodleToken;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            LGame.OptionDataStruct memory option;
            option.marketNumber = _optionNum[i];
            option.placeNumber = 0;
            option.frozenNumber = 0;
            option.voteNumber = 0;
            options.push(option);
        }
        playNFT = _playNFT;
    }

    //下单
    function placeGame(
        uint8[] memory _options,
        uint256[] memory _optionNum,
        uint256 _spread,
        uint256 _deadline
    ) public payable override ensure(_deadline) gameEndCheck(endTime) returns (uint256[] memory tokenIds) {
        uint256 balance = IERC20(token).balanceOf(address(msg.sender));
        uint256 sum = 0;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            sum += _optionNum[i];
        }
        require(balance >= sum, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), sum);
        uint256 placeFee;
        (tokenIds,placeFee) = playInfoMap.update(options, _options, _optionNum, playNFT, feeRate);
        fee = fee + placeFee;
        emit _placeGame(address(this), token, msg.sender, _options, _optionNum, tokenIds, _getOptions());
    }

    function getOptionsLength() public view returns (uint256 len) {
        len = options.length;
    }

    function getOptions() public view returns (uint256[] memory optionData) {
        return _getOptions();
    }

    function _getOptions() private view returns (uint256[] memory optionData) {
        optionData = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++) {
            optionData[i] = options[i].marketNumber + options[i].placeNumber - options[i].frozenNumber;
        }
    }

    function addLiquidity(
        uint256 amount,
        uint256 _spread,
        uint256 _deadline
    )
        public
        payable
        override
        ensure(_deadline)
        gameEndCheck(endTime)
        returns (uint256 liquidity, uint256[] memory tokenIds)
    {
        uint256 balance = IERC20(token).balanceOf(address(msg.sender));
        require(balance >= amount, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), amount);
        uint256 sum = 0;
        uint256 frozenSum = 0;
        (tokenIds, sum, frozenSum,liquidity) = playInfoMap.addLiquidity(options, playNFT, amount);
        _mint(msg.sender, liquidity);
        emit _addLiquidity(address(this), token, msg.sender, amount, liquidity, tokenIds, _getOptions());
    }

    function removeLiquidity(
        uint256 _liquidity,
        uint256 _spread,
        uint256 _deadline
    ) public payable override ensure(_deadline) returns (uint256 amount, uint256[] memory tokenIds) {
        uint256 balance = balanceOf[address(msg.sender)];
        require(balance >= _liquidity, 'NoodleSwap: address have not enough amount');
        _burn(msg.sender, _liquidity);
        uint256 sum = 0;
        uint256 frozenSum = 0;
        if(block.timestamp < endTime){
            (tokenIds, sum, frozenSum) = playInfoMap.removeLiquidity(options, playNFT, _liquidity);
            amount = sum;
        }else{
            require(isGameClose() < 100, 'NoodleSwap: Game is not over');
            uint256 marketFee = fee * 70 / 100;
            sum = playInfoMap.removeLiquidityWithWinOption(options,totalSupply,_liquidity,winOption,marketFee);
        }
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, sum);
        emit _removeLiquidity(address(this), msg.sender, _liquidity, amount, tokenIds, _getOptions());
    }

    function removeLiquidityWithPermit(
        uint256 _liquidity,
        uint256 _spread,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public payable override ensure(_deadline) returns (uint256 amount, uint256[] memory tokenIds) {
        uint256 balance = balanceOf[address(msg.sender)];
        require(balance >= _liquidity, 'NoodleSwap: address have not enough amount');
        GameERC20(this).permit(msg.sender, address(this), _liquidity, _deadline, v, r, s);
        removeLiquidity(_liquidity, _spread, _deadline);
    }

    function mint(address to, uint256 value) public override {
        _mint(to, value);
    }

    //游戏是否可以领奖
    function isGameClose() private returns (uint256 gameResultType){
        if(confirmResultTime > 0 &&  challengeAddress == address(0) && confirmResultTime + confirmSlot < block.timestamp){
            gameResultType = 1;
        }else if(confirmResultTime > 0 &&  challengeAddress != address(0) && challengeTime + voteSlot < block.timestamp){
            gameResultType = 2;
        }else if(confirmResultTime == 0 && startVoteTime >= endTime + confirmResultSlot && startVoteTime <= endTime + confirmResultSlot + voteSlot && endTime + confirmResultSlot + voteSlot < block.timestamp){
            gameResultType = 3;
        }else if(confirmResultTime == 0 && startVoteTime > endTime + confirmResultSlot + voteSlot && startVoteTime < block.timestamp){
            gameResultType = 4;
        }else {
            gameResultType = 100;
        }
    }

    //获得奖励
    function getAward(uint256[] memory tokenIds) public payable  returns (uint256 amount) {
        require(isGameClose() < 100, 'NoodleSwap: Game is not over');
        console.log('winOption:', winOption);
        amount = playInfoMap.getAward(tokenIds, winOption, playNFT);
        console.log('award amount:', amount);
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, amount);
        emit _getAward(address(this), token, msg.sender, tokenIds, amount);
    }

    //抵押获取开奖资格
    function stakeGame(uint256 deadline) public override {
        require(openAddress == address(0), 'NoodleSwap: the game has openAddress');
        uint256 balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance >= stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), stakeNumber);
        openAddress = address(msg.sender);
        emit _stakeGame(address(this), token, openAddress, stakeNumber);
    }

    //开奖
    function openGame(uint8 _winOption) public override {
        require(openAddress == msg.sender, 'NoodleSwap: cannot open game');
        require(endTime < block.timestamp && endTime + confirmResultSlot > block.timestamp, 'NoodleSwap: not open time');
        originOption = _winOption;
        winOption = _winOption;
        confirmResultTime = block.timestamp;
        options[_winOption].voteNumber += 1;
        if(_winOption == 0 ){
            voteMap[msg.sender] = voteFlag;
        }else{
            voteMap[msg.sender] = _winOption;
        }
        emit _openGame(address(this), address(msg.sender), originOption);
    }

    //挑战，发起投票
    function challengeGame(uint8 _challengeOption) public override {
        require(openAddress != address(0), 'NoodleSwap: the game has no openAddress');
        require(confirmResultTime + confirmSlot > block.timestamp, 'NoodleSwap: the game is over');
        uint256 balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance >= stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), stakeNumber);
        challengeAddress = address(msg.sender);
        challengeOption = _challengeOption;
        challengeTime = block.timestamp;
        options[_challengeOption].voteNumber += 1;
        if(_challengeOption == 0 ){
            voteMap[msg.sender] = voteFlag;
        }else{
            voteMap[msg.sender] = _challengeOption;
        }
        emit _challengeGame(address(msg.sender), address(this), winOption, challengeOption);
    }

    function getVoteNumbers() public view returns (uint256[] memory optionData) {
        return _getVoteNumbers();
    }

    function _getVoteNumbers() private view returns (uint256[] memory optionData) {
        optionData = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++) {
            optionData[i] = options[i].voteNumber;
        }
    }

    function addVote(uint8 option) public override {
        require(option < options.length,'NoodleSwap: option should be less ');
        bool canVote = false;
        if(challengeTime > 0 && challengeTime + voteSlot > block.timestamp){
            canVote = true;
        }else if(confirmResultTime == 0 && startVoteTime == 0 && endTime + confirmResultSlot < block.timestamp){
            canVote = true;
        }else if(confirmResultTime == 0 && startVoteTime != 0 && endTime + confirmResultSlot + voteSlot > block.timestamp){
            canVote = true;
        }else {
            canVote = false;
        }
        require(canVote == true, 'NoodleSwap: time can not vote');
        require(voteMap[msg.sender] == 0, 'NoodleSwap: vote only once');
        uint256 balance = IERC20(lockNoodleToken).balanceOf(msg.sender);
        require(balance >= voteNumber, 'NoodleSwap: vote address have not enough amount');
        TransferHelper.safeTransferFrom(lockNoodleToken, msg.sender, address(this), voteNumber);
        if(option == 0 ){
            voteMap[msg.sender] = voteFlag;
        }else{
            voteMap[msg.sender] = option;
        }
        options[option].voteNumber += 1;
        //判断获胜条件
        uint256 max;
        uint8 _winOption;
        bool hasWiner = false;
        if(challengeTime > 0){
            uint256 originOptionNumber = options[originOption].voteNumber; 
            uint256 challengeOptionNumber = options[challengeOption].voteNumber;
            
            if(originOptionNumber >= challengeOptionNumber){
                max = originOptionNumber;
                _winOption = originOption;
            }else{
                max = challengeOptionNumber;
                _winOption = challengeOption;
            }
            for (uint8 i = 0; i < options.length; i++) {
                if(max < options[i].voteNumber){
                    max = options[i].voteNumber;
                    _winOption = i;
                }
            }
            hasWiner = true;
        }else{
            max = options[0].voteNumber;
            _winOption = 0;
            hasWiner = true;
            for (uint8 i = 1; i < options.length; i++) {
                if(max < options[i].voteNumber){
                    max = options[i].voteNumber;
                    _winOption = i;
                    hasWiner = true;
                }else if(max == options[i].voteNumber){
                    hasWiner = false;
                }
            }
        }
        if(startVoteTime == 0 && hasWiner){
            startVoteTime = block.timestamp;
        }
        winOption = _winOption;
        emit _addVote(address(this), msg.sender, option, _getVoteNumbers(),winOption);
    }

    //领取输入结果奖励
    function getConfirmAward() public {
        require(msg.sender == openAddress && originOption == winOption && confirmResultAward == 100, 'NoodleSwap: Confirmresult address has no award');
        confirmResultAward = 200;
        uint256 gameResultType = isGameClose();
        uint256 noodleAward;
        if(gameResultType == 1){
            noodleAward = stakeNumber;
        }else {
            noodleAward = stakeNumber + stakeNumber * 3 / 10;
        }
        TransferHelper.safeTransferFrom(noodleToken, address(this), msg.sender, noodleAward);
        uint256 feeAward = fee * 10 / 100;
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, feeAward);
        emit _getConfirmAward(address(this),msg.sender, noodleAward, feeAward);
    }

    //领取投票奖励
    function getVoteAward() public override {
        uint256 gameResultType = isGameClose();
        require(gameResultType < 100, 'NoodleSwap: Game is not over');
        require(msg.sender != openAddress && voteMap[msg.sender] > 0 && voteMap[msg.sender] != receiveFlag, 'NoodleSwap: address cannot get award');
        uint8 voteOption = voteMap[msg.sender];
        if(voteOption == voteFlag){
            voteOption = 0;
        }
        voteMap[msg.sender] = receiveFlag;
        uint256 noodleAward;
        uint256 feeAward;
        if(voteOption == winOption){
            if(gameResultType == 2){
                if(challengeOption == winOption){
                    if(msg.sender == challengeAddress){
                        noodleAward = stakeNumber + stakeNumber * 3 / 10;
                        feeAward = fee * 10 / 100;
                    }else{
                        noodleAward = stakeNumber * 7 /10;
                        noodleAward = noodleAward / (options[winOption].voteNumber - 1);
                    }
                }else if(originOption == winOption){
                    noodleAward = stakeNumber * 7 /10;
                    noodleAward = noodleAward / (options[winOption].voteNumber - 1);
                }else{
                    noodleAward = stakeNumber + stakeNumber;
                    noodleAward = noodleAward / (options[winOption].voteNumber);
                    
                    feeAward = fee * 10 / 100;
                    feeAward = feeAward / (options[winOption].voteNumber);
                }
            }else if(gameResultType == 3 || gameResultType == 4){
                if(openAddress != address(0)){
                    noodleAward = stakeNumber;
                    noodleAward = noodleAward / (options[winOption].voteNumber);
                }
                feeAward = fee * 10 / 100;
                feeAward = feeAward / (options[winOption].voteNumber);
            }
        }
        TransferHelper.safeTransferFrom(lockNoodleToken, address(this), msg.sender,  voteNumber);
        if(noodleAward > 0){
                TransferHelper.safeTransferFrom(noodleToken, address(this), msg.sender, noodleAward);
            }
        if(feeAward > 0){
            TransferHelper.safeTransferFrom(token, address(this), msg.sender, feeAward);
        }
        emit _getVoteAward(address(this), msg.sender, noodleAward, feeAward);
    }
}
