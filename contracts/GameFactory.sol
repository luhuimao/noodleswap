// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

import './interfaces/IGameFactory.sol';
import './libraries/LGameFactory.sol';

contract GameFactory is IGameFactory {
    modifier ensure(uint256 endTime) {
        require(endTime >= block.timestamp, 'NoodleSwapFactory: EXPIRED');
        _;
    }

    event _GameCreated(
        address indexed _token,
        address indexed _game,
        address indexed _owner,
        string _gameName,
        string _shortGameName,
        string[] _optionName,
        uint256[] _optionNum,
        string _resultSource,
        uint256 _endTime
    );

    using LGameFactory for mapping(address => LGameFactory.GameStruct);
    
    mapping(address => LGameFactory.GameStruct) public gameMap;

    address public noodleToken;

    address public vote;

    address public playNFT;

    constructor(address _noodleToken, address _vote,address _playNFT) {
        noodleToken = _noodleToken;
        vote = _vote;
        playNFT = _playNFT;
    }

    function createGame(
        address _token,
        string memory _gameName,
        string memory _shortGameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime
    ) public override ensure(_endTime) returns (address _game) {
        _game = gameMap.createGame(
            _token,
            _gameName,
            _shortGameName,
            _optionName,
            _optionNum,
            _resultSource,
            _endTime,
            noodleToken,
            vote,
            playNFT
        );
        emit _GameCreated(_token, _game, msg.sender, _gameName,_shortGameName, _optionName, _optionNum, _resultSource, _endTime);
    }
}
