// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract ConfigAddress {
    event UpsertGameToken(address indexed factoryAddress, address indexed tokenAddress, string tokenSymbol);
    event UpsertConfig(
        address indexed factoryAddress,
        uint256 indexed chainId,
        address ndlToken,
        address usdtToken,
        string rpcUrl,
        string blockUrl,
        string networkName,
        address voteAddress,
        address stakingAddress,
        address playNFTAddress,
        address configAddress
    );
    struct Config {
        // 配置文件合约地址
        address configAddress;
        // 工厂合约地址
        address factoryAddress;
        // 投票合约地址,治理代币
        address voteAddress;
        // 质押合约
        address stakingAddress;
        // NFT合约地址
        address playNFTAddress;
        // 水龙头合约地址
        address faucetAddress;
        // 保证金合约地址,治理代币
        address ndlToken;
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
        address[] gameTokenList;
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
        address usdtToken,
        string memory rpcUrl,
        string memory blockUrl,
        string memory networkName,
        address voteAddress,
        address stakingAddress,
        address playNFTAddress
    ) public {
        require(_owner == msg.sender, 'only owner can upsert');
        Config storage config = configMap[factoryAddress];
        config.factoryAddress = factoryAddress;
        config.ndlToken = ndlToken;
        config.usdtToken = usdtToken;
        config.blockUrl = blockUrl;
        config.rpcUrl = rpcUrl;
        config.networkName = networkName;
        config.chainId = chainId;
        config.voteAddress = voteAddress;
        config.stakingAddress = stakingAddress;
        config.playNFTAddress = playNFTAddress;
        config.configAddress = address(this);
        emit UpsertConfig(
            factoryAddress,
            chainId,
            ndlToken,
            usdtToken,
            rpcUrl,
            blockUrl,
            networkName,
            voteAddress,
            stakingAddress,
            playNFTAddress,
            address(this)
        );
    }

    /*
  function getConfig(address factoryAddress) public view returns(Config storage config) {
    return config = configMap[factoryAddress];
  }
  // */

    function upsertGameToken(
        address factoryAddress,
        address tokenAddress,
        string memory tokenSymbol
    ) public returns (uint256 ret) {
        require(_owner == msg.sender, 'only owner can upsertGameToken1');
        Config storage config = configMap[factoryAddress];
        config.gameTokenMap[tokenSymbol] = tokenAddress;
        bool ok = false;
        for (uint256 index = 0; index < config.gameTokenList.length; index++) {
            if (config.gameTokenList[index] == tokenAddress) {
                ok = true;
                break;
            }
        }
        if (ok == false) {
            config.gameTokenList.push(tokenAddress);
        }
        ret = 1;
        emit UpsertGameToken(factoryAddress, tokenAddress, tokenSymbol);
    }

    function getGameToken(address factoryAddress, string memory tokenSymbol) public view returns (address) {
        Config storage config = configMap[factoryAddress];
        return config.gameTokenMap[tokenSymbol];
    }

    function getLen(address factoryAddress, uint256 index) public view returns (address) {
        Config storage config = configMap[factoryAddress];
        return config.gameTokenList[index];
    }

    function faucetAll(
        address factoryAddress,
        address to,
        uint256 wad
    ) public {
        Config storage config = configMap[factoryAddress];
        if (config.usdtToken != address(0)) {
            faucet(config.usdtToken, to, wad);
        }
        if (config.ndlToken != address(0)) {
            faucet(config.ndlToken, to, wad);
        }
        for (uint256 index = 0; index < config.gameTokenList.length; index++) {
            address tokenAddress = config.gameTokenList[index];
            faucet(tokenAddress, to, wad);
        }
    }

    function faucet(
        address tokenAddress,
        address to,
        uint256 wad
    ) public {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(tokenAddress)
        }
        require(size > 0);
        (bool success, bytes memory returndata) =
            // tokenAddress.delegatecall(abi.encodeWithSelector(bytes4(keccak256('faucet(address,uint256)')), to, wad));
            tokenAddress.call(abi.encodeWithSelector(bytes4(keccak256('faucet(address,uint256)')), to, wad));
        if (success) {
            return;
        }
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly

            // solhint-disable-next-line no-inline-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert('fatter err');
        }
    }
}
