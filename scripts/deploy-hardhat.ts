import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigurableParametersContract } from '../typechain/ConfigurableParametersContract';
import { GameERC20 } from '../typechain/GameERC20';
import { ERC20 } from '../typechain/ERC20';
import { Game } from '../typechain/Game';
import * as config from '../.config';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';

let main = async () => {
  console.log('network:', network.name);
  let user;
  let owner = new ethers.Wallet(getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  let ownerBalance = await owner.getBalance();
  if (ownerBalance.toString() == '0') {
    await user.sendTransaction({
      value: ethers.utils.parseEther('1.1'),
      to: owner.address,
    });
  }
  console.log(
    'deploy account:',
    network.name,
    owner.address,
    ethers.utils.formatEther((await owner.getBalance()).toString())
  );

  const ConfigurableParametersContractFactory = await ethers.getContractFactory('ConfigurableParametersContract');
  const instanceConfigurableParametersContractFactory = (await ConfigurableParametersContractFactory.connect(
    owner
  ).deploy(owner.address)) as ConfigurableParametersContract;
  console.log('new ConfigurableParametersContract address:', instanceConfigurableParametersContractFactory.address);

  let gasprice = await owner.getGasPrice();
  let gaslimit = (await ethers.provider.getBlock('latest')).gasLimit;
  let blockNumber = await ethers.provider.getBlockNumber();
  console.log('gasPrice:', blockNumber, gasprice.toString(), ethers.utils.formatEther(gasprice));
  console.log('gasLimit:', blockNumber, gaslimit.toString(), ethers.utils.formatEther(gaslimit));

  const ERC20Factory = await ethers.getContractFactory('ERC20');
  let instanceToken0 = (await ERC20Factory.connect(owner).deploy('Test Token0', 'T0', 18)) as ERC20;
  let instanceToken1 = (await ERC20Factory.connect(owner).deploy('Test Token1', 'T1', 18)) as ERC20;
  console.log('Token0 address:', instanceToken0.address);
  console.log('Token1 address:', instanceToken1.address);

  let topic = ethers.utils.id('PairCreated(indexed address,indexed address,address,uint256)');
  let topic1 = ethers.utils.id('Test(uint256)');

  let filter = {
    address: instanceUniswapV2Factory.address,
    topics: [topic1],
  };
  //tx.hash
  owner.provider.on(filter, (ret) => {
    console.log('on PairCreated:', ret);
  });
  owner.provider.on('block', (blockNumber) => {
    console.log('New Block: ' + blockNumber);
  });

  //创建交易对
  let tx = await instanceUniswapV2Factory.createPair(instanceToken0.address, instanceToken1.address);
  console.log('xxxxxxxx');
  let receipt = await tx.wait(1);
  let event = receipt.events?.pop();
  console.log(event?.event, event?.args);
  // let UniswapV2PairFactor = await ethers.getContractFactory('UniswapV2Pair');
  // let instanceUniswapV2Pair = UniswapV2PairFactor.connect(owner).attach(event?.args?.pair) as UniswapV2Pair;
  // console.log('xxxxxxxx:', await instanceUniswapV2Pair.balanceOf(owner.address));
  // console.log(event?.event, event?.args?.pair);
  // (await (await createPair).wait()).to.;
  //方便目前测试已经部署的业务
  //   let ret = await(
  //     await instanceConfigAddress.upsert(
  //       instanceUniswapV2Factory.address,
  //       instanceToken0.address,
  //       instanceToken1.address,
  //       97
  //     )
  //   ).wait();
  //   console.log('instanceConfigAddress.upsert:', ret.transactionHash);
  // */
  //   ret = await (
  //     await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, 'BOST', instanceERC20.address)
  //   ).wait();
  //   console.log('instanceConfigAddress.upsertGameToken:', ret.transactionHash);
};

main();
