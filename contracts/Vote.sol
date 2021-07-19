// SPDX-License-Identifier: GPL-3.0
//
pragma solidity ^0.8.3;

// import './interfaces/IGame.sol';
import './interfaces/IVote.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './ConfigurableParametersContract.sol';
import './libraries/TransferHelper.sol';

import 'hardhat/console.sol';

contract Vote is IVote, ConfigurableParametersContract {
    using SafeMath for uint256;

    address public noodleToken;

    struct VoteInfoStruct {
        address creator;
        bool start;
        uint256 endTime;
        uint8  originOption;
        uint8  challengeOption;
        uint256[] voteNumbers;
        uint8  winOption;
        uint256  optionLength;
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
            uint256 _optionLength,
            uint256 _endTime) public  override {
        VoteInfoStruct storage  voteInfo = voteMap[game];
        //require(voteInfo.start != true, 'NoodleSwap: Vote exist');
        voteInfo.start = true;
        voteInfo.creator = _creator;
        voteInfo.endTime = _endTime;
        voteInfo.originOption = _originOption;
        voteInfo.challengeOption = _challengeOption;
        voteInfo.optionLength = _optionLength;
        voteInfo.voteNumbers = new uint256[](_optionLength);
        voteMap[game] = voteInfo;
        console.log('start vote:',game);
        emit _startVote(game, _creator, _originOption,_challengeOption,_optionLength,_endTime);
    }

    function add(address game,address sender,uint8 option) public payable override {
        console.log('vote option:',option);
        //require(voteInfo.endTime > block.timestamp, 'NoodleSwap: Vote end');
        voteDataMap[sender][game] = option;
        // require(option > 0 && option < voteMap[game].optionLength, 'NoodleSwap: vote option valid');
        voteMap[game].voteNumbers[option] += 1;
        console.log(voteMap[game].voteNumbers[option]);
        //判断获胜条件
        uint256 max;
        uint256 originOptionNumber = voteMap[game].voteNumbers[voteMap[game].originOption];
        uint256 challengeOptionNumber = voteMap[game].voteNumbers[voteMap[game].challengeOption];
        uint8 winOption;
        if(originOptionNumber >= challengeOptionNumber){
            max = originOptionNumber;
            winOption = voteMap[game].originOption;
        }else{
            max = challengeOptionNumber;
            winOption = voteMap[game].challengeOption;
        }
        for (uint8 i = 0; i < voteMap[game].voteNumbers.length; i++) {
            if(max < voteMap[game].voteNumbers[i]){
                max = voteMap[game].voteNumbers[i];
                winOption = i;
            }
        }
        voteMap[game].winOption = winOption;
        emit _addVote(game, sender, option,voteMap[game].voteNumbers,winOption);
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
