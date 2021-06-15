// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import '../PlayNFT.sol';
import 'hardhat/console.sol';
// a library for performing overflow-safe math, courtesy of DappHub (https://github.com/dapphub/ds-math)

library LGame {
    //option,optionNum,optionP,allFrozen,返回tokenId
    struct PlayInfoStruct {
        uint8 option;
        uint256 optionNum;
        uint256 optionP;
        uint256 allFrozen;
    }
    struct OptionDataStruct {
        uint256 marketNumber;
        uint256 placeNumber;
        uint256 frozenNumber;
    }

    //p = (b + placeB) / (a + placeA)
    function _calcOdd(LGame.OptionDataStruct memory a, LGame.OptionDataStruct memory b)
        public
        pure
        returns (uint256 p)
    {
        uint256 sumA = a.placeNumber + a.marketNumber - a.frozenNumber;
        uint256 sumB = (b.placeNumber + b.marketNumber - b.frozenNumber) * 100;
        p = sumB / sumA;
    }

    function createNFT() public returns (address) {
        return address(new PlayNFT());
    }

    function getAward(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        uint256[] memory tokenIds,
        uint8 winOption,
        address playNFT
    ) public returns (uint256 amount) {
        for (uint8 i = 0; i < tokenIds.length; i++) {
            require(msg.sender == PlayNFT(playNFT).ownerOf(tokenIds[i]), 'NoodleSwap: address have no right');
            console.log('play info:',self[tokenIds[i]].option);
            if (self[tokenIds[i]].option == 200) {
                continue;
            }
            if (self[tokenIds[i]].option == winOption) {
                //用户赢了，则将币转给用户
                amount += self[tokenIds[i]].allFrozen;
            }
            self[tokenIds[i]].option = 200; //表示已经领取
        }
    }

    function removeLiquidity(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        OptionDataStruct[] storage options,
        address playNFT,
        uint256 initMarketNumber,
        uint256 _liquidity
    )
        public
        returns (
            uint256[] memory tokenIds,
            uint256 sum,
            uint256 frozenSum
        )
    {
        for (uint8 i = 0; i < options.length; i++) {
            uint256 marketNumber = (options[i].marketNumber * _liquidity) / initMarketNumber;
            sum += marketNumber;
            options[i].marketNumber -= marketNumber;

            if (options[i].placeNumber > options[i].frozenNumber) {
                frozenSum += ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) / initMarketNumber;
                options[i].frozenNumber +=
                    ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) /
                    initMarketNumber;
            }
        }
        tokenIds = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++) {
            if (options[i].placeNumber < options[i].frozenNumber) {
                uint256 placeNumber =
                    ((options[i].frozenNumber - options[i].placeNumber) * _liquidity) / initMarketNumber;
                sum = sum - placeNumber;
                options[i].placeNumber += placeNumber;
                uint256 optionP = ((frozenSum + placeNumber) * 100) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                LGame.PlayInfoStruct storage playInfo = self[tokenId];
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                tokenIds[i] = tokenId;
            }
        }
    }

    function addLiquidity(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        OptionDataStruct[] storage options,
        address playNFT,
        uint256 amount
    )
        public
        returns (
            uint256[] memory tokenIds,
            uint256 sum,
            uint256 frozenSum
        )
    {
        for (uint8 i = 0; i < options.length; i++) {
            sum += options[i].marketNumber;
            if (options[i].placeNumber > options[i].frozenNumber) {
                sum += (options[i].placeNumber - options[i].frozenNumber);
            } else {
                frozenSum += (options[i].frozenNumber - options[i].placeNumber);
            }
        }
        tokenIds = new uint256[](options.length);
        //放入到做市池子里的金额：
        for (uint8 i = 0; i < options.length; i++) {
            options[i].marketNumber += (options[i].marketNumber * amount) / sum;
            if (options[i].placeNumber > options[i].frozenNumber) {
                //下单的金额
                uint256 placeNumber = ((options[i].placeNumber - options[i].frozenNumber) * amount) / sum;
                options[i].placeNumber += placeNumber;
                uint256 optionP = (frozenSum * 100) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                LGame.PlayInfoStruct storage playInfo = self[tokenId];
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                tokenIds[i] = tokenId;
            } else {
                //冻结的金额
                options[i].frozenNumber += ((options[i].frozenNumber - options[i].placeNumber) * amount) / sum;
            }
        }
    }

    function update(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        OptionDataStruct[] storage options,
        uint8[] memory _options,
        uint256[] memory _optionNum,
        address playNFT,
        uint256 ownerFee,
        uint256 platformFee
    ) public returns (uint256[] memory tokenIds) {
        for (uint8 i = 0; i < _options.length; i++) {
            options[_options[i]].placeNumber += _optionNum[i];
        }
        uint256[] memory currentFrozen = new uint256[](options.length);
        tokenIds = new uint256[](_options.length);
        for (uint8 i = 0; i < _options.length; i++) {
            uint8 optionId = _options[i];
            uint256 optionNum = _optionNum[i];
            uint256 allFrozen = 0;
            for (uint8 j = 0; j < options.length; j++) {
                if (j != optionId) {
                    //计算optionId 和 j 池子的赔率
                    uint256 p = _calcOdd(options[optionId], options[j]);
                    uint256 frozenJ = (optionNum * p) / 100;
                    currentFrozen[j] = frozenJ;
                    allFrozen += frozenJ;
                }
            }
            //这个选项的赔率
            uint256 optionP = (allFrozen * (100 - ownerFee - platformFee) + optionNum * 100) / optionNum;
            //调用生成ERC721 token的接口, option,optionNum,optionP,allFrozen,返回tokenId
            //可以考虑将这些信息放到uri这个字符串中
            uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
            // LGame.PlayInfoStruct memory playInfo = self[tokenId];
            self[tokenId].option = optionId;
            self[tokenId].optionNum = optionNum;
            self[tokenId].optionP = optionP;
            self[tokenId].allFrozen = allFrozen;
            tokenIds[i] = tokenId;
        }
        for (uint8 i = 0; i < options.length; i++) {
            options[i].frozenNumber = options[i].frozenNumber + currentFrozen[i];
        }
    }
}
