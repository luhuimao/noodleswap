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

// import './PlayNFT.sol';

// import './Vote.sol';
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

    address public creator;
    address public token;
    
    uint256 public endTime;             //结束game时间
    uint256 public confirmResultTime;   //输入结果时间
    uint256 public confirmSlot = 300;   //确认后时间，单位为s
    uint256 public startVoteTime;       //开始投票时间，0表示没有开启投票
    uint256 public voteSlot = 300;      //投票时间，单位为s
    
    address public openAddress;         //原始输入地址
    uint8  public originOption = 200;   //原始输入结果
    address public challengeAddress;    //挑战地址
    uint8  public challengeOption = 200;//挑战结果
    uint8  public winOption = 200;      //最终结果
    uint8 private voteFlag = 100;       //投票标志
    uint8 private receiveFlag = 200;    //领奖标志
    mapping(address => uint8) public voteMap; //投票数据 

    LGame.OptionDataStruct[] public options;

    mapping(uint256 => LGame.PlayInfoStruct) public playInfoMap;

    //创建者手续费
    uint256 public ownerFee = 0;

    //平台手续费
    uint256 public platformFee = 0;

    address public noodleToken;
    // address public vote;
    address public playNFT;

    constructor(
        address _creator,
        address _token,
        string memory _shortGameName,
        uint256[] memory _optionNum,
        uint256 _endTime,
        address _noodleToken,
        address _playNFT
    ) GameERC20(_shortGameName) {
        creator = _creator;
        token = _token;
        endTime = _endTime;
        noodleToken = _noodleToken;
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
        tokenIds = playInfoMap.update(options, _options, _optionNum, playNFT, ownerFee, platformFee);
        console.log('tokenIds:', tokenIds.length);
        console.log('id:', tokenIds[0]);
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
        uint256 initOption0MarketNumber = options[0].marketNumber;
        uint256 sum = 0;
        uint256 frozenSum = 0;
        (tokenIds, sum, frozenSum) = playInfoMap.addLiquidity(options, playNFT, amount);
        //以第一个池子的数来计算生成的做市币数量
        liquidity = (initOption0MarketNumber * amount) / sum;
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
        //从池子里拿出的金额
        uint256 initMarketNumber = options[0].marketNumber;
        uint256 sum = 0;
        uint256 frozenSum = 0;
        (tokenIds, sum, frozenSum) = playInfoMap.removeLiquidity(options, playNFT, initMarketNumber, _liquidity);
        amount = sum;
        console.log('remove:', amount);
        //转账需要处理approve
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

    //获得奖励
    function getAward(uint256[] memory tokenIds) public returns (uint256 amount) {
        //todo: 需要判断game是否结束
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
        originOption = _winOption;
        confirmResultTime = block.timestamp;
        emit _openGame(address(this), address(msg.sender), originOption);
    }

    //挑战，发起投票
    function challengeGame(uint8 _challengeOption) public override {
        require(openAddress != address(0), 'NoodleSwap: the game has openAddress');
        uint256 balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance >= stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), stakeNumber);
        challengeAddress = address(msg.sender);
        challengeOption = _challengeOption;
        startVoteTime = block.timestamp;
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
        //判断投票是否截止
        //判断是否已经投票
        //判断余额是否足够
        require(option < options.length,'NoodleSwap: option should be less ');
        require(startVoteTime > 0, 'NoodleSwap: vote have not started');
        require(startVoteTime + voteSlot > block.timestamp, 'NoodleSwap: vote stop');
        require(voteMap[msg.sender] == 0, 'NoodleSwap: vote only once');
        uint256 balance = IERC20(noodleToken).balanceOf(msg.sender);
        require(balance >= voteNumber, 'NoodleSwap: vote address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), voteNumber);
        if(option == 0 ){
            voteMap[msg.sender] = voteFlag;
        }else{
            voteMap[msg.sender] = option;
        }
        options[option].voteNumber += 1;
        //判断获胜条件
        uint256 max;
        uint256 originOptionNumber = options[originOption].voteNumber; 
        uint256 challengeOptionNumber = options[challengeOption].voteNumber;
        uint8 _winOption;
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
        winOption = _winOption;
        emit _addVote(address(this), msg.sender, option, _getVoteNumbers(),winOption);
    }

    function getVoteAward() public override {
        //判断投票是否截止
        //用户是否投票
        //用户投票是否正确
        //用户是否是发起人
        require(startVoteTime > 0, 'NoodleSwap: vote have not started');
        require(startVoteTime + voteSlot < block.timestamp, 'NoodleSwap: vote have not stopped');
        require(voteMap[msg.sender] > 0, 'NoodleSwap: address have no vote');
        uint8 voteOption = voteMap[msg.sender];
        if(voteOption == voteFlag){
            voteOption = 0;
        }
        require(voteOption == winOption,'NoodleSwap: vote not winOption');
        voteMap[msg.sender] = receiveFlag;
        uint256 winNumber;
        if(winOption == originOption){
            if(msg.sender == openAddress){
                winNumber = stakeNumber*30/100;
            }else{
                winNumber = stakeNumber*70/100/options[winOption].voteNumber;
            }
        }else if(winOption == challengeOption){
            if(msg.sender == challengeAddress){
                winNumber = stakeNumber*30/100;
            }else{
                winNumber = stakeNumber*70/100/options[winOption].voteNumber;
            }
        }else {
            winNumber = stakeNumber*2/options[winOption].voteNumber;
        }
        console.log(winNumber);
        TransferHelper.safeTransferFrom(noodleToken, address(this), msg.sender, winNumber);
        emit _getVoteAward(address(this), msg.sender, voteOption,winNumber); 
    }
}
