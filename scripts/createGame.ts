import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { GameFactory } from '../typechain/GameFactory';
import { Game } from '../typechain/Game';
import * as config from '../.config';
import { getOwnerPrivateKey } from '../.privatekey';

let main = async () => {
  console.log('network:', network.name);
  let deadline = Date.now() + 86400;
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

  // 工厂合约
  let instanceGameFactory = (await (await ethers.getContractFactory('GameFactory')).deploy()) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);
  // 下注代币
  let instanceERC20 = (await (
    await ethers.getContractFactory('ERC20Faucet')
  ).deploy('T0', 'Token 0', 18)) as ERC20Faucet;
  // 领币
  await instanceERC20['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  console.log('new ERC20Faucet address:', instanceERC20.address);
  let eventFilter = instanceGameFactory.filters._GameCreated(instanceERC20.address, null, null, null, null, null, null);
  let gameAddress: string;
  instanceGameFactory.once(eventFilter, async (tokenaddr, gameaddr) => {
    gameAddress = gameaddr;
    console.log('new Game address:', gameAddress);
    const instanceGame = (await ethers.getContractFactory('Game')).connect(owner).attach(gameAddress) as Game;
    console.log('instanceGame.winOption:', await instanceGame.winOption());
    // await instanceGame.addLiquidity(instanceERC20.address, ethers.utils.parseEther('1'));
    //TODO 这里增加其他函数调用
  });
  await instanceGameFactory.createGame(
    instanceERC20.address,
    'Test T0',
    ['BIG', 'SMALL'],
    [1, 1],
    'https://github.com/NoodleDAO/noodleswap',
    deadline
  );
};

main();
