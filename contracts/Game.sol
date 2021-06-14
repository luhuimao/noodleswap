// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import './interfaces/IGame.sol';
import './interfaces/IVote.sol';
import './GameERC20.sol';
import './libraries/SafeMath.sol';
import './libraries/TransferHelper.sol';
import './libraries/LGame.sol';
import './interfaces/IERC20.sol';
import './ConfigurableParametersContract.sol';

// import './PlayNFT.sol';

// import './Vote.sol';
// import 'hardhat/console.sol';

contract Game is IGame, GameERC20, ConfigurableParametersContract {
    using SafeMath for uint256;
    using LGame for LGame.PlayInfoStruct;
    using LGame for mapping(uint256 => LGame.PlayInfoStruct);

    modifier ensure(uint256 _endTime) {
        require(_endTime >= block.timestamp, 'NoodleSwapGame: EXPIRED');
        _;
    }

    modifier gameEndCheck(uint256 gameEndTime) {
        require(gameEndTime > block.timestamp, 'NoodleSwapGame: Game End');
        _;
    }

    address public creator;
    address public token;
    uint256 public endTime;

    LGame.OptionDataStruct[] public options;

    mapping(uint256 => LGame.PlayInfoStruct) public playInfoMap;

    //创建者手续费
    uint256 public ownerFee = 0;

    //平台手续费
    uint256 public platformFee = 0;

    uint8 public winOption;

    address public noodleToken;

    address public openAddress;

    address public vote;

    address public playNFT;

    constructor(
        address _creator,
        address _token,
        string memory _shortGameName,
        uint256[] memory _optionNum,
        uint256 _endTime,
        address _noodleToken,
        address _vote
    )  GameERC20(_shortGameName){
        creator = _creator;
        token = _token;
        endTime = _endTime;
        noodleToken = _noodleToken;
        vote = _vote;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            LGame.OptionDataStruct memory option;
            option.marketNumber = _optionNum[i];
            option.placeNumber = 0;
            option.frozenNumber = 0;
            options.push(option);
        }
        playNFT = LGame.createNFT();
        // playNFT = address(new PlayNFT());
    }

    //下单
    function placeGame(
        address _token,
        uint8[] memory _options,
        uint256[] memory _optionNum,
        uint256 _endTime
    ) public payable override ensure(_endTime) gameEndCheck(endTime) returns (uint256[] memory tokenIds) {
        //require(token == _token, 'NoodleSwap: Forbidden');
        //require(block.timestamp < endTime, 'NoodleSwap: Game End');
        uint256 balance = IERC20(token).balanceOf(address(msg.sender));
        uint256 sum = 0;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            sum += _optionNum[i];
        }
        require(balance >= sum, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), sum);
        tokenIds = playInfoMap.update(options, _options, _optionNum, playNFT, ownerFee, platformFee);
        emit _placeGame(address(this), token, msg.sender, _options, _optionNum, tokenIds, _getOptions());
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

    function addLiquidity(address _token, uint256 amount)
        public
        override
        returns (uint256 liquidity, uint256[] memory tokenIds)
    {
        //require(token == _token, 'NoodleSwap: Forbidden');
        //require(block.timestamp < endTime, 'NoodleSwap: Game End');
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

    function removeLiquidity(uint256 _liquidity, uint256 _endTime)
        public
        override
        returns (uint256 amount, uint256[] memory tokenIds)
    {
        //require(block.timestamp < endTime, 'NoodleSwap: Game End');
        uint256 balance = balanceOf[address(msg.sender)];
        require(balance >= _liquidity, 'NoodleSwap: address have not enough amount');
        _burn(msg.sender, _liquidity);
        //从池子里拿出的金额
        uint256 initMarketNumber = options[0].marketNumber;
        uint256 sum = 0;
        uint256 frozenSum = 0;
        (tokenIds, sum, frozenSum) = playInfoMap.removeLiquidity(options, playNFT, initMarketNumber, _liquidity);
        amount = sum;
        //转账需要处理approve
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, sum);
        emit _removeLiquidity(address(this), msg.sender, _liquidity, amount, tokenIds, _getOptions());
    }

    function removeLiquidityWithPermit(
        uint256 _liquidity,
        uint256 _endTime,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public override returns (uint256 amount, uint256[] memory tokenIds) {
        //require(block.timestamp < endTime, 'NoodleSwap: Game End');
        uint256 balance = balanceOf[address(msg.sender)];
        require(balance >= _liquidity, 'NoodleSwap: address have not enough amount');
        GameERC20(this).permit(msg.sender, address(this), _liquidity, _endTime, v, r, s);
        removeLiquidity(_liquidity, _endTime);
    }

    function mint(address to, uint256 value) public override {
        _mint(to, value);
    }

    //获得奖励
    function getAward(uint256[] memory tokenIds) public returns (uint256 amount) {
        //todo: 需要判断game是否结束
        // console.log('winOption:', winOption);
        amount = playInfoMap.getAward(tokenIds, winOption, playNFT);
        // console.log('award amount:', amount);
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
        winOption = _winOption;
        emit _openGame(address(this), address(msg.sender), winOption);
    }

    //挑战，发起投票
    function challengeGame(uint8 challengeOption) public override {
        require(openAddress != address(0), 'NoodleSwap: the game has openAddress');
        uint256 balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance >= stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), stakeNumber);
        // vote = _vote;
        IVote(vote).startVote(address(this), address(msg.sender), winOption, challengeOption, block.timestamp + 100000);
        // vote = address(new Vote(address(this), address(msg.sender),winOption, challengeOption,block.timestamp));
        emit _challengeGame(address(msg.sender), address(this), winOption, challengeOption, vote);
    }

    function addVote(uint8 option) public override {
        IVote(vote).add(address(this), msg.sender, option);
    }

    function openGameWithVote() public override {
        // winOption = Vote(vote).voteMap(address(this)).winOption;
    }
}
