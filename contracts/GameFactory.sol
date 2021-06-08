// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import './interfaces/IGameFactory.sol';
import './Game.sol';

contract GameFactory is IGameFactory {
    modifier ensure(uint256 endTime) {
        require(endTime >= block.timestamp, 'NoodleSwapFactory: EXPIRED');
        _;
    }

    struct GameStruct {
        address creator;
        address token;
        string gameName;
        string resultSource;
        uint256 endTime;
        string[] optionName;
    }

    event _GameCreated(
        address indexed _token,
        address indexed _game,
        address indexed _owner,
        string _gameName,
        string[] _optionName,
        uint256[] _optionNum,
        string _resultSource,
        uint256 _endTime
    );

    mapping(address => GameStruct) public gameMap;

    address public noodleToken;

    constructor(address _noodleToken) {
        noodleToken = _noodleToken;
    }

    function createGame(
        address _token,
        string memory _gameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime
    ) public override ensure(_endTime) returns (address _game) {
        // Game game = new Game(msg.sender, _token, _gameName, _optionName, _optionNum, _resultSource, _endTime,noodleToken);
        Game game = new Game(msg.sender, _token, _optionNum, _endTime,noodleToken);
        //取第一个option的金额作为liquidity
        game.mint(msg.sender, _optionNum[0]);
        _game = address(game);
        GameStruct memory gameStruct;
        gameStruct.creator = msg.sender;
        gameStruct.token = _token;
        gameStruct.gameName = _gameName;
        gameStruct.resultSource = _resultSource;
        gameStruct.endTime = _endTime;
        gameStruct.optionName = _optionName;
        gameMap[_game] = gameStruct;
        emit _GameCreated(_token, _game, msg.sender, _gameName, _optionName, _optionNum, _resultSource, _endTime);
    }
}
