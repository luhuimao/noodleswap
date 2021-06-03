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
  const instanceConfigurableParametersContract = (await ConfigurableParametersContractFactory.connect(
    owner
  ).deploy()) as ConfigurableParametersContract;
  console.log('new ConfigurableParametersContract address:', instanceConfigurableParametersContract.address);

  const GameERC20Factory = await ethers.getContractFactory('GameERC20');
  const instanceGameERC20 = (await GameERC20Factory.connect(owner).deploy()) as GameERC20;
  console.log('new GameERC20 address:', instanceGameERC20.address);

  const ERC20Factory = await ethers.getContractFactory('ERC20');
  let instanceToken0 = (await ERC20Factory.connect(owner).deploy('Test Token0', 'T0')) as ERC20;
  let instanceToken1 = (await ERC20Factory.connect(owner).deploy('Test Token1', 'T1')) as ERC20;
  console.log('Token0 address:', instanceToken0.address);
  console.log('Token1 address:', instanceToken1.address);

  //创建交易对
  // let tx = await instanceUniswapV2Factory.createPair(instanceToken0.address, instanceToken1.address);
  // console.log('xxxxxxxx');
  // let receipt = await tx.wait(1);
  // let event = receipt.events?.pop();
  // console.log(event?.event, event?.args);
};

main();
