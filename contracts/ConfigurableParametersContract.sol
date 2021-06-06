// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.3;

contract ConfigurableParametersContract {
    
    //Contract owner
    address public owner = address(0);

    uint256 public stakeNumber = 100 ether;

    uint256 public voteNumber = 1;
    
    //Market rake, A few ten thousandths - （Need to expand n(rakeMagnificationMultiple) times）
    uint16 public marketRake = 0;
    //platform rake, A few ten thousandths - （Need to expand n(rakeMagnificationMultiple) times）
    uint16 public platformRake = 0;
    
    //Option interval
    uint8 public maximumNumber = 0;
    uint8 public smallestNumber = 0;
    
    //Result decision block height
    uint256 public resultBlockHeight = 0;
    
    //Tokens enabled by the contract
    mapping(address => bool) public enabledTokens;
    
    //Odds magnification multiple
    uint32 public oddsMagnificationMultiple = 1000000;
    
    //Rake magnification multiple
    uint32 public rakeMagnificationMultiple = 1000000;
    
    modifier onlyOwner {
        require(msg.sender == owner, "ERROR: Permission denied");
        _;
    }
    
    // constructor(uint16 _marketRake, uint16 _platformRake, uint8 _smallestNumber, uint8 _maximumNumber) {
    //     require(_marketRake >= 0 && _marketRake <= rakeMagnificationMultiple && _platformRake >= 0 && _platformRake <= rakeMagnificationMultiple && _smallestNumber >= 0 && _smallestNumber <= 127 && _maximumNumber >= 0 && _maximumNumber <= 127 && _smallestNumber <= _maximumNumber, "ERROR: Mismatched initialization parameters");
    //     marketRake = _marketRake;
    //     platformRake = _platformRake;
    //     maximumNumber = _maximumNumber;
    //     smallestNumber = _smallestNumber;
    //     owner = msg.sender;
    // }
    
    constructor() {
        owner = msg.sender;
        marketRake = 900;
        platformRake = 1100;
        maximumNumber = 4;
        smallestNumber = 3;
        resultBlockHeight = 100;
        enabledTokens[address(0xd9145CCE52D386f254917e481eB44e9943F39138)] = true;
    }
    
    //Set system parameters
    function setOwner(address newOwner) public onlyOwner returns (bool) {
        require(newOwner != address(0), "ERROR: Owner cannot be empty(address(0))");
        owner = newOwner;
        return true;
    }
    
    function setMarketRake(uint16 newMarketRake) public onlyOwner returns (bool) {
        require(newMarketRake < rakeMagnificationMultiple, "ERROR: Parameter error, need to be less than 100%");
        marketRake = marketRake;
        return true;
    }
    
    function setPlatformRake(uint16 newPlatformRake) public onlyOwner returns (bool) {
        require(newPlatformRake < rakeMagnificationMultiple, "ERROR: Parameter error, need to be less than 100%");
        platformRake = newPlatformRake;
        return true;
    }
    
    function setMaximumNumber(uint8 newMaximumNumber) public onlyOwner returns (bool) {
        require(newMaximumNumber >= smallestNumber && newMaximumNumber < 128, "ERROR: Parameter error, the set quantity is out of range");
        maximumNumber = newMaximumNumber;
        return true;
    }
    
    function setSmallestNumber(uint8 newSmallestNumber) public onlyOwner returns (bool) {
        require(newSmallestNumber <= maximumNumber, "ERROR: Parameter error, the set quantity is out of range");
        smallestNumber = newSmallestNumber;
        return true;
    }
    
    function setResultBlockHeight(uint256 newResultBlockHeight) public onlyOwner returns (bool) {
        require(newResultBlockHeight > 0, "ERROR: Parameter error, must be greater than 0");
        resultBlockHeight = newResultBlockHeight;
        return true;
    }
    
    function addEnabledTokens(address addEnabledToken) public onlyOwner returns (bool) {
        require(addEnabledToken != address(0), "ERROR: Token cannot be empty(address(0))");
        enabledTokens[addEnabledToken] = true;
        return true;
    }
    
    function deleteEnabledTokens(address delEnabledToken) public onlyOwner returns (bool) {
        require(delEnabledToken != address(0), "ERROR: Token cannot be empty(address(0))");
        enabledTokens[delEnabledToken] = false;
        return true;
    }
}