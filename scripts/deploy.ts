import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { GameFactory } from '../typechain/GameFactory';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import * as config from '../.config';
import { Contract } from 'ethers';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';

let main = async () => {
  console.log('network:', network.name, (await ethers.provider.getNetwork()).chainId);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  const ConfigAddressFactory = await ethers.getContractFactory('ConfigAddress');
  let tmpaddr = config.getConfigAddressByNetwork(network.name);
  if (tmpaddr == null) {
    console.error('config address null:', network.name);
    return;
  }
  const instanceConfigAddress = ConfigAddressFactory.connect(owner).attach(tmpaddr) as ConfigAddress;
  console.log('config address:', instanceConfigAddress.address);

  let tokens = config.getTokensByNetwork(network.name);
  if (tokens == null) {
    console.error('tokens address null:', network.name);
    return;
  }

  const instanceWETH9 = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('WETH9', 'WETH9', 18)) as ERC20Faucet;
  console.log('new WETH9 address:', instanceWETH9.address);

  const instanceNDLToken = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('NoodleToken', 'TDLT', 18)) as ERC20Faucet;
  console.log('new NoodleToken address:', instanceNDLToken.address);

  const instanceUSDT = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BUSDT', 'BUSDT', 6)) as ERC20Faucet;
  console.log('new BUSDT address:', instanceUSDT.address);

  const instanceGameFactory = (await (await ethers.getContractFactory('GameFactory'))
    .connect(owner)
    .deploy()) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);

  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'GAMEFACTORY_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceGameFactory.address + '"; ' + flag);

  const wethAddr = config.getTokenAddrBySymbol(tokens, 'WBNB');
  console.log('WETH address:', wethAddr);

  const usdtAddr = config.getTokenAddrBySymbol(tokens, 'BUSD');
  console.log('BUSD address:', usdtAddr);

  let gasprice = await owner.getGasPrice();
  let gaslimit = (await ethers.provider.getBlock('latest')).gasLimit;
  let blockNumber = await ethers.provider.getBlockNumber();
  console.log('gasPrice:', blockNumber, gasprice.toString(), ethers.utils.formatEther(gasprice));
  console.log('gasLimit:', blockNumber, gaslimit.toString(), ethers.utils.formatEther(gaslimit));

  //方便目前测试已经部署的业务
  let ret = await (
    await instanceConfigAddress.upsert(
      instanceGameFactory.address,
      (
        await ethers.provider.getNetwork()
      ).chainId,
      instanceNDLToken.address,
      instanceWETH9.address,
      instanceUSDT.address,
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://testnet.bscscan.com',
      network.name
    )
  ).wait();
  console.log('instanceConfigAddress.upsert:', ret.transactionHash);
  // */

  //await instanceConfigAddress.updateBlockUrl(instanceConfigAddress.address,"test4");
  if (tokens != null) {
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, element.address, element.symbol);
      console.log('instanceConfigAddress.upsertGameToken:', element.address, element.symbol);
    }
  }
  let instanceERC20 = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BOST', 'BOST', 18)) as ERC20Faucet;
  console.log('GameERC20 address:', instanceERC20.address);

  await instanceConfigAddress.upsertGameToken(
    instanceGameFactory.address,
    instanceERC20.address,
    await instanceERC20.symbol()
  );
  console.log('instanceConfigAddress.upsertGameToken:', instanceERC20.address, await instanceERC20.symbol());
};

main();
