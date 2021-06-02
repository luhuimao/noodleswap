// SPDX-License-Identifier: MIT
pragma solidity = 0.8.3;
interface IGame {
    function createGame(
        address _token,
        string _gameName,
        string[] _optionName,
        uint[] _optionNum,
        string _resultSource,
        uint _endTime
    ) public returns(address game);
}