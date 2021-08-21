import { exec } from 'child_process';
import { ethers, network, artifacts } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { Game } from '../typechain/Game';
import { LGame } from '../typechain/LGame';
import { LGameFactory } from '../typechain/LGameFactory';
// import { Vote } from '../typechain/Vote';
import { PlayNFT } from '../typechain/PlayNFT';
import { NoodleStaking } from '../typechain/NoodleStaking';
import { NoodleLocking } from '../typechain/NoodleLocking';
import { GameFactory } from '../typechain/GameFactory';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { LockNoodleTokenERC20 } from '../typechain';
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
  let configAddress = await config.GetConfigAddressByGameFactoryAddress(
    network.name,
    config.getGameFactoryAddressByNetwork(network.name),
    0
  );

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

  let lGameContractFactory = await ethers.getContractFactory('LGame');
  const instanceLGame = (await lGameContractFactory.connect(owner).deploy({
    gasLimit: await ethers.provider.estimateGas(lGameContractFactory.getDeployTransaction()),
  })) as LGame;
  console.log('new LGame address:', instanceLGame.address);
  let lgameFactoryContractFactory = await ethers.getContractFactory('LGameFactory', {
    libraries: { LGame: instanceLGame.address },
  });
  const instanceLGameFactory = (await lgameFactoryContractFactory.connect(owner).deploy({
    gasPrice: gasprice,
    gasLimit: await ethers.provider.estimateGas(lgameFactoryContractFactory.getDeployTransaction()),
  })) as LGameFactory;
  console.log('new LGameFactory address:', instanceLGameFactory.address);

  let instanceConfigAddress: ConfigAddress;
  if (network.name == 'hardhat') {
    instanceConfigAddress = (await (await ethers.getContractFactory('ConfigAddress'))
      .connect(owner)
      .deploy()) as ConfigAddress;
  } else {
    const ConfigAddressFactory = await ethers.getContractFactory('ConfigAddress');
    let tmpaddr = config.getConfigAddressByNetwork(network.name);
    console.log("Config Address Recored In Config: ", tmpaddr);
    if (tmpaddr == null) {
      console.error('config address null:', network.name);
      return;
    }
    instanceConfigAddress = ConfigAddressFactory.connect(owner).attach(tmpaddr) as ConfigAddress;
  }
  console.log('config address:', instanceConfigAddress.address);
  const tmp0 = await ethers.getContractFactory('ERC20Faucet');
  // console.log(
  //   'deploy ERC20Faucet gas:',
  //   ethers.utils.formatEther((await owner.estimateGas(tmp0.getDeployTransaction('WETH9', 'WETH9', 18))).mul(gasprice))
  // );
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
  // await boutils.Sleep(10000);
  console.log(
    'deploy GameFactory gas:',
    // ethers.utils.formatEther(
    //   (await ethers.provider.estimateGas(tmp2.getDeployTransaction(owner.address, owner.address))).mul(gasprice)
    // ),
    tmp2.bytecode.length
  );
  let tokens = config.getTokensByNetwork(network.name);
  if (tokens == null) {
    console.error('tokens address null:', network.name);
    return;
  }

  let instanceWETH9;
  let erc20ContractFactory = await ethers.getContractFactory('ERC20Faucet');
  if (configAddress && configAddress.wethToken) {
    instanceWETH9 = erc20ContractFactory
      .connect(owner)
      .attach((configAddress.wethToken as any as ERC20Faucet).id) as ERC20Faucet;
    console.log('reuse WETH9 address:', instanceWETH9.address);
  } else {
    instanceWETH9 = (await erc20ContractFactory.connect(owner).deploy('WETH9', 'WETH9', 18, {
      gasLimit: await ethers.provider.estimateGas(erc20ContractFactory.getDeployTransaction('WETH9', 'WETH9', 18)),
    })) as ERC20Faucet;
    console.log('new WETH9 address:', instanceWETH9.address);
  }
  let instanceNDLToken: ERC20Faucet;
  if (configAddress && configAddress.ndlToken) {
    instanceNDLToken = (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .attach((configAddress.ndlToken as any as ERC20Faucet).id) as ERC20Faucet;
    console.log('reuse NoodleToken address:', instanceNDLToken.address);
  } else {
    instanceNDLToken = (await (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .deploy('NoodleToken', 'NDLT', 18, {
        gasLimit: await ethers.provider.estimateGas(
          erc20ContractFactory.getDeployTransaction('NoodleToken', 'NDLT', 18)
        ),
      })) as ERC20Faucet;
    console.log('new NoodleToken address:', instanceNDLToken.address);
  }

  // let instanceLCKNDLToken: ERC20Faucet;

  let instanceLCKNDLToken: LockNoodleTokenERC20
  if (configAddress && configAddress.lckndlToken) {
    instanceLCKNDLToken = (await ethers.getContractFactory('LockNoodleTokenERC20'))
      .connect(owner)
      .attach((configAddress.lckndlToken as any as LockNoodleTokenERC20).id) as LockNoodleTokenERC20;
    console.log('reuse LockNoodleToken address:', instanceLCKNDLToken.address);
  } else {
    instanceLCKNDLToken = (await (await ethers.getContractFactory('LockNoodleTokenERC20'))
      .connect(owner)
      .deploy('LockNoodleToken', 'LCKNDLT', {
        gasLimit: await ethers.provider.estimateGas(
          erc20ContractFactory.getDeployTransaction('LockNoodleToken', 'LCKNDLT', 18)
        ),
      })) as LockNoodleTokenERC20;
    console.log('new LOCKNoodleToken address:', instanceLCKNDLToken.address);
  }

  // let instanceVote: Vote;
  // let voteContractFactory = await ethers.getContractFactory('Vote');
  // instanceVote = (await voteContractFactory.connect(owner).deploy(instanceNDLToken.address, {
  //   gasLimit: blockGaslimit,
  //   // gasLimit: await ethers.provider.estimateGas(voteContractFactory.getDeployTransaction(instanceNDLToken.address)),
  // })) as Vote;
  // console.log('new Vote address:', instanceVote.address);

  let instancePlayNFT: PlayNFT;
  let nftContractFactory = await ethers.getContractFactory('PlayNFT');
  instancePlayNFT = (await nftContractFactory.connect(owner).deploy({
    gasLimit: await ethers.provider.estimateGas(nftContractFactory.getDeployTransaction()),
  })) as PlayNFT;
  console.log('new PlayNFT address:', instancePlayNFT.address);

  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'VOTE_ADDRESS_' + network.name.toUpperCase();
  // boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceVote.address + '"; ' + flag);

  let instanceUSDT;
  if (configAddress && configAddress.ndlToken) {
    instanceUSDT = (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .attach((configAddress.usdtToken as any as ERC20Faucet).id) as ERC20Faucet;
    console.log('reuse BUSDT address:', instanceUSDT.address, blockGaslimit.toString());
  } else {
    instanceUSDT = (await erc20ContractFactory.connect(owner).deploy('Test BUSDT', 'BUSDT', 6, {
      gasLimit: await ethers.provider.estimateGas(erc20ContractFactory.getDeployTransaction('Test BUSDT', 'BUSDT', 6)),
    })) as ERC20Faucet;
    console.log('new BUSDT address:', instanceUSDT.address, blockGaslimit.toString());
  }

  let gameFactoryContractFactory = await ethers.getContractFactory('GameFactory', {
    libraries: { LGameFactory: instanceLGameFactory.address },
  });
  const instanceGameFactory = (await gameFactoryContractFactory
    .connect(owner)
    .deploy(instanceNDLToken.address, instanceLCKNDLToken.address, instancePlayNFT.address, {
      gasPrice: gasprice,
      gasLimit: await ethers.provider.estimateGas(
        gameFactoryContractFactory.getDeployTransaction(instanceNDLToken.address, instanceLCKNDLToken.address, instancePlayNFT.address)
      ),
    })) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);

  flag = '\\/\\/REPLACE_FLAG';
  key = 'GAMEFACTORY_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceGameFactory.address + '"; ' + flag);

  let noodleStakeingContractFactory = await ethers.getContractFactory('NoodleStaking');
  const instanceStaking = (await noodleStakeingContractFactory
    .connect(owner)
    .deploy(instanceNDLToken.address, instanceGameFactory.address, {
      gasPrice: gasprice,
      gasLimit: await ethers.provider.estimateGas(
        noodleStakeingContractFactory.getDeployTransaction(instanceNDLToken.address, instanceGameFactory.address)
      ),
    })) as NoodleStaking;
  console.log('new NoodleStaking address:', instanceStaking.address);
  flag = '\\/\\/REPLACE_FLAG';
  key = 'STAKING_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceStaking.address + '"; ' + flag);

  // await boutils.Sleep(10000);
  let tmpr = await instanceGameFactory.setNoodleStaking(instanceStaking.address, {
    gasPrice: gasprice,
    gasLimit: blockGaslimit,
    // gasLimit: await instanceGameFactory.estimateGas['setNoodleStaking(address)'](instanceStaking.address),
  });
  await tmpr.wait();

  let noodleLockingContractFactory = await ethers.getContractFactory('NoodleLocking');
  const instanceLocking = (await noodleLockingContractFactory
    .connect(owner)
    .deploy(instanceNDLToken.address, instanceLCKNDLToken.address, 2, {
      gasPrice: gasprice,
      gasLimit: await ethers.provider.estimateGas(
        noodleLockingContractFactory.getDeployTransaction(instanceNDLToken.address, instanceLCKNDLToken.address, 2)
      ),
    })) as NoodleLocking;
  console.log('new NoodleLocking address:', instanceLocking.address);

  flag = '\\/\\/REPLACE_FLAG';
  key = 'LOCKING_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceLocking.address + '"; ' + flag);

  const wethAddr = config.getTokenAddrBySymbol(tokens, 'WBNB');
  console.log('WETH address:', wethAddr);

  const usdtAddr = config.getTokenAddrBySymbol(tokens, 'BUSD');
  console.log('BUSD address:', usdtAddr);

  let chainId = (await ethers.provider.getNetwork()).chainId;
  //方便目前测试已经部署的业务
  //let ret = await (

  let ret = await instanceConfigAddress.upsert(
    chainId,
    config.getRpcUrlByNetwork(network.name),
    config.getBlockUrlByNetwork(network.name),
    network.name,
    instanceGameFactory.address,
    instanceNDLToken.address,
    instanceUSDT.address,
    instanceUSDT.address,
    instanceStaking.address,
    instancePlayNFT.address,
    {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    }
  );
  //).wait(1);
  //console.log('instanceConfigAddress.upsert:', ret.transactionHash);
  if (!ret.gasPrice) {
    console.log('instanceConfigAddress.upsert:', ret);
    let ret1 = await ret.wait();
    console.log('instanceConfigAddress.upsert:', ret1);
  } else {
    console.log('instanceConfigAddress.upsert:', ret.gasPrice!.toString());
  }
  // */
  // console.log("##############factoryAddress:", (await instanceConfigAddress.configMap(instanceGameFactory.address)));

  ret = await instanceConfigAddress.upsertLockNoodleToken(instanceGameFactory.address, instanceLCKNDLToken.address, {
    gasPrice: gasprice,
    gasLimit: instanceConfigAddress.estimateGas.upsertLockNoodleToken(
      instanceGameFactory.address,
      instanceLCKNDLToken.address
    ),
  });

  if (!ret.gasPrice) {
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret);
    let ret1 = await ret.wait();
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret1);
  } else {
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret.gasPrice!.toString());
  }
  console.log('instanceConfigAddress.upsertLockNoodleToken:', instanceLCKNDLToken.address);


  ret = await instanceConfigAddress.upsertNoodleLocking(instanceGameFactory.address, instanceLocking.address, {
    gasPrice: gasprice,
    gasLimit: instanceConfigAddress.estimateGas.upsertNoodleLocking(
      instanceGameFactory.address,
      instanceLocking.address
    ),
  });

  if (!ret.gasPrice) {
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret);
    let ret1 = await ret.wait();
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret1);
  } else {
    console.log('instanceConfigAddress.upsertLockNoodleToken:', ret.gasPrice!.toString());
  }
  console.log('instanceConfigAddress.upsertNoodleLocking:', instanceLocking.address);

  //await instanceConfigAddress.updateBlockUrl(instanceConfigAddress.address,"test4");
  if (tokens != null) {
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, element.address, element.symbol, {
        gasPrice: gasprice,
        gasLimit: instanceConfigAddress.estimateGas.upsertGameToken(
          instanceGameFactory.address,
          element.address,
          element.symbol
        ),
      });
      console.log('instanceConfigAddress.upsertGameToken:0:', element.address, element.symbol);
    }
  }
  // console.log('xxxxxxxxxxxxxx:0:', await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T0'));
  console.log('################instanceGameFactory address: ', instanceGameFactory.address);
  // console.log("###########################", (await instanceConfigAddress.configMap(instanceGameFactory.address)).factoryAddress);
  let T0Addr = await instanceConfigAddress.getLockNoodleToken(instanceGameFactory.address)
  console.log('################T0Addr: ', T0Addr);

  if (
    (await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T0')) ==
    '0x0000000000000000000000000000000000000000'
  ) {
    let t0;
    let tmpsymbol = 'T0';
    if (configAddress && configAddress.ndlToken) {
      for (let index = 0; index < configAddress.gameTokens.length; index++) {
        const element = configAddress.gameTokens[index] as any as ERC20Faucet;
        const ERC20Factory = await ethers.getContractFactory('ERC20Faucet');
        let instanceERC20 = ERC20Factory.connect(owner).attach(element.id) as ERC20Faucet;
        if ((await instanceERC20.symbol()) == tmpsymbol) {
          t0 = instanceERC20;
          console.log('reuse T0 address:', t0.address);
          break;
        }
      }
    }
    if (!t0) {
      t0 = (await erc20ContractFactory.connect(owner).deploy('Test Token 0', tmpsymbol, 6, {
        gasLimit: await ethers.provider.estimateGas(
          erc20ContractFactory.getDeployTransaction('Test Token 0', tmpsymbol, 6)
        ),
      })) as ERC20Faucet;
      console.log('new T0 address:', t0.address);
    }
    ret = await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t0.address, tmpsymbol, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
      // gasLimit: await instanceConfigAddress.estimateGas['upsertGameToken(address,address,string)'](
      //   instanceGameFactory.address,
      //   t0.address,
      //   tmpsymbol
      // ),
    });
    if (!ret.gasPrice) {
      console.log('instanceConfigAddress.upsert:', ret);
      let ret1 = await ret.wait();
      console.log('instanceConfigAddress.upsert:', ret1);
    } else {
      console.log('instanceConfigAddress.upsertGameToken:1:', ret.gasPrice!.toString());
    }
  }
  if (
    (await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T1')) ==
    '0x0000000000000000000000000000000000000000'
  ) {
    let t1;
    let tmpsymbol = 'T1';
    if (configAddress && configAddress.ndlToken) {
      for (let index = 0; index < configAddress.gameTokens.length; index++) {
        const element = configAddress.gameTokens[index] as any as ERC20Faucet;
        const ERC20Factory = await ethers.getContractFactory('ERC20Faucet');
        let instanceERC20 = ERC20Factory.connect(owner).attach(element.id) as ERC20Faucet;
        if ((await instanceERC20.symbol()) == tmpsymbol) {
          t1 = instanceERC20;
          console.log('reuse T1 address:', t1.address);
          break;
        }
      }
    }
    if (!t1) {
      t1 = (await erc20ContractFactory.connect(owner).deploy('Test Token 1', tmpsymbol, 18, {
        gasLimit: ethers.provider.estimateGas(erc20ContractFactory.getDeployTransaction('Test Token 1', tmpsymbol, 18)),
      })) as ERC20Faucet;
      console.log('new T1 address:', t1.address);
    }
    ret = await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t1.address, tmpsymbol, {
      gasPrice: gasprice,
      gasLimit: await instanceConfigAddress.estimateGas['upsertGameToken(address,address,string)'](
        instanceGameFactory.address,
        t1.address,
        tmpsymbol
      ),
    });
    if (!ret.gasPrice) {
      console.log('instanceConfigAddress.upsert:', ret);
      let ret1 = await ret.wait();
      console.log('instanceConfigAddress.upsert:', ret1);
    } else {
      console.log('instanceConfigAddress.upsertGameToken:2:', ret.gasPrice!.toString());
    }
  }
  let instanceERC20 = (await erc20ContractFactory.connect(owner).deploy('Test BOST', 'BOST', 18, {
    gasLimit: ethers.provider.estimateGas(erc20ContractFactory.getDeployTransaction('Test BOST', 'BOST', 18)),
  })) as ERC20Faucet;
  console.log('GameERC20 address:', instanceERC20.address);
  let tmpsymbol = await instanceERC20.symbol();
  await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, instanceERC20.address, tmpsymbol, {
    gasPrice: gasprice,
    gasLimit: blockGaslimit,
  });
  console.log('instanceConfigAddress.upsertGameToken:3:', instanceERC20.address, tmpsymbol);
  //初始化可挖矿总额
  await instanceNDLToken['faucet(address,uint256)'](instanceStaking.address, ethers.utils.parseEther('10000'));
  await instanceNDLToken['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  await instanceERC20['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  if (user) {
    await instanceNDLToken['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
    await instanceERC20['faucet(address,uint256)'](user.address, ethers.utils.parseEther('1000'));
  }

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
        gasLimit: blockGaslimit,
        // gasLimit: await instanceGame.estimateGas['placeGame(uint8[],uint256[],uint256,uint256)'](
        //   [0],
        //   [ethers.utils.parseEther('10')],
        //   0,
        //   boutils.GetUnixTimestamp() + 1000
        // ),
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
    // await (
    //   await instanceGameFactory.addStakeInfo(instanceGame.address, ethers.utils.parseEther('60'), deadline)
    // ).wait();
    for (let index = 0; index < 1; index++) {
      if (network.name == 'devnet') {
        await boutils.advanceBlock();
      }
      console.log(
        'instanceStaking.noodlePerSecond:',
        await (await instanceStaking.stakeInfoMap(instanceGame.address)).noodlePerBlock.toString()
      );
      console.log(
        'pending reward:',
        (await instanceStaking.getPendingReward(instanceGame.address, owner.address)).toString()
      );
      // await instanceGame['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('100'));
      let pending = await instanceStaking.getPendingReward(instanceGame.address, owner.address);
      console.log('xxxxxxx:0:', (await instanceNDLToken.balanceOf(owner.address)).toString(), pending.toString());
      await instanceGame.approve(instanceStaking.address, ethers.utils.parseEther('1.0'), {
        gasLimit: blockGaslimit,
      });
      pending = await instanceStaking.getPendingReward(instanceGame.address, owner.address);
      console.log('xxxxxxx:1:', pending.toString());
      await instanceStaking.deposit(instanceGame.address, ethers.utils.parseEther('0.01'), {
        gasLimit: blockGaslimit,
      });
      pending = await instanceStaking.getPendingReward(instanceGame.address, owner.address);
      console.log('xxxxxxx:2:', pending.toString());
      await instanceStaking.withdraw(instanceGame.address, pending.div(2), {
        // gasLimit: await instanceStaking.estimateGas['withdraw(address,uint256)'](instanceGame.address, pending.div(2)),
        gasLimit: blockGaslimit,
        from: owner.address,
      });
      console.log('xxxxxxx:4:', (await instanceNDLToken.balanceOf(owner.address)).toString());
      // await instanceGame.openGame(0, {
      //   gasPrice: gasprice,
      //   // gasLimit: await instanceGame.estimateGas['openGame(uint8)'](0),
      //   gasLimit: blockGaslimit,
      // });
      // console.log('xxxxxxx:1');
      // console.info('instanceGame.openGame:ok');
      // await instanceGame.challengeGame(0, {
      //   gasPrice: gasprice,
      //   gasLimit: blockGaslimit,
      // });
      // console.info('instanceGame.challengeGame:ok');
      // await instanceGame.addVote(1, {
      //   gasPrice: gasprice,
      //   gasLimit: blockGaslimit,
      // });
      // await instanceVote.add(instanceGame.address, owner.address, 1, {
      //   gasPrice: gasprice,
      //   gasLimit: blockGaslimit,
      //   // gasLimit: await instanceVote.estimateGas['add(address,address,uint8)'](instanceGame.address, owner.address, 1),
      // });
    }
    console.info('instanceVote.add:ok');
  });
  console.log(
    '-------instanceGameFactory.createGame--------',
    blockGaslimit.toString(),
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );
  let tmpLimit = blockGaslimit;
  // let tmpLimit = await instanceGameFactory.estimateGas[
  //   'createGame(address,string,string,string[],uint256[],string,uint256)'
  // ](
  //   instanceERC20.address,
  //   'Test T0',
  //   'T0',
  //   ['BIG', 'SMALL'],
  //   [ethers.utils.parseEther('40'), ethers.utils.parseEther('60')],
  //   'https://github.com/NoodleDAO/noodleswap',
  //   deadline
  // );
  console.log('xxxx:tmpLimit:', tmpLimit.toString(), gameFactoryContractFactory.bytecode.length);
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
      gasLimit: blockGaslimit,
      // gasLimit: tmpLimit.mul(2),
    }
  );
  let ret2 = await ret1;
  console.log(ret1);
  console.log(ret2);
  let ret3 = await ret2.wait(1);
  // console.log(ret2);
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
  console.log(
    '-------instanceLocking.addLockingPoolInfo--------',
    blockGaslimit.toString(),
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );
  let ret4 = instanceLocking.addLockingPoolInfo(
    ethers.utils.parseEther('3.0'),
    {
      gasPrice: gasprice.add(1),
      gasLimit: blockGaslimit,
    }
  );
  let ret5 = await ret4;
  console.log(ret4);
  console.log(ret5);
  let ret6 = await ret5.wait(1);
  // console.log(ret2);
  console.log(ret6);
  console.log('-------instanceLocking.addLockingPoolInfo--------end');


  console.log(
    '-------instanceLocking.createLock--------',
    blockGaslimit.toString(),
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );
  // let myTestAccount = new ethers.Wallet('cdfea5ce686fd368a7cc2827c68ae7e4af107f1fa51030565d01ad232389c156', ethers.provider);
  // await instanceNDLToken['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('1000'));
  console.log(' NDL Balance: ', (await instanceNDLToken.balanceOf(owner.address)).toString());
  await instanceNDLToken.approve(instanceLocking.address, ethers.utils.parseEther('100.0'), {
    gasPrice: gasprice.add(1),
    gasLimit: blockGaslimit,
  });

  await instanceNDLToken.transferFrom(owner.address, instanceLocking.address, ethers.utils.parseEther('1.0'))
  console.log(' instanceLocking NDL Balance: ', (await instanceNDLToken.balanceOf(instanceLocking.address)).toString());

  console.log('lock 10 noodle token into locking pool');
  // console.log('block timestamp',(await ethers.provider.getBlock("latest")).timestamp);
  var ts = (await ethers.provider.getBlock("latest")).timestamp;
  ret4 = instanceLocking.createLock(
    ethers.utils.parseEther('10.0'),
    ts + 10000,
    {
      gasPrice: gasprice.add(1),
      gasLimit: blockGaslimit,
    }
  );
  ret5 = await ret4;
  console.log(ret4);
  console.log(ret5);
  ret6 = await ret5.wait(1);
  // console.log(ret2);
  console.log(ret6);
  let lockedAmont = await instanceLocking.lockedAmount(owner.address)
  console.log('user locked amount: ', lockedAmont.toString());

  let totalLockedAmount = await instanceLocking.fetchTotalLockedAmount();
  console.log('total locked amount: ', totalLockedAmount.toString());

  console.log('-------instanceLocking.createLock--------end');

};

main();
