import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { Game } from '../typechain/Game';
import { Vote } from '../typechain/Vote';
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
  let gasprice = (await owner.getGasPrice()).add(1);
  let blockGaslimit0 = (await ethers.provider.getBlock('latest')).gasLimit;
  let blockGaslimit = blockGaslimit0.div(4);
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
    ethers.utils.formatEther(
      (await owner.estimateGas(tmp0.getDeployTransaction('WETH9', 'WETH9', 18))).mul(await owner.getGasPrice())
    )
  );
  let deadline = boutils.GetUnixTimestamp() + 86400;
  let tmp1 = await ethers.getContractFactory('Game');
  console.log(
    'deploy Game gas:',
    ethers.utils.formatEther(
      (
        await owner.estimateGas(
          tmp1.getDeployTransaction(owner.address, owner.address, [1, 2], deadline, owner.address, owner.address)
        )
      ).mul(await owner.getGasPrice())
    ),
    tmp1.bytecode.length
  );
  const tmp2 = await ethers.getContractFactory('GameFactory');
  console.log(
    'deploy GameFactory gas:',
    ethers.utils.formatEther(
      await (
        await owner.estimateGas(tmp2.getDeployTransaction(owner.address, owner.address))
      ).mul(await owner.getGasPrice())
    ),
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

  let instaceVote: Vote;
  instaceVote = (await (await ethers.getContractFactory('Vote'))
    .connect(owner)
    .deploy(instanceNDLToken.address)) as Vote;
  console.log('new Vote address:', instaceVote.address);

  const instanceUSDT = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BUSDT', 'BUSDT', 6)) as ERC20Faucet;
  console.log('new BUSDT address:', instanceUSDT.address, blockGaslimit.toString());

  const instanceGameFactory = (await (await ethers.getContractFactory('GameFactory'))
    .connect(owner)
    .deploy(instanceNDLToken.address, instaceVote.address, {
      gasPrice: await owner.getGasPrice(),
      gasLimit: blockGaslimit,
    })) as GameFactory;
  console.log('new GameFactory address:', instanceGameFactory.address);

  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'GAMEFACTORY_ADDRESS_' + network.name.toUpperCase();
  boutils.ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instanceGameFactory.address + '"; ' + flag);

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
    { gasPrice: gasprice, gasLimit: blockGaslimit }
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
    ret = await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t0.address, await t0.symbol(), {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
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
    await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t1.address, await t1.symbol(), {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
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

  await instanceConfigAddress.upsertGameToken(
    instanceGameFactory.address,
    instanceERC20.address,
    await instanceERC20.symbol(),
    { gasPrice: gasprice, gasLimit: blockGaslimit }
  );
  console.log('instanceConfigAddress.upsertGameToken:', instanceERC20.address, await instanceERC20.symbol());
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
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      }
    );
    await instanceGame.placeGame(
      instanceERC20.address,
      [0],
      [ethers.utils.parseEther('15')],
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      }
    );
    await instanceGame.placeGame(
      instanceERC20.address,
      [1],
      [ethers.utils.parseEther('20')],
      boutils.GetUnixTimestamp() + 1000,
      {
        gasPrice: gasprice,
        gasLimit: blockGaslimit,
      }
    );
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    //console.log('-------addLiquidity--------');
    let liquidity = await instanceGame.addLiquidity(instanceERC20.address, ethers.utils.parseEther('102'), {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    });
    console.log('add liquidity:');
    console.log('game optionNames[0]:', await instanceGame.options(0));
    console.log('game optionNames[1]:', await instanceGame.options(1));
    //console.log('-------removeLiquidity--------');
    let amount = await instanceGame.removeLiquidity(ethers.utils.parseEther('20'), boutils.GetUnixTimestamp() + 1000, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    });
    await instanceGame.stakeGame(1);
    await instanceGame.openGame(0);
    await instaceVote.add(instanceGame.address, owner.address, 1, {
      gasPrice: gasprice,
      gasLimit: blockGaslimit,
    });
  });
  console.log(
    '-------instanceGameFactory.createGame--------',
    blockGaslimit0.toString(),
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );
  let ret1 = instanceGameFactory.createGame(
    instanceERC20.address,
    'Test T0',
    ['BIG', 'SMALL'],
    [ethers.utils.parseEther('40'), ethers.utils.parseEther('60')],
    'https://github.com/NoodleDAO/noodleswap',
    deadline,
    {
      gasPrice: gasprice.add(1),
      gasLimit: blockGaslimit0,
    }
  );
  console.log(ret1);
  await ret1;
  console.log(ret1);
  console.log('-------instanceGameFactory.createGame--------end');
};

main();
