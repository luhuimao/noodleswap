import { exec } from 'child_process';
import { ethers, network, artifacts } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { Game } from '../typechain/Game';
import { LGame } from '../typechain/LGame';
import { LGameFactory } from '../typechain/LGameFactory';
import { Vote } from '../typechain/Vote';
import { PlayNFT } from '../typechain/PlayNFT';
import { NoodleStaking } from '../typechain/NoodleStaking';
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
  const instanceLGame = (await (await ethers.getContractFactory('LGame')).connect(owner).deploy()) as LGame;
  console.log('new LGame address:', instanceLGame.address);
  const instanceLGameFactory = (await (
    await ethers.getContractFactory('LGameFactory', { libraries: { LGame: instanceLGame.address } })
  )
    .connect(owner)
    .deploy()) as LGameFactory;
  console.log('new LGameFactory address:', instanceLGameFactory.address);

  let gasprice = (await owner.getGasPrice()).add(1);
  let blockGaslimit0 = (await ethers.provider.getBlock('latest')).gasLimit;
  let blockGaslimit = blockGaslimit0.div(4);
  if (network.name == 'devnet') {
    gasprice = gasprice.sub(gasprice).add(1);
    blockGaslimit = blockGaslimit0;
  }
  let blockNumber = await ethers.provider.getBlockNumber();
  console.log('gasPrice:', blockNumber, gasprice.toString(), ethers.utils.formatEther(gasprice));
  console.log(
    'gasLimit:',
    blockNumber,
    blockGaslimit0.toString(),
    blockGaslimit.toString(),
    ethers.utils.formatEther(blockGaslimit.mul(gasprice))
  );

  let instanceConfigAddress: ConfigAddress;
  if (network.name == 'hardhat') {
    instanceConfigAddress = (await (await ethers.getContractFactory('ConfigAddress'))
      .connect(owner)
      .deploy()) as ConfigAddress;
  } else {
    const ConfigAddressFactory = await ethers.getContractFactory('ConfigAddress');
    let tmpaddr = config.getConfigAddressByNetwork(network.name);
    if (tmpaddr == null) {
      console.error('config address null:', network.name);
      return;
    }
    instanceConfigAddress = ConfigAddressFactory.connect(owner).attach(tmpaddr) as ConfigAddress;
  }
  console.log('config address:', instanceConfigAddress.address);
  const tmp0 = await ethers.getContractFactory('ERC20Faucet');
  console.log(
    'deploy ERC20Faucet gas:',
    ethers.utils.formatEther((await owner.estimateGas(tmp0.getDeployTransaction('WETH9', 'WETH9', 18))).mul(gasprice))
  );
  let deadline = boutils.GetUnixTimestamp() + 86400;
  let tmp1 = await ethers.getContractFactory('Game', { libraries: { LGame: instanceLGame.address } });
  console.log(
    'deploy Game gas:',
    // ethers.utils.formatEther(
    //   (
    //     await owner.estimateGas(
    //       tmp1.getDeployTransaction(owner.address, owner.address, [1, 2], deadline, owner.address, owner.address)
    //     )
    //   ).mul(gasprice)
    // ),
    tmp1.bytecode.length
  );
  const tmp2 = await ethers.getContractFactory('GameFactory', {
    libraries: { LGameFactory: instanceLGameFactory.address },
  });
  console.log(
    'deploy GameFactory gas:',
    // ethers.utils.formatEther(
    //   (await owner.estimateGas(tmp2.getDeployTransaction(owner.address, owner.address))).mul(gasprice)
    // ),
    tmp2.bytecode.length
  );
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
    .deploy('NoodleToken', 'NDLT', 18)) as ERC20Faucet;
  console.log('new NoodleToken address:', instanceNDLToken.address);

  let instanceVote: Vote;
  instanceVote = (await (await ethers.getContractFactory('Vote'))
    .connect(owner)
    .deploy(instanceNDLToken.address)) as Vote;
  console.log('new Vote address:', instanceVote.address);

  let instancePlayNFT: PlayNFT;
  instancePlayNFT = (await (await ethers.getContractFactory('PlayNFT')).connect(owner).deploy()) as PlayNFT;
  console.log('new PlayNFT address:', instancePlayNFT.address);

  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'VOTE_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceVote.address + '"; ' + flag);

  const instanceUSDT = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BUSDT', 'BUSDT', 6)) as ERC20Faucet;
  console.log('new BUSDT address:', instanceUSDT.address, blockGaslimit.toString());

  const instanceGameFactory = (await (
    await ethers.getContractFactory('GameFactory', {
      libraries: { LGameFactory: instanceLGameFactory.address },
    })
  )
    .connect(owner)
    .deploy(instanceNDLToken.address, instanceVote.address, instancePlayNFT.address, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    })) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);

  flag = '\\/\\/REPLACE_FLAG';
  key = 'GAMEFACTORY_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceGameFactory.address + '"; ' + flag);

  const instanceStaking = (await (await ethers.getContractFactory('NoodleStaking'))
    .connect(owner)
    .deploy(instanceNDLToken.address, instanceGameFactory.address, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    })) as NoodleStaking;
  console.log('new NoodleStaking address:', instanceStaking.address);
  await instanceGameFactory.setNoodleStaking(instanceStaking.address);
  flag = '\\/\\/REPLACE_FLAG';
  key = 'STAKING_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceStaking.address + '"; ' + flag);

  const wethAddr = config.getTokenAddrBySymbol(tokens, 'WBNB');
  console.log('WETH address:', wethAddr);

  const usdtAddr = config.getTokenAddrBySymbol(tokens, 'BUSD');
  console.log('BUSD address:', usdtAddr);

  let chainId = (await ethers.provider.getNetwork()).chainId;

  //方便目前测试已经部署的业务
  //let ret = await (
  let ret = await instanceConfigAddress.upsert(
    instanceGameFactory.address,
    chainId,
    instanceNDLToken.address,
    instanceWETH9.address,
    instanceUSDT.address,
    config.getRpcUrlByNetwork(network.name),
    config.getBlockUrlByNetwork(network.name),
    network.name,
    instanceVote.address,
    instanceStaking.address,
    instancePlayNFT.address,
    {
      gasPrice: gasprice,
      gasLimit: await instanceConfigAddress.estimateGas[
        'upsert(address,uint256,address,address,address,string,string,string,address,address,address)'
      ](
        instanceGameFactory.address,
        chainId,
        instanceNDLToken.address,
        instanceWETH9.address,
        instanceUSDT.address,
        config.getRpcUrlByNetwork(network.name),
        config.getBlockUrlByNetwork(network.name),
        network.name,
        instanceVote.address,
        instanceStaking.address,
        instancePlayNFT.address
      ),
    }
  );
  //).wait(1);
  //console.log('instanceConfigAddress.upsert:', ret.transactionHash);
  console.log('instanceConfigAddress.upsert:', ret.gasPrice.toString());
  // */

  //await instanceConfigAddress.updateBlockUrl(instanceConfigAddress.address,"test4");
  if (tokens != null) {
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, element.address, element.symbol, {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      });
      console.log('instanceConfigAddress.upsertGameToken:', element.address, element.symbol);
    }
  }
  if (
    (await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T0')) ==
    '0x0000000000000000000000000000000000000000'
  ) {
    const t0 = (await (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .deploy('Test Token 0', 'T0', 6)) as ERC20Faucet;
    console.log('new T0 address:', t0.address);
    let tmpsymbol = 'T0';
    ret = await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t0.address, tmpsymbol, {
      gasPrice: gasprice,
      gasLimit: await instanceConfigAddress.estimateGas['upsertGameToken(address,address,string)'](
        instanceGameFactory.address,
        t0.address,
        tmpsymbol
      ),
    });
    console.log('instanceConfigAddress.upsertGameToken:', ret.gasPrice.toString());
  }
  if (
    (await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T1')) ==
    '0x0000000000000000000000000000000000000000'
  ) {
    const t1 = (await (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .deploy('Test Token 1', 'T1', 18)) as ERC20Faucet;
    console.log('new T1 address:', t1.address);
    let tmpsymbol = 'T1';
    await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t1.address, tmpsymbol, {
      gasPrice: gasprice,
      gasLimit: await instanceConfigAddress.estimateGas['upsertGameToken(address,address,string)'](
        instanceGameFactory.address,
        t1.address,
        tmpsymbol
      ),
    });
    console.log('instanceConfigAddress.upsertGameToken:', ret.gasPrice.toString());
  }
  let instanceERC20 = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BOST', 'BOST', 18)) as ERC20Faucet;
  console.log('GameERC20 address:', instanceERC20.address);
  await instanceNDLToken['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  if (user) {
    await instanceNDLToken['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
    await instanceERC20['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  }

  let tmpsymbol = await instanceERC20.symbol();
  await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, instanceERC20.address, tmpsymbol, {
    gasPrice: gasprice,
    gasLimit: blockGaslimit,
  });
  console.log('instanceConfigAddress.upsertGameToken:', instanceERC20.address, tmpsymbol);
  // 下注代币
  let eventFilter = instanceGameFactory.filters._GameCreated(
    instanceERC20.address,
    null,
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
    const instanceGame = (await ethers.getContractFactory('Game', { libraries: { LGame: instanceLGame.address } }))
      .connect(owner)
      .attach(gameAddress) as Game;
    console.log('instanceGame.winOption:', await instanceGame.winOption());
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));

    console.log('creator liquidity:', await instanceGame.balanceOf(owner.address));
    //TODO 这里增加其他函数调用
    console.log('-------placeGame--------');
    let tokenIds = await instanceGame.placeGame(
      [0],
      [ethers.utils.parseEther('10')],
      0,
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: await instanceGame.estimateGas['placeGame(uint8[],uint256[],uint256,uint256)'](
          [0],
          [ethers.utils.parseEther('10')],
          0,
          boutils.GetUnixTimestamp() + 1000
        ),
      }
    );
    await instanceGame.placeGame([0], [ethers.utils.parseEther('15')], 0, boutils.GetUnixTimestamp() + 1000, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    });
    await instanceGame.placeGame([1], [ethers.utils.parseEther('20')], 0, boutils.GetUnixTimestamp() + 1000, {
      gasPrice: gasprice,
      gasLimit: await instanceGame.estimateGas['placeGame(uint8[],uint256[],uint256,uint256)'](
        [1],
        [ethers.utils.parseEther('20')],
        0,
        boutils.GetUnixTimestamp() + 1000
      ),
    });
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    //console.log('-------addLiquidity--------');
    let liquidity = await instanceGame.addLiquidity(
      ethers.utils.parseEther('102'),
      0,
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: await instanceGame.estimateGas['addLiquidity(uint256,uint256,uint256)'](
          ethers.utils.parseEther('102'),
          0,
          boutils.GetUnixTimestamp() + 1000
        ),
      }
    );
    console.log('add liquidity:');
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    console.log('-------removeLiquidity--------');
    let amount = await instanceGame.removeLiquidity(
      ethers.utils.parseEther('20'),
      0,
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
        // gasLimit: await instanceGame.estimateGas['removeLiquidity(uint256,uint256)'](
        //   ethers.utils.parseEther('20'),
        //   boutils.GetUnixTimestamp() + 1000
        // ),
      }
    );
    console.log('-------removeLiquidity:end--------');
    await instanceGame.stakeGame(ethers.utils.parseEther('1'), {
      gasLimit: await instanceGame.estimateGas['stakeGame(uint256)'](ethers.utils.parseEther('1')),
    });
    console.info('instanceGame.stakeGame:ok');
    // 开启质押挖矿
    await instanceGameFactory.addStakeInfo(instanceGame.address, ethers.utils.parseEther('60'), deadline);
    for (let index = 0; index < 1; index++) {
      await boutils.advanceBlock();
      console.log(
        'pending reward:',
        (await instanceStaking.getPendingReward(instanceGame.address, owner.address)).toString()
      );
      console.log('xxxxxxx:0');
      // await instanceGame['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('100'));
      await instanceGame.approve(instanceStaking.address, ethers.utils.parseEther('1.0'));
      console.log('xxxxxxx:1');
      await instanceStaking.deposit(instanceGame.address, ethers.utils.parseEther('0.01'), {
        gasLimit: await instanceStaking.estimateGas['deposit(address,uint256)'](
          instanceGame.address,
          ethers.utils.parseEther('0.01')
        ),
      });
      console.log('xxxxxxx:1');
      let pending = await instanceStaking.getPendingReward(instanceGame.address, owner.address);
      await instanceStaking.withdraw(instanceGame.address, pending.div(2), {
        gasLimit: await instanceStaking.estimateGas['withdraw(address,uint256)'](instanceGame.address, pending.div(2)),
        from: owner.address,
      });
      await instanceGame.openGame(0, {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      });
      console.info('instanceGame.openGame:ok');
      await instanceGame.challengeGame(0, {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      });
      console.info('instanceGame.challengeGame:ok');
      await instanceVote.add(instanceGame.address, owner.address, 1, {
        gasPrice: gasprice,
        gasLimit: await instanceVote.estimateGas['add(address,address,uint8)'](instanceGame.address, owner.address, 1),
      });
    }
  });
  console.log(
    '-------instanceGameFactory.createGame--------',
    blockGaslimit.toString(),
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );
  let ret1 = instanceGameFactory.createGame(
    instanceERC20.address,
    'Test T0',
    'T0',
    ['BIG', 'SMALL'],
    [ethers.utils.parseEther('40'), ethers.utils.parseEther('60')],
    'https://github.com/NoodleDAO/noodleswap',
    deadline,
    {
      gasPrice: gasprice.add(1),
      gasLimit: await instanceGameFactory.estimateGas[
        'createGame(address,string,string,string[],uint256[],string,uint256)'
      ](
        instanceERC20.address,
        'Test T0',
        'T0',
        ['BIG', 'SMALL'],
        [ethers.utils.parseEther('40'), ethers.utils.parseEther('60')],
        'https://github.com/NoodleDAO/noodleswap',
        deadline
      ),
    }
  );
  console.log(ret1);
  let ret2 = await ret1;
  console.log(ret1);
  console.log(ret2);
  let ret3 = await ret2.wait(1);
  console.log(ret2);
  console.log(ret3);
  console.log('-------instanceGameFactory.createGame--------end');
  // await instanceGameFactory.createGame(
  //   instanceERC20.address,
  //   'Test T1',
  //   ['BIG', 'SMALL'],
  //   [ethers.utils.parseEther('50'), ethers.utils.parseEther('50')],
  //   'https://github.com/NoodleDAO/noodleswap',
  //   deadline,
  //   {
  //     gasPrice: gasprice.add(1),
  //     gasLimit: blockGaslimit0,
  //   }
  // );
};

main();
