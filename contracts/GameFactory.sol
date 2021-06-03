// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import './interfaces/IGameFactory.sol';
import './Game.sol';

contract GameFactory is IGameFactory {

    modifier ensure(uint endTime) {
        require(endTime >= block.timestamp, 'NoodleSwapFactory: EXPIRED');
        _;
    }

    event _GameCreated(address _token,
        string _gameName,
        string[] _optionName,
        uint[] _optionNum,
        string _resultSource,
        uint _endTime,
        address _game);

    function createGame(
        address _token,
        string _gameName,
        string[] _optionName,
        uint[] _optionNum,
        string _resultSource,
        uint _endTime
    )  ensure(_endTime) public returns(address game) {
        Game game = new Game(this,_token,_gameName,_optionName,_optionNum,_resultSource,_endTime);
        emit _GameCreated(_token,_gameName, _optionName,_optionNum,_resultSource,_endTime,address(game));
    }
}
