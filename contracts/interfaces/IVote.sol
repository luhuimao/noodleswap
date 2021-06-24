// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IVote {

    event _startVote(address indexed game, address indexed sender,uint8  _originOption,uint8 _challengeOption,uint256 _optionLength,uint256 _endTime);
    
    event _addVote(address indexed game, address indexed sender, uint8 option,uint256[] voteNumbers,uint8 winOption);

    function startVote(address game,
            address _creator,
            uint8 _originOption,
            uint8 _challengeOption,
            uint256 _optionLength,
            uint256 _endTime) external;
    
    function add(address game,
            address sender,
            uint8 option)  external payable;
}
