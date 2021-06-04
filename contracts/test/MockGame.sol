// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import '../interfaces/IGame.sol';
import '../GameERC20.sol';
import '../libraries/SafeMath.sol';
import '../interfaces/IERC20.sol';
import '../interfaces/IGameFactory.sol';
import '../ConfigurableParametersContract.sol';
import '../Vote.sol';
import '../PlayNFT.sol';

contract MockGame is IGame {
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
        require(gameEndTime < block.timestamp, 'NoodleSwapGame: Game End');
        _;
    }

    address public token;
    string public gameName;
    string public resultSource;
    uint256 public endTime;
    string[] public optionName;
    OptionDataStruct[] public options;

    mapping(uint256 => PlayInfoStruct) public playInfoMap;

    //创建者手续费
    uint8 public ownerFee = 2;

    //平台手续费
    uint8 public platformFee = 2;

    uint8 public winOption;

    address public gameToken;

    address public openAddress;

    address public vote;

    address private playNFT;

    constructor(
        address _token,
        string memory _gameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime
    ) {
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

    //下单
    function placeGame(
        address _token,
        uint8[] memory _options,
        uint256[] memory _optionNum,
        uint256 _endTime
    ) public payable override returns (uint256[] memory tokenIds) {}

    function addLiquidity(address _token, uint256 amount)
        public
        override
        returns (uint256 liquidity, uint256[] memory tokenIds)
    {
        emit _addLiquidity(address(this), _token, msg.sender, amount, liquidity, tokenIds);
    }

    function removeLiquidity(address _token, uint256 liquidity)
        public
        override
        returns (uint256 amount, uint256[] memory tokenIds)
    {}

    function getAward(uint256 tokenId) private returns (uint256 amount) {}

    function stakeGame(uint256 deadline) public override {}

    function openGame(uint8 _winOption) public override {}

    function challengeGame(uint8 challengeOption) public override returns (address _vote) {}

    function openGameWithVote() public override {}
}
