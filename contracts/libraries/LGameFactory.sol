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
        address _noodleToken,
        address _lockNoodleToken,
        address _playNTF
    ) public returns (address _game) {
        uint256 sum = 0;
        for (uint256 i = 0; i < _optionNum.length; i++) {
            sum += _optionNum[i];
        }
        Game game = new Game(msg.sender, _token, _shortGameName,_optionNum, _endTime, _noodleToken,_lockNoodleToken,_playNTF);
        game.mint(msg.sender, sum);
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

    function _none(uint256 a, uint256 b) public pure returns (uint256 p) {}
}
