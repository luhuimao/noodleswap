import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { GameFactory } from '../typechain/GameFactory';
import { Game } from '../typechain/Game';

import * as config from '../.config';
import { getOwnerPrivateKey } from '../.privatekey';

let main = async () => {
  console.log('network:', network.name);
  let deadline = Date.now() + 8640000;
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
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

  let instanceERC20 = (await (
    await ethers.getContractFactory('ERC20Faucet')
  ).deploy('T0', 'Token 0', 18)) as ERC20Faucet;
  // 领币
  await instanceERC20['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  console.log('new ERC20Faucet address:', instanceERC20.address);
  // 工厂合约
  let instanceGameFactory = (await (await ethers.getContractFactory('GameFactory'))
    .connect(owner)
    .deploy({ gasPrice: 1, gasLimit: (await ethers.provider.getBlock('latest')).gasLimit })) as GameFactory;
  // .attach('0xe8c76c0eca2f536abb99b356e9aada6b005f7af8')) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);
  // 下注代币
  let eventFilter = instanceGameFactory.filters._GameCreated(instanceERC20.address, null, null, null, null, null, null);
  let gameAddress: string;
  instanceGameFactory.once(eventFilter, async (tokenaddr, gameaddr) => {
    gameAddress = gameaddr;
    console.log('new Game address:', gameAddress);
    const instanceGame = (await ethers.getContractFactory('Game')).connect(owner).attach(gameAddress) as Game;
    console.log('instanceGame.winOption:', await instanceGame.winOption());
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));

    console.log('creator liquidity:', await instanceGame.balanceOf(owner.address));
    //TODO 这里增加其他函数调用
    console.log('-------placeGame--------');
    await instanceGame.placeGame(instanceERC20.address, [0], [ethers.utils.parseEther('10')], Date.now() + 1000);
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));

    //console.log('-------addLiquidity--------');
    //let liquidity = await instanceGame.addLiquidity(instanceERC20.address, ethers.utils.parseEther('100'));
    //console.log(liquidity);

    //console.log('-------removeLiquidity--------');
    //let amount = await instanceGame.removeLiquidity(instanceERC20.address, ethers.utils.parseEther('20'));
    //console.log(amount);
  });
  await instanceGameFactory.createGame(
    instanceERC20.address,
    'Test T0',
    ['BIG', 'SMALL'],
    [ethers.utils.parseEther('40'), ethers.utils.parseEther('60')],
    'https://github.com/NoodleDAO/noodleswap',
    deadline
  );
};

main();
