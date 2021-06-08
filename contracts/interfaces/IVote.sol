// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IVote {
    function winOption() external view returns (uint8);

    event _addVote(address indexed game, address indexed vote, address indexed sender, uint8 option);

    event _confirmVote(address indexed game, address indexed vote, address indexed sender, uint8 voteOption);

    event _getAward(address indexed game, address indexed vote, address indexed sender, uint256 amount);
}
