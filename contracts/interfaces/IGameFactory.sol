// SPDX-License-Identifier: MIT
pragma solidity = 0.8.3;
interface IGameFactory {
    function createGame(address _token,
        string memory _gameName,
        string[] memory _optionName,
        uint[] memory _optionNum,
        string memory _resultSource,
        uint _endTime
    ) public returns(address game);
}