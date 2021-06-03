import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ERC20 } from '../typechain/ERC20';
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
  let instanceERC20 = (await (await ethers.getContractFactory('ERC20')).deploy('T0', 'Token 0')) as ERC20;
  console.log('new ERC20 address:', instanceERC20.address);
  let eventFilter = instanceGameFactory.filters._GameCreated(null, null, null, null, null, null, null);
  let gameAddress: string;
  instanceGameFactory.once(eventFilter, async (v0, v1, v2, v3, v4, v5, v6) => {
    gameAddress = v6;
    console.log('new Game address:', gameAddress);
    const instanceGame = (await ethers.getContractFactory('Game')).connect(owner).attach(gameAddress) as Game;
    console.log('instanceGame.winOption:', await instanceGame.winOption());
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
