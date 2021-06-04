import { exec } from 'child_process';
import { config, ethers, network } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { getOwnerPrivateKey } from '../.privatekey';
import { ReplaceLine } from './boutils';

let main = async () => {
  console.log('network:', network.name);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  const instance = (await (await ethers.getContractFactory('ConfigAddress')).connect(owner).deploy()) as ConfigAddress;
  console.log('new ConfigAddress address:', instance.address);
  let flag = '\\/\\/REPLACE_FLAG';
  let key = 'CONFIGADDRESS_ADDRESS_' + network.name.toUpperCase();
  ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + instance.address + '"; ' + flag);
  key = 'DEPLOY_ACCOUNT_' + network.name.toUpperCase();
  ReplaceLine('.config.ts', key + '.*' + flag, key + ' = "' + owner.address + '"; ' + flag);
};

main();
