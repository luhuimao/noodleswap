// SPDX-License-Identifier: GPL-3.0
//
pragma solidity ^0.8.3;

// import './interfaces/IGame.sol';
import './interfaces/IVote.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './ConfigurableParametersContract.sol';
import './libraries/TransferHelper.sol';

contract Vote is IVote, ConfigurableParametersContract {
    using SafeMath for uint256;

    address public noodleToken;
    struct VoteInfoStruct {
        address creator;
        bool start;
        uint256 endTime;
        uint8  originOption;
        uint256  originVoteNumber;
        uint8  challengeOption;
        uint256  challengeVoteNumber;
        uint8  winOption;
    }

    mapping(address => VoteInfoStruct) public voteMap;

    mapping(address => mapping(address => uint8)) public voteDataMap;

    constructor(address _noodleToken) {
        noodleToken = _noodleToken;
    }

    function startVote(address game,
            address _creator,
            uint8 _originOption,
            uint8 _challengeOption,
            uint256 _endTime) public  override {
        VoteInfoStruct memory  voteInfo = voteMap[game];
        require(voteInfo.start != true, 'NoodleSwap: Vote exist');
        voteInfo.start = true;
        voteInfo.creator = _creator;
        voteInfo.endTime = _endTime;
        voteInfo.originOption = _originOption;
        voteInfo.originVoteNumber = 0;
        voteInfo.challengeOption = _challengeOption;
        voteInfo.challengeVoteNumber = 0;
        emit _startVote(game, _creator, _originOption,_challengeOption,_endTime);
    }

    function add(address game,address sender,uint8 option) public payable override {
        VoteInfoStruct memory  voteInfo = voteMap[game];
        require(voteInfo.endTime > block.timestamp, 'NoodleSwap: Vote end');
        uint256 balance = IERC20(noodleToken).balanceOf(sender);
        require(balance >= voteNumber, 'NoodleSwap: vote address have not enough amount');
        TransferHelper.safeTransferFrom(noodleToken, sender, address(this), voteNumber);
        voteDataMap[sender][game] = option;
        if (option == voteInfo.originOption) {
            voteInfo.originVoteNumber += 1 ether;
        } else if (option == voteInfo.challengeOption) {
            voteInfo.challengeVoteNumber += 1 ether;
        }
        if (voteInfo.challengeVoteNumber > voteInfo.originVoteNumber * 2) {
            voteInfo.winOption = voteInfo.challengeOption;
        } else {
            voteInfo.winOption = voteInfo.originOption;
        }
        emit _addVote(game, sender, option,voteInfo.originVoteNumber,voteInfo.challengeVoteNumber);
    }

    function getAward(address game,address sender) public {
        //require(endTime < block.timestamp, 'NoodleSwap: Vote cannot confirm before end');
        VoteInfoStruct memory  voteInfo = voteMap[game];
        uint8 option = voteDataMap[sender][game];
        if (option == voteMap[game].winOption) {
            //calc award
            uint256 award = 500 ether;
            TransferHelper.safeTransferFrom(noodleToken, address(this), sender, award);
        }
    }
}
