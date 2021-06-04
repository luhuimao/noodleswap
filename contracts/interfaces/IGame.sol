// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IGame {
    function createGame(
        address _token,
        string memory _gameName,
        string[] memory _optionName,
        uint256[] memory _optionNum,
        string memory _resultSource,
        uint256 _endTime
    ) external returns (address game);

    event _placeGame(
        address indexed sender,
        address indexed game,
        address indexed token,
        uint8[] options,
        uint256[] optionNum,
        uint256[] tokenIds
    );
    event _addLiquidity(
        address indexed sender,
        address indexed game,
        address indexed token,
        uint256 amount,
        uint256 liquidity,
        uint256[] tokenIds
    );
    event _removeLiquidity(
        address indexed sender,
        address indexed game,
        address indexed token,
        uint256 liquidity,
        uint256 amount,
        uint256[] tokenIds
    );
    event _stakeGame(address indexed sender, address indexed game, address indexed token, uint256 amount);
    event _openGame(address indexed sender, address indexed game, uint256 option);
    event _challengeGame(
        address indexed sender,
        address indexed game,
        uint256 originOption,
        uint256 challengeOption,
        address vote
    );
    event _openGameWithVote(address indexed sender, address indexed game, address vote, uint256 voteOption);
}
