// SPDX-License-Identifier: GPL-3.0
//
pragma solidity ^0.8.3;

import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './ConfigurableParametersContract.sol';
import './libraries/TransferHelper.sol';

contract Vote is ConfigurableParametersContract {

    using SafeMath  for uint;

    address public game;
    address public noodleGameToken;
    uint256  public endTime;
    uint8  public originOption;
    uint256 public originVoteNumber;

    uint8 public challengeOption;
    uint256 public challengeVoteNumber;

    uint8 public winOption;

    uint256 public award;

    address public noodleToken;

    mapping (address=>uint8) optionMap;

    constructor(address _game) {
        game = _game;
    }

    // called once by the factory at time

    function add(uint8 option) public{
        require(endTime > block.timestamp, 'NoodleSwap: Vote end');
        uint balance = IERC20(noodleToken).balanceOf(address(msg.sender));
        require(balance <= voteNumber, 'NoodleSwap: address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, msg.sender, address(this), voteNumber);
        optionMap[msg.sender] = option;
        if(option == originOption){
            originVoteNumber += 1;
        }else if(option == challengeOption){
            challengeVoteNumber += 1;
        }
    }

    function confirm() public{
        require(endTime < block.timestamp, 'NoodleSwap: Vote cannot confirm before end');
        if(challengeVoteNumber > originVoteNumber * 2){
            winOption = challengeOption;
            award = 500 / challengeVoteNumber;
        }else{
            winOption = originOption;
            award = 500 / originVoteNumber;
        }
    }

    function getAward() public{
        require(endTime < block.timestamp, 'NoodleSwap: Vote cannot confirm before end');
        uint8 option = optionMap[msg.sender];
        if(option == winOption){
            TransferHelper.safeTransferFrom(noodleToken, address(this), msg.sender, award);
        }
    }
    
}
