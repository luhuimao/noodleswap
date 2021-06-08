// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import './interfaces/IGame.sol';
import './GameERC20.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './interfaces/IGameFactory.sol';
import './ConfigurableParametersContract.sol';
import './Vote.sol';
import './PlayNFT.sol';

import 'hardhat/console.sol';

contract Game is IGame, GameERC20, ConfigurableParametersContract {
    using SafeMath for uint256;

    struct OptionDataStruct {
        uint256 marketNumber;
        uint256 placeNumber;
        uint256 frozenNumber;
    }

    //option,optionNum,optionP,allFrozen,返回tokenId
    struct PlayInfoStruct {
        uint8 option;
        uint256 optionNum;
        uint256 optionP;
        uint256 allFrozen;
    }

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
    string public gameName;
    string public resultSource;
    uint256 public endTime;
    string[] public optionName;
    OptionDataStruct[] public options;

    mapping(uint256 => PlayInfoStruct) public playInfoMap;

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
        string memory _gameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime,
        address _noodleToken
    ) {
        creator = _creator;
        token = _token;
        gameName = _gameName;
        optionName = _optionName;
        resultSource = _resultSource;
        endTime = _endTime;
        noodleToken = _noodleToken;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            OptionDataStruct memory option;
            option.marketNumber = _optionNum[i];
            option.placeNumber = 0;
            option.frozenNumber = 0;
            options.push(option);
        }
        playNFT = address(new PlayNFT());
    }

    //下单
    //ensure(_endTime) gameEndCheck(endTime)
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
            console.log('_optionNum:', _optionNum[i]);
        }
        require(balance >= sum, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), sum);
        console.log('before:', options[0].placeNumber);
        for (uint8 i = 0; i < _options.length; i++) {
            options[_options[i]].placeNumber += _optionNum[i];
        }
        console.log('after:', options[0].placeNumber);
        uint256[] memory currentFrozen = new uint256[](options.length);
        tokenIds = new uint256[](_options.length);
        for (uint8 i = 0; i < _options.length; i++) {
            uint8 optionId = _options[i];
            uint256 optionNum = _optionNum[i];
            uint256 allFrozen = 0;
            for (uint8 j = 0; j < options.length; j++) {
                if (j != optionId) {
                    //计算optionId 和 j 池子的赔率
                    uint256 p = _calcOdd(options[optionId], options[j]);
                    console.log('p:', p);
                    uint256 frozenJ = (optionNum * p) / 100;
                    console.log('frozenJ', frozenJ);
                    currentFrozen[j] = frozenJ;
                    console.log('currentFrozen[j]:', currentFrozen[j]);
                    allFrozen += frozenJ;
                }
            }
            console.log('allFrozen:', allFrozen);
            console.log('currentFrozen[0]:', currentFrozen[0]);
            console.log('currentFrozen[1]:', currentFrozen[1]);
            //这个选项的赔率
            uint256 optionP = (allFrozen * (100 - ownerFee - platformFee) + optionNum * 100) / optionNum;
            console.log('optionP:', optionP);
            //调用生成ERC721 token的接口, option,optionNum,optionP,allFrozen,返回tokenId
            //可以考虑将这些信息放到uri这个字符串中
            console.log('playNFT:', playNFT);
            uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
            console.log('tokenId', tokenId);
            PlayInfoStruct memory playInfo;
            playInfo.option = optionId;
            playInfo.optionNum = optionNum;
            playInfo.optionP = optionP;
            playInfo.allFrozen = allFrozen;
            playInfoMap[tokenId] = playInfo;
            tokenIds[i] = tokenId;
        }
        console.log('playInfo.option:', playInfoMap[0].option);
        console.log('playInfo.optionNum:', playInfoMap[0].optionNum);
        console.log('playInfo.allFrozen:', playInfoMap[0].allFrozen);
        for (uint8 i = 0; i < options.length; i++) {
            options[i].frozenNumber = options[i].frozenNumber + currentFrozen[i];
        }
        emit _placeGame(address(this), token, msg.sender, _options, _optionNum, tokenIds,_getOptions());
    }

    //p = (b + placeB) / (a + placeA)
    function _calcOdd(OptionDataStruct memory a, OptionDataStruct memory b) private pure returns (uint256 p) {
        uint256 sumA = a.placeNumber + a.marketNumber - a.frozenNumber;
        uint256 sumB = (b.placeNumber + b.marketNumber - b.frozenNumber) * 100;
        p = sumB / sumA;
    }

    function _getOptions() private view returns(uint256[] memory optionData){
        optionData = new uint256[](options.length);
        for(uint8 i = 0; i < options.length; i ++){
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
        console.log('user balance:', balance);
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), amount);
        uint256 sum = 0;
        uint256 frozenSum = 0;
        uint256 initOption0MarketNumber = options[0].marketNumber;
        for (uint8 i = 0; i < options.length; i++) {
            sum += options[i].marketNumber;
            if (options[i].placeNumber > options[i].frozenNumber) {
                sum += (options[i].placeNumber - options[i].frozenNumber);
            } else {
                frozenSum += (options[i].frozenNumber - options[i].placeNumber);
            }
        }
        tokenIds = new uint256[](options.length);
        //放入到做市池子里的金额：
        for (uint8 i = 0; i < options.length; i++) {
            options[i].marketNumber += (options[i].marketNumber * amount) / sum;
            if (options[i].placeNumber > options[i].frozenNumber) {
                //下单的金额
                uint256 placeNumber = ((options[i].placeNumber - options[i].frozenNumber) * amount) / sum;
                options[i].placeNumber += placeNumber;
                uint256 optionP = (frozenSum * 100) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                PlayInfoStruct memory playInfo;
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                playInfoMap[tokenId] = playInfo;
                tokenIds[i] = tokenId;
                console.log(tokenId);
            } else {
                //冻结的金额
                options[i].frozenNumber += ((options[i].frozenNumber - options[i].placeNumber) * amount) / sum;
            }
        }
        //以第一个池子的数来计算生成的做市币数量
        liquidity = (initOption0MarketNumber * amount) / sum;
        console.log('liquidity:', liquidity);
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
        console.log('_liquidity:', _liquidity);
        _burn(msg.sender, _liquidity);
        //从池子里拿出的金额
        uint256 sum = 0;
        uint256 frozenSum = 0;
        uint256 initMarketNumber = options[0].marketNumber;
        for (uint8 i = 0; i < options.length; i++) {
            uint256 marketNumber = (options[i].marketNumber * _liquidity) / initMarketNumber;
            sum += marketNumber;
            options[i].marketNumber -= marketNumber;

            if (options[i].placeNumber > options[i].frozenNumber) {
                frozenSum += ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) / initMarketNumber;
                options[i].frozenNumber +=
                    ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) /
                    initMarketNumber;
            }
        }
        tokenIds = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++) {
            if (options[i].placeNumber < options[i].frozenNumber) {
                uint256 placeNumber =
                    ((options[i].frozenNumber - options[i].placeNumber) * _liquidity) / initMarketNumber;
                sum = sum - placeNumber;
                options[i].placeNumber += placeNumber;
                uint256 optionP = ((frozenSum + placeNumber) * 100) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                PlayInfoStruct memory playInfo;
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                playInfoMap[tokenId] = playInfo;
                tokenIds[i] = tokenId;
                console.log('tokenId:', tokenId);
            }
        }
        amount = sum;
        console.log('amount:', amount);
        //转账需要处理approve
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, sum);
        emit _removeLiquidity(address(this), msg.sender, _liquidity, amount, tokenIds,_getOptions());
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
    function getAward(uint256[] memory tokenIds) private returns (uint256 amount) {
        //todo: 需要判断game是否结束
        uint256 amount = 0;
        for(uint8 i = 0; i< tokenIds.length;i ++){
            PlayInfoStruct storage playInfo = playInfoMap[tokenIds[i]];
            require(msg.sender == PlayNFT(playNFT).ownerOf(tokenIds[i]), 'NoodleSwap: address have no right');
            if(playInfo.option == 200){
                continue;
            }
            if (playInfo.option == winOption) {
                //用户赢了，则将币转给用户
                amount += playInfo.allFrozen;
            }
            playInfoMap[tokenIds[i]].option = 200; //表示已经领取
        }
        TransferHelper.safeTransferFrom(token, address(this), msg.sender, amount);
        emit _getAward(address(this), token, msg.sender, tokenIds,amount);
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
    function challengeGame(uint8 challengeOption) public override returns (address _vote) {
        require(openAddress != address(0), 'NoodleSwap: the game has openAddress');
        uint256 balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance >= stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), stakeNumber);
        vote = address(new Vote(address(this), address(msg.sender)));
        emit _challengeGame(address(msg.sender),address(this),winOption,challengeOption,vote);
    }

    function openGameWithVote() public override {
        winOption = Vote(vote).winOption();
    }
}
