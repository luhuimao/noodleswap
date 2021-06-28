import { exec } from 'child_process';
import { config, ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { getOwnerPrivateKey } from '../.privatekey';
import { ReplaceLine } from './boutils';

let main = async () => {
  console.log('network:', network.name, (await ethers.provider.getNetwork()).chainId);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();
  // if (network.name == 'localhost') {
  //   let ret2 = await owner.sendTransaction({
  //     to: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
  //     value: ethers.utils.parseEther('0.001'),
  //   });
  //   console.log(ret2);
  //   let ret3 = await ret2.wait(1);
  //   console.log(ret3);
  // }

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  let gasLimit = (await ethers.provider.getBlock('latest')).gasLimit;
  const instance = (await (await ethers.getContractFactory('ConfigAddress')).connect(owner).deploy({
    gasLimit: gasLimit,
  })) as ConfigAddress;
  console.log('new ConfigAddress address:', instance.address);
  gasLimit = await instance.estimateGas['upsertGameToken(address,address,string)'](
    instance.address,
    instance.address,
    'TEST'
  );
  // if (network.name == 'localhost') {
  //   let ret = await instance.upsertGameToken(instance.address, instance.address, 'TEST', {
  //     gasLimit,
  //   });
  //   console.log('xxxxxx:', gasLimit, ret);
  //   let ret1 = await ret.wait(1);
  //   console.log('xxxxxx:', gasLimit, ret1.events);
  // }
  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'CONFIGADDRESS_ADDRESS_' + network.name.toUpperCase();
  ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instance.address + '"; ' + flag);
  key = 'DEPLOY_ACCOUNT_' + network.name.toUpperCase();
  ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + owner.address + '"; ' + flag);
};

main();
