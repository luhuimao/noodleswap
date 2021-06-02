pragma solidity = 0.8.3;

import './interfaces/IGame.sol';
import './NoodleGameERC20.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './interfaces/IGameFactory.sol';
import './ConfigurableParametersContract.sol';

contract Game is IGame, NoodleGameERC20,ConfigurableParametersContract {

    using SafeMath  for uint;

    struct OptionDataStruct {
        uint256 marketNumber;
        uint256 placeNumber;
        uint256 frozenNumber;
    }

    event placeGame(address sender,address game,address token,string[] options,uint[] optionNum,uint256[] tokenId);
    event addLiquidity(address sender,address game,address token,uint256 amount,uint256 liquidity,uint256 tokenId);
    event removeLiquidity(address sender,address game,address token,uint256 liquidity,uint256 amount,uint256 tokenId);
    event stakeGame(address sender,address game,address token,uint256 amount);
    event openGame(address sender,address game,uint option);
    event challengeGame(address sender,address game,uint originOption,uint challengeOption,address vote);
    event openGameWithVote(address sender,address game,address vote,uint voteOption);

    address public game;
    address public noodleGameToken;
    uint256  public endTime;
    uint8  public originOption;
    uint256 public originVoteNumber;

    uint8 public challengeOption;
    uint256 public challengeVoteNumber;

    uint8 public winOption;

    uint256 public award;

    mapping (address=>uint8) optionMap;

    constructor() public {
        game = msg.sender;
    }

    // called once by the factory at time
    function initialize(address _token,string _gameName,string[] _optionName,uint256[] _optionNum,string _resultSource,uint256 _endTime) external {
        require(msg.sender == factory, 'NoodleSwap: FORBIDDEN'); 
        token = _token;
        gameName = _gameName;
        optionName = _optionName;
        optionNum = _optionNum;
        resultSource = _resultSource;
        endTime = _endTime;
        ownerFee = 0.02;
        platformFee = 0.02;
        for (uint8 i = 0; i < optionNum.length; i++) {
            OptionDataStruct option = new OptionDataStruct();
            option.marketNumber = optionNum[i];
            option.placeNumber = 0;
            option.frozenNumber = 0;
            options.push(option);
        }
    }

    function add(uint8 option){
        require(endTime > block.timestamp, 'NoodleSwap: Vote end');
        uint balance = IERC20(_token).balanceOf(address(msg.sender));
        require(balance <= voteNumber, 'NoodleSwap: address have not enough amount');
        totalSupply = totalSupply - voteNumber;
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, this, voteNumber);
        optionMap[msg.sender] = option;
        if(option == originOption){
            originVoteNumber += 1;
        }else if(option == challengeOption){
            challengeVoteNumber += 1;
        }
    }

    function confirm(){
        require(endTime < block.timestamp, 'NoodleSwap: Vote cannot confirm before end');
        if(challengeVoteNumber > originVoteNumber * 2){
            winOption = challengeOption;
            award = 500 / challengeVoteNumber;
        }else{
            winOption = originOption;
            award = 500 / originVoteNumber;
        }
    }

    function getAward(){
        require(endTime < block.timestamp, 'NoodleSwap: Vote cannot confirm before end');
        uint8 option = optionMap[msg.sender];
        if(option == winOption){
            TransferHelper.safeTransferFrom(noodleToken, this, msg.sender, award);
        }
    }
    
}