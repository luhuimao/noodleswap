// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import '../PlayNFT.sol';
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
        uint256 initMarketNumber;
        uint256 marketNumber;
        uint256 placeNumber;
        uint256 frozenNumber;
        uint256 voteNumber;
    }

    //p = (b + placeB) / (a + placeA)
    function _calcOdd(LGame.OptionDataStruct memory a, LGame.OptionDataStruct memory b)
        public
        pure
        returns (uint256 p)
    {
        uint256 sumA = a.placeNumber + a.marketNumber - a.frozenNumber;
        uint256 sumB = (b.placeNumber + b.marketNumber - b.frozenNumber) * 1 ether;
        p = sumB / sumA;
    }

    function getAward(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        uint256[] memory tokenIds,
        uint8 winOption,
        address playNFT
    ) public returns (uint256 amount) {
        uint256 len = tokenIds.length;
        for (uint8 i = 0; i < len; ) {
            require(msg.sender == PlayNFT(playNFT).ownerOf(tokenIds[i]), 'NoodleSwap: address have no right');
            uint8 option = self[tokenIds[i]].option;
            if (option != 200) {
                if (option == winOption) {
                    // 用户赢了，则将币转给用户
                    amount += self[tokenIds[i]].optionNum + self[tokenIds[i]].allFrozen;
                }
                self[tokenIds[i]].option = 200; // 标记已经领取
            }
            unchecked { ++i; }
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
            uint256 frozenSum,
            uint256 liquidityNum
        )
    {
        uint256 initSum;
        for (uint8 i = 0; i < options.length; i++) {
            initSum += options[i].initMarketNumber;
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
            uint256 marketNumber ;
            if(sum > 0){
                marketNumber = (options[i].marketNumber * amount) / sum;
            }else{
                marketNumber = (options[i].initMarketNumber * amount) / initSum;
            }
            options[i].marketNumber += marketNumber;
            liquidityNum += marketNumber;
            if (options[i].placeNumber > options[i].frozenNumber) {
                //下单的金额
                uint256 placeNumber = ((options[i].placeNumber - options[i].frozenNumber) * amount) / sum;
                options[i].placeNumber += placeNumber;
                uint256 optionP = (frozenSum * 1 ether) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                LGame.PlayInfoStruct storage playInfo = self[tokenId];
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                tokenIds[i] = tokenId;
            } else if((options[i].placeNumber < options[i].frozenNumber)){
                //冻结的金额
                options[i].frozenNumber += ((options[i].frozenNumber - options[i].placeNumber) * amount) / sum;
            }
        }
    }

    function removeLiquidity(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        OptionDataStruct[] storage options,
        address playNFT,
        uint256 _liquidity
    )
        public
        returns (
            uint256[] memory tokenIds,
            uint256 sum,
            uint256 frozenSum
        )
    {
        uint256 sumMarketNumber = 0;
        for(uint8 i = 0; i < options.length; i++) {
            sumMarketNumber += options[i].marketNumber;
        }
        for (uint8 i = 0; i < options.length; i++) {
            uint256 marketNumber = (options[i].marketNumber * _liquidity) / sumMarketNumber;
            sum += marketNumber;
            options[i].marketNumber -= marketNumber;

            if (options[i].placeNumber > options[i].frozenNumber) {
                frozenSum += ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) / sumMarketNumber;
            }
        }
        tokenIds = new uint256[](options.length);
        for (uint8 i = 0; i < options.length; i++) {
            if (options[i].placeNumber < options[i].frozenNumber) {
                uint256 placeNumber =
                    ((options[i].frozenNumber - options[i].placeNumber) * _liquidity) / sumMarketNumber;
                sum = sum - placeNumber;
                options[i].placeNumber += placeNumber;
                uint256 optionP = ((frozenSum + placeNumber) * 1 ether) / placeNumber;
                //调用生成ERC721 token的接口, i,placeNumber,optionP,frozenSum,返回tokenId
                uint256 tokenId = PlayNFT(playNFT).createNFT(msg.sender, '');
                LGame.PlayInfoStruct storage playInfo = self[tokenId];
                playInfo.option = i;
                playInfo.optionNum = placeNumber;
                playInfo.optionP = optionP;
                playInfo.allFrozen = frozenSum;
                tokenIds[i] = tokenId;
            }else if(options[i].placeNumber > options[i].frozenNumber){
                options[i].frozenNumber +=
                    ((options[i].placeNumber - options[i].frozenNumber) * _liquidity) /
                    sumMarketNumber;
            }
        }
    }

    function removeLiquidityWithWinOption (
        mapping(uint256 => LGame.PlayInfoStruct) storage, // self (unused)
        OptionDataStruct[] storage options,
        uint256 totalSupply,
        uint256 _liquidity,
        uint256 winOption,
        uint256 marketFee
    )
        public view 
        returns (uint256 sum){
        for (uint8 i = 0; i < options.length; i++) {
            if(winOption == i){
                sum += options[i].marketNumber;
                sum   += options[i].frozenNumber;
            }else{
                sum  += options[i].marketNumber;
                sum   += options[i].placeNumber;
                sum   -= options[i].frozenNumber;
            }
        }
        sum += marketFee;
        sum = sum * _liquidity / totalSupply;
    }

    function update(
        mapping(uint256 => LGame.PlayInfoStruct) storage self,
        OptionDataStruct[] storage options,
        uint8[] memory _options,
        uint256[] memory _optionNum,
        address playNFT,
        uint256 feeRate
    ) public returns (uint256[] memory tokenIds, uint256 fee) {
        // 第一步: 更新 placeNumber 和计算手续费
        for (uint8 i = 0; i < _options.length; ) {
            options[_options[i]].placeNumber += (_optionNum[i] * (1000 - feeRate)) / 1000;
            fee += (_optionNum[i] * feeRate) / 1000;
            unchecked { ++i; }
        }
        
        tokenIds = new uint256[](_options.length);
        uint256[] memory currentFrozen = new uint256[](options.length);
        
        // 第二步: 生成 NFT
        for (uint8 i = 0; i < _options.length; ) {
            uint256 allFrozen;
            uint256 adjustedNum = (_optionNum[i] * (1000 - feeRate)) / 1000;
            
            // 计算冻结金额
            for (uint8 j = 0; j < options.length; ) {
                if (j != _options[i]) {
                    currentFrozen[j] = (adjustedNum * 
                        (options[j].placeNumber + options[j].marketNumber - options[j].frozenNumber) * 1 ether) / 
                        (options[_options[i]].placeNumber + options[_options[i]].marketNumber - options[_options[i]].frozenNumber) / 1 ether;
                    allFrozen += currentFrozen[j];
                }
                unchecked { ++j; }
            }
            
            // 铸造 NFT
            tokenIds[i] = PlayNFT(playNFT).createNFT(msg.sender, '');
            self[tokenIds[i]].option = _options[i];
            self[tokenIds[i]].optionNum = adjustedNum;
            self[tokenIds[i]].optionP = ((allFrozen + adjustedNum) * 1 ether) / adjustedNum;
            self[tokenIds[i]].allFrozen = allFrozen;
            
            unchecked { ++i; }
        }
        
        // 第三步: 更新冻结金额
        for (uint8 i = 0; i < options.length; ) {
            options[i].frozenNumber += currentFrozen[i];
            unchecked { ++i; }
        }
    }
}
