import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { NoodleStaking } from '../typechain/NoodleStaking';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import * as config from '../.config';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';
import { setInterval } from 'timers';

let main = async () => {
  console.log('network:', network.name, (await ethers.provider.getNetwork()).chainId);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

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

  const instanceNDLToken = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('NoodleToken', 'NDLT', 18)) as ERC20Faucet;
  console.log('new NoodleToken address:', instanceNDLToken.address);

  const instanceUSDT = (await (await ethers.getContractFactory('ERC20Faucet'))
    .connect(owner)
    .deploy('Test BUSDT', 'BUSDT', 6)) as ERC20Faucet;
  console.log('new BUSDT address:', instanceUSDT.address, blockGaslimit.toString());

  const instanceStaking = (await (await ethers.getContractFactory('NoodleStaking'))
    .connect(owner)
    .deploy(instanceNDLToken.address, owner.address)) as NoodleStaking;
  await instanceStaking.add(instanceUSDT.address, ethers.utils.parseEther('0.0001'));
  console.log('new NoodleStaking address:0:', instanceStaking.address);
  await instanceNDLToken['faucet(address,uint256)'](instanceStaking.address, ethers.utils.parseEther('100000000.1'));
  await instanceUSDT['faucet(address,uint256)'](owner.address, ethers.utils.parseEther('100000000.1'));
  await instanceUSDT.transfer(instanceStaking.address, ethers.utils.parseEther('1'), { from: owner.address });
  await instanceStaking.deposit(instanceUSDT.address, ethers.utils.parseEther('1'), { from: owner.address });
  setInterval(async () => {
    await boutils.advanceBlock();
    console.log(
      'pending reward:',
      (await instanceStaking.getPendingReward(instanceUSDT.address, owner.address)).toString()
    );
  }, 1000);
  setInterval(async () => {
    await instanceStaking.deposit(instanceUSDT.address, ethers.utils.parseEther('0.01'), { from: owner.address });
    let pending = await instanceStaking.getPendingReward(instanceUSDT.address, owner.address);
    await instanceStaking.withdraw(instanceUSDT.address, pending.div(2), { from: owner.address });
  }, 5000);
  console.log('instanceUSDT balance:', (await instanceUSDT.balanceOf(owner.address)).toString());
};

main();
