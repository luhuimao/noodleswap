import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { Game } from '../typechain/Game';
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
  let tmp1 = await ethers.getContractFactory('Game');
  console.log(
    'deploy Game gas:',
    ethers.utils.formatEther(
      (
        await owner.estimateGas(
          tmp1.getDeployTransaction(
            owner.address,
            owner.address,
            'test',
            ['t0', 't1'],
            [1, 2],
            'test',
            1,
            owner.address
          )
        )
      ).mul(await owner.getGasPrice())
    )
  );
  const tmp2 = await ethers.getContractFactory('GameFactory');
  console.log(
    'deploy GameFactory gas:',
    ethers.utils.formatEther(
      await (await owner.estimateGas(tmp2.getDeployTransaction(owner.address))).mul(await owner.getGasPrice())
    )
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

  const instanceUSDT = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BUSDT', 'BUSDT', 6)) as ERC20Faucet;
  console.log(
    'new BUSDT address:',
    instanceUSDT.address,
    (await ethers.provider.getBlock('latest')).gasLimit.toString()
  );

  const instanceGameFactory = (await (await ethers.getContractFactory('GameFactory'))
    .connect(owner)
    .deploy(instanceNDLToken.address, {
      gasPrice: 1,
      gasLimit: (await ethers.provider.getBlock('latest')).gasLimit,
    })) as GameFactory;
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
  let chainId = (await ethers.provider.getNetwork()).chainId;

  //方便目前测试已经部署的业务
  //let ret = await (
  let ret = await instanceConfigAddress.upsert(
    instanceGameFactory.address,
    chainId,
    instanceNDLToken.address,
    instanceWETH9.address,
    instanceUSDT.address,
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://testnet.bscscan.com',
    network.name,
    { gasPrice: 1, gasLimit: (await ethers.provider.getBlock('latest')).gasLimit }
  );
  //).wait(1);
  //console.log('instanceConfigAddress.upsert:', ret.transactionHash);
  console.log('instanceConfigAddress.upsert:', ret.gasPrice.toString());
  // */

  //await instanceConfigAddress.updateBlockUrl(instanceConfigAddress.address,"test4");
  if (tokens != null) {
    for (let index = 0; index < tokens.length; index++) {
      const element = tokens[index];
      await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, element.address, element.symbol);
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
    await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t0.address, await t0.symbol());
  }
  if (
    (await instanceConfigAddress.getGameToken(instanceGameFactory.address, 'T1')) ==
    '0x0000000000000000000000000000000000000000'
  ) {
    const t1 = (await (await ethers.getContractFactory('ERC20Faucet'))
      .connect(owner)
      .deploy('Test Token 1', 'T1', 18)) as ERC20Faucet;
    console.log('new T1 address:', t1.address);
    await instanceConfigAddress.upsertGameToken(instanceGameFactory.address, t1.address, await t1.symbol());
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
  let deadline = Date.now() + 86400000;
  await instanceGameFactory.createGame(
    instanceERC20.address,
    'Test T0',
    ['BIG', 'SMALL'],
    [ethers.utils.parseEther('50'), ethers.utils.parseEther('50')],
    'https://github.com/NoodleDAO/noodleswap',
    deadline
  );
};

main();
