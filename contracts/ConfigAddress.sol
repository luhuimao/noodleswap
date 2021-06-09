// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract ConfigAddress {
    event UpsertGameToken(address indexed factoryAddress, address indexed tokenAddress, string tokenSymbol);
    event UpsertConfig(
        address indexed factoryAddress,
        uint256 indexed chainId,
        address ndlToken,
        address wethToken,
        address usdtToken,
        string rpcUrl,
        string blockUrl,
        string networkName,
        address voteAddress
    );
    struct Config {
        // 工厂合约地址
        address factoryAddress;
        // 投票合约地址,治理代币
        address voteAddress;
        // 保证金合约地址,治理代币
        address ndlToken;
        // WETH合约地址
        address wethToken;
        // USDT合约地址
        address usdtToken;
        // 区块浏览器地址
        string blockUrl;
        // RPC地址
        string rpcUrl;
        // 网络名称
        string networkName;
        // chain_id
        uint256 chainId;
        // 其他用来游戏的代币也可以随时配置添加
        mapping(string => address) gameTokenMap;
    }

    mapping(address => Config) public configMap;

    address private _owner;

    constructor() {
        _owner = msg.sender;
    }

    //插入更新
    function upsert(
        address factoryAddress,
        uint256 chainId,
        address ndlToken,
        address wethToken,
        address usdtToken,
        string memory rpcUrl,
        string memory blockUrl,
        string memory networkName,
        address voteAddress
    ) public {
        require(_owner == msg.sender, 'only owner can upsert');
        require(factoryAddress != address(0), 'factoryAddress invalid');
        require(ndlToken != address(0), 'ndlToken invalid');
        require(wethToken != address(0), 'wethToken invalid');
        require(usdtToken != address(0), 'usdtToken invalid');
        Config storage config = configMap[factoryAddress];
        config.factoryAddress = factoryAddress;
        config.wethToken = wethToken;
        config.ndlToken = ndlToken;
        config.usdtToken = usdtToken;
        config.blockUrl = blockUrl;
        config.rpcUrl = rpcUrl;
        config.networkName = networkName;
        config.chainId = chainId;
        config.voteAddress = voteAddress;
        emit UpsertConfig(
            factoryAddress,
            chainId,
            ndlToken,
            wethToken,
            usdtToken,
            rpcUrl,
            blockUrl,
            networkName,
            voteAddress
        );
    }

    /*
  function getConfig(address factoryAddress) public view returns(Config storage config) {
    return config = configMap[factoryAddress];
  }
  // */

    function updateVoteAddress(address factoryAddress, address voteAddress) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            config.ndlToken,
            config.wethToken,
            config.usdtToken,
            config.rpcUrl,
            config.blockUrl,
            config.networkName,
            voteAddress
        );
    }

    function updateGstToken(address factoryAddress, address ndlToken) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            ndlToken,
            config.wethToken,
            config.usdtToken,
            config.rpcUrl,
            config.blockUrl,
            config.networkName,
            config.voteAddress
        );
    }

    function updateWethToken(address factoryAddress, address wethToken) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            config.ndlToken,
            wethToken,
            config.usdtToken,
            config.rpcUrl,
            config.blockUrl,
            config.networkName,
            config.voteAddress
        );
    }

    function updateUsdtToken(address factoryAddress, address usdtToken) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            config.ndlToken,
            config.wethToken,
            usdtToken,
            config.rpcUrl,
            config.blockUrl,
            config.networkName,
            config.voteAddress
        );
    }

    function updateRpcUrl(address factoryAddress, string memory rpcUrl) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            config.ndlToken,
            config.wethToken,
            config.usdtToken,
            rpcUrl,
            config.blockUrl,
            config.networkName,
            config.voteAddress
        );
    }

    function updateBlockUrl(address factoryAddress, string memory blockUrl) public {
        Config storage config = configMap[factoryAddress];
        upsert(
            config.factoryAddress,
            config.chainId,
            config.ndlToken,
            config.wethToken,
            config.usdtToken,
            config.rpcUrl,
            blockUrl,
            config.networkName,
            config.voteAddress
        );
    }

    function upsertGameToken(
        address factoryAddress,
        address tokenAdress,
        string memory tokenSymbol
    ) public {
        require(_owner == msg.sender, 'only owner can upsertGameToken');
        Config storage config = configMap[factoryAddress];
        config.gameTokenMap[tokenSymbol] = tokenAdress;
        emit UpsertGameToken(factoryAddress, tokenAdress, tokenSymbol);
    }

    function getGameToken(address factoryAddress, string memory tokenSymbol) public view returns (address) {
        Config storage config = configMap[factoryAddress];
        return config.gameTokenMap[tokenSymbol];
    }
}
