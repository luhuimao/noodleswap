import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { Vote } from '../typechain/Vote';
import { GameFactory } from '../typechain/GameFactory';
import { Game } from '../typechain/Game';

import * as config from '../.config';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';

let main = async () => {
  console.log('network:', network.name);
  let deadline = boutils.GetUnixTimestamp() + 86400;
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

  let configAddress = await config.GetConfigAddressByGameFactoryAddress(
    network.name,
    config.getGameFactoryAddressByNetwork(network.name)
  );
  let instanceNDLToken: ERC20Faucet;
  if (configAddress?.ndlToken) {
    instanceNDLToken = (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .attach((configAddress.ndlToken as any).id) as ERC20Faucet;
    console.log('NoodleToken address:', instanceNDLToken.address);
  } else {
    instanceNDLToken = (await (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .deploy('NoodleToken', 'NDLT', 18)) as ERC20Faucet;
    console.log('new NoodleToken address:', instanceNDLToken.address);
  }

  let voteToken: Vote;
  voteToken = (await (await ethers.getContractFactory('Vote'))
      .connect(owner)
      .deploy(instanceNDLToken.address)) as Vote;
    console.log('new Vote address:', voteToken.address);

  let instanceERC20 = (await (
    await ethers.getContractFactory('ERC20Faucet')
  ).deploy('T0', 'Token 0', 18)) as ERC20Faucet;
  // 领币
  await instanceNDLToken['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceNDLToken['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  console.log('new ERC20Faucet address:', instanceERC20.address);
  // 工厂合约
  let instanceGameFactory = (await (await ethers.getContractFactory('GameFactory'))
    .connect(owner)
    .deploy(instanceNDLToken.address, voteToken.address, {
      gasPrice: 1,
      gasLimit: (await ethers.provider.getBlock('latest')).gasLimit,
    })) as GameFactory;
  //.attach(config.getGameFactoryAddressByNetwork(network.name))) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);
  // 下注代币
  let eventFilter = instanceGameFactory.filters._GameCreated(
    instanceERC20.address,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  );
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
    let tokenIds = await instanceGame.placeGame(
      instanceERC20.address,
      [0],
      [ethers.utils.parseEther('10')],
      boutils.GetUnixTimestamp() + 1000
    );
    await instanceGame.placeGame(
      instanceERC20.address,
      [0],
      [ethers.utils.parseEther('15')],
      boutils.GetUnixTimestamp() + 1000
    );
    await instanceGame.placeGame(
      instanceERC20.address,
      [1],
      [ethers.utils.parseEther('20')],
      boutils.GetUnixTimestamp() + 1000
    );
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    //console.log('-------addLiquidity--------');
    let liquidity = await instanceGame.addLiquidity(instanceERC20.address, ethers.utils.parseEther('102'));
    console.log('add liquidity:');
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    //console.log('-------removeLiquidity--------');
    let amount = await instanceGame.removeLiquidity(ethers.utils.parseEther('20'), boutils.GetUnixTimestamp() + 1000);
    console.log(amount);
    await instanceGame.stakeGame(0);
    await instanceGame.openGame(1);
    await instanceGame.challengeGame(0);
    await instanceGame.addVote(0);
    await instanceGame.addVote(0);
    await instanceGame.addVote(1);
    await instanceGame.addVote(1);
    await instanceGame.addVote(0);
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
