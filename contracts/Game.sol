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

//contract Game is IGame, GameERC20,ConfigurableParametersContract {
contract Game is IGame, GameERC20,ConfigurableParametersContract {

    using SafeMath  for uint;

    struct OptionDataStruct {
        uint256 marketNumber;
        uint256 placeNumber;
        uint256 frozenNumber;
    }

    //option,optionNum,optionP,allFrozen,返回tokenId
    struct PlayInfoStruct{
        uint8 option;
        uint256 optionNum;
        uint256 optionP;
        uint256 allFrozen;
    }

    modifier ensure(uint _endTime) {
        require(_endTime >= block.timestamp, 'NoodleSwapGame: EXPIRED');
        _;
    }

    modifier gameEndCheck(uint gameEndTime){
        require(gameEndTime < block.timestamp, 'NoodleSwapGame: Game End');
        _;
    }

    event _placeGame(address sender,address game,address token,uint8[] options,uint[] optionNum,uint256[] tokenIds);
    event _addLiquidity(address sender,address game,address token,uint256 amount,uint256 liquidity,uint256[] tokenIds);
    event _removeLiquidity(address sender,address game,address token,uint256 liquidity,uint256 amount,uint256[] tokenIds);
    event _stakeGame(address sender,address game,address token,uint256 amount);
    event _openGame(address sender,address game,uint option);
    event _challengeGame(address sender,address game,uint originOption,uint challengeOption,address vote);
    event _openGameWithVote(address sender,address game,address vote,uint voteOption);

    address public token;
    string  public gameName;
    string  public resultSource;
    uint public endTime;
    string[] public optionName;
    OptionDataStruct[] public options;

    mapping(uint256 => PlayInfoStruct) public playInfoMap;

    //创建者手续费
    uint8 public ownerFee = 2;  

    //平台手续费
    uint8 public platformFee = 2;

    uint8   public winOption;

    address public gameToken;

    address public openAddress;

    address public vote;

    address private playNFT;

    constructor(address _token,
    string memory _gameName,
    string[] memory _optionName,
    uint256[] memory _optionNum,
    string memory _resultSource,
    uint _endTime) {
        token = _token;
        gameName = _gameName;
        optionName = _optionName;
        resultSource = _resultSource;
        endTime = _endTime;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            OptionDataStruct memory option;
            option.marketNumber = _optionNum[i];
            option.placeNumber = 0;
            option.frozenNumber = 0;
            options.push(option);
        }
        playNFT = address(new PlayNFT());
    }
    function createGame(
        address _token,
        string memory _gameName,
        string[] memory _optionName,
        uint[] memory _optionNum,
        string memory _resultSource,
        uint _endTime
    ) public override returns(address game)
    {

    }


    //下单
    function placeGame(address _token, 
        uint8[] memory _options,
        uint256[] memory _optionNum,
        uint _endTime)  ensure(_endTime) gameEndCheck(endTime) public payable returns(uint256[] memory tokenIds){
        require(token != _token,'NoodleSwap: Forbidden');
        require(block.timestamp > endTime,'NoodleSwap: Game End');
        uint balance = IERC20(_token).balanceOf(address(msg.sender));
        uint256 sum = 0;
        for (uint8 i = 0; i < _optionNum.length; i++) {
            sum  += _optionNum[i];
        }
        require(balance < sum, 'NoodleSwap: address have not enough amount');
        for (uint8 i = 0; i < _options.length; i++){
            OptionDataStruct memory option = options[_options[i]];
            option.placeNumber += _optionNum[i];
        }
        //calc the odd
        uint256[] memory currentFrozen;
        tokenIds = new uint256[](_options.length);
        for (uint8 i = 0;i < _options.length; i++){
            uint8  optionId = _options[i];
            uint256 optionNum = _optionNum[i];
            uint256 allFrozen = 0;
            for(uint8 j = 0; j < options.length; j++){
                if(j != optionId){  //计算optionId 和 j 池子的赔率
                    uint256 p = _calcOdd(options[optionId],options[j]);
                    uint256 frozenJ = optionNum * p;  
                    currentFrozen[j] += frozenJ;
                    allFrozen += frozenJ;
                }
            }
            //这个选项的赔率
            uint256 optionP = allFrozen/optionNum*(1 - ownerFee/100 - platformFee/100) + 1;
            //调用生成ERC721 token的接口, option,optionNum,optionP,allFrozen,返回tokenId
            //可以考虑将这些信息放到uri这个字符串中
            uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender,'');
            PlayInfoStruct memory playInfo;
            playInfo.option = optionId;
            playInfo.optionNum = optionNum;
            playInfo.optionP = optionP;
            playInfo.allFrozen = allFrozen;
            playInfoMap[tokenId] = playInfo;
            tokenIds[i] = tokenId;
        }
        for (uint8 i = 0;i < options.length;i ++){
            options[i].frozenNumber = options[i].frozenNumber - currentFrozen[i];
        }
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), sum);
        emit _placeGame(msg.sender,address(this),token,_options,_optionNum,tokenIds);
    }

    //p = (b + placeB) / (a + placeA)
    function _calcOdd(OptionDataStruct memory a,OptionDataStruct memory b) private returns(uint256 p){
        uint256 sumA = a.placeNumber + a.marketNumber - a.frozenNumber;
        uint256 sumB = b.placeNumber + b.marketNumber - b.frozenNumber;
        p = sumB/sumA;
    }
    
    function addLiquidity(address _token, uint256 amount) public returns(uint256 liquidity,uint256[] memory tokenIds){
        require(token != _token,'NoodleSwap: Forbidden');
        require(block.timestamp > endTime,'NoodleSwap: Game End');
        uint balance = IERC20(_token).balanceOf(address(msg.sender));
        require(balance < amount, 'NoodleSwap: address have not enough amount');

        uint256 sum = 0;
        uint256 frozenSum = 0;
        for (uint8 i = 0; i < options.length; i++){
            sum += options[i].marketNumber;
            if(options[i].placeNumber > options[i].frozenNumber){
                sum += options[i].placeNumber - options[i].frozenNumber;
            }else{
                frozenSum += options[i].frozenNumber - options[i].placeNumber;
            }
        }
        uint256 k = amount/sum;
        tokenIds = new uint256[](options.length);
        //放入到做市池子里的金额：
        for (uint8 i = 0; i < options.length; i++){
            options[i].marketNumber  += options[i].marketNumber * k;
            if(options[i].placeNumber > options[i].frozenNumber){ //下单的金额
                uint256 placeNumber = (options[i].placeNumber - options[i].frozenNumber)*k;
                options[i].placeNumber += placeNumber;
                uint256 optionP = frozenSum / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender,'');
                PlayInfoStruct memory playInfo;
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                playInfoMap[tokenId] = playInfo;
                tokenIds[i] = tokenId;
            }else{ //冻结的金额
                options[i].frozenNumber += (options[i].frozenNumber - options[i].placeNumber)*k;
            }
        }
        //以第一个池子的数来计算生成的做市币数量
        liquidity = options[0].marketNumber *k;
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), amount);
        //转做市代币，转生成的交易代币
        TransferHelper.safeTransferFrom(address(this), address(this), msg.sender, liquidity);
    }

    function removeLiquidity(address _token, uint256 liquidity) public returns(uint256 amount,uint256[] memory tokenIds){
        require(token != _token,'NoodleSwap: Forbidden');
        require(block.timestamp > endTime,'NoodleSwap: Game End');
        uint balance     = IERC20(_token).balanceOf(address(msg.sender));
        require(balance < liquidity, 'NoodleSwap: address have not enough amount');

        //从池子里拿出的金额
        uint256 k = liquidity/totalSupply;

        uint256 sum = 0;
        uint256 frozenSum = 0;
        for (uint8 i = 0; i < options.length; i++){
            sum += options[i].marketNumber * k;
            options[i].marketNumber = options[i].marketNumber * (1 - k);
            
            if(options[i].placeNumber > options[i].frozenNumber){
                frozenSum += (options[i].placeNumber - options[i].frozenNumber)*k;
                options[i].frozenNumber += (options[i].placeNumber - options[i].frozenNumber)*k;
            }
        }
        tokenIds = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++){
            if(options[i].placeNumber < options[i].frozenNumber){
                uint256 placeNumber = (options[i].frozenNumber - options[i].placeNumber)*k;
                sum = sum - placeNumber;
                options[i].placeNumber += placeNumber;
                uint256 optionP = frozenSum/placeNumber + 1;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender,'');
                PlayInfoStruct memory playInfo;
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                playInfoMap[tokenId] = playInfo;
                tokenIds[i] = tokenId;
            }
        }
        TransferHelper.safeTransferFrom(address(this), msg.sender, address(this), liquidity);
        TransferHelper.safeTransferFrom(token, address(this),msg.sender,sum);
    }

    function getAward(
        uint256 tokenId
    ) private returns (uint256 amount) {
        PlayInfoStruct memory playInfo = playInfoMap[tokenId];
        //todo: 要加一些条件校验
        if(playInfo.option == winOption){ //用户赢了，则将币转给用户

        }
    }

    function stakeGame(uint deadline) public{
        require(openAddress != address(0),'NoodleSwap: the game has openAddress');
        uint balance = IERC20(gameToken).balanceOf(address(msg.sender));
        require(balance < stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(gameToken, msg.sender, address(this), stakeNumber);
        openAddress = msg.sender;
    }

    function openGame(uint8 _winOption) public{
        require(openAddress != msg.sender,'NoodleSwap: cannot open game');
        winOption = _winOption;
        endTime = block.timestamp;
    }

    function challengeGame(uint8 challengeOption) public returns (address _vote){
        require(openAddress != address(0),'NoodleSwap: the game has openAddress');
        uint balance = IERC20(gameToken).balanceOf(address(msg.sender));
        require(balance < stakeNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(gameToken, msg.sender, address(this), stakeNumber);
        vote = address(new Vote(address(this)));
    }

    function openGameWithVote() public{
        winOption = Vote(vote).winOption();
        endTime = block.timestamp;
    }
}
