// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IGame {
    function placeGame(
        address _token,
        uint8[] memory _options,
        uint256[] memory _optionNum,
        uint256 _endTime
    ) external payable returns (uint256[] memory tokenIds);

    function addLiquidity(address _token, uint256 amount)
        external
        returns (uint256 liquidity, uint256[] memory tokenIds);

    function removeLiquidity(uint256 liquidity,uint256 _endTime)
        external
        returns (uint256 amount, uint256[] memory tokenIds);

    function removeLiquidityWithPermit(uint256 _liquidity,
        uint256 _endTime,
        uint8 v, bytes32 r, bytes32 s)
        external
        returns (uint256 amount, uint256[] memory tokenIds);

    function mint(address _to,uint256 liquidity) external;

    function stakeGame(uint256 deadline) external;

    function openGame(uint8 _winOption) external;

    function challengeGame(uint8 challengeOption) external returns (address _vote);

    function openGameWithVote() external;

    event _placeGame(
        address indexed game,
        address indexed token,
        address indexed sender,
        uint8[] options,
        uint256[] optionNum,
        uint256[] tokenIds
    );
    event _addLiquidity(
        address indexed game,
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 liquidity,
        uint256[] tokenIds
    );
    event _removeLiquidity(
        address indexed game,
        address indexed sender,
        uint256 liquidity,
        uint256 amount,
        uint256[] tokenIds
    );

    event _getAward(
        address indexed game, 
        address indexed token, 
        address indexed sender, 
        uint256[] tokenIds,
        uint256 amount
    );
    
    event _stakeGame(address indexed game, address indexed token, address indexed sender, uint256 amount);
    
    event _openGame(address indexed game, address indexed sender, uint256 option);
    
    event _challengeGame(
        address indexed sender,
        address indexed game,
        uint256 originOption,
        uint256 challengeOption,
        address vote
    );
    
    event _openGameWithVote(address indexed game, address indexed sender, address vote, uint256 voteOption);
}
