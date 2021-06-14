// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

// a library for performing overflow-safe math, courtesy of DappHub (https://github.com/dapphub/ds-math)

import '../Game.sol';

library LGameFactory {
    struct GameStruct {
        address creator;
        address token;
        string gameName;
        string shortGameName;
        string resultSource;
        uint256 endTime;
        string[] optionName;
    }

    function createGame(
        mapping(address => LGameFactory.GameStruct) storage gameMap,
        address _token,
        string memory _gameName,
        string memory _shortGameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime,
        address noodleToken,
        address vote
    ) public returns (address _game) {
        // Game game = new Game(msg.sender, _token, _gameName, _optionName, _optionNum, _resultSource, _endTime,noodleToken);
        Game game = new Game(msg.sender, _token, _shortGameName,_optionNum, _endTime, noodleToken, vote);
        //取第一个option的金额作为liquidity
        game.mint(msg.sender, _optionNum[0]);
        _game = address(game);
        GameStruct memory gameStruct;
        gameStruct.creator = msg.sender;
        gameStruct.token = _token;
        gameStruct.gameName = _gameName;
        gameStruct.shortGameName = _shortGameName;
        gameStruct.resultSource = _resultSource;
        gameStruct.endTime = _endTime;
        gameStruct.optionName = _optionName;
        gameMap[_game] = gameStruct;
    }

    //option,optionNum,optionP,allFrozen,返回tokenId
    //p = (b + placeB) / (a + placeA)
    function _none(uint256 a, uint256 b) public pure returns (uint256 p) {}
}
