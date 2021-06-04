import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ConfigAddress as ConfigAddressContract } from '../typechain/ConfigAddress';
import { Contract } from 'ethers';
//import { TransactionReceipt } from 'web3-eth';
import { AbiCoder } from 'web3-eth-abi';
import { getOwnerPrivateKey } from '../.privatekey';
import { ReplaceLine } from './boutils';
import * as config from '../.config';

const abi: AbiCoder = require('web3-eth-abi');
let main = async () => {
  console.log('network:', network.name);
  let user;
  let owner = new ethers.Wallet(getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  let response = await config.GetConfigAddressByGameFactoryAddress(
    network.name,
    config.getGameFactoryAddressByNetwork(network.name)
  );

  let factoryaddr = config.getGameFactoryAddressByNetwork(network.name);
  if (factoryaddr == null) {
    console.error('gamerouter address null:', network.name);
    return;
  }
  const ConfigAddressFactory = await ethers.getContractFactory('ConfigAddress');
  let configaddr = config.getConfigAddressByNetwork(network.name);
  if (configaddr == null) {
    console.error('config address null:', network.name);
    return;
  }
  const instanceConfigAddress = ConfigAddressFactory.connect(owner).attach(configaddr) as ConfigAddressContract;
  console.log('ConfigAddress address:', instanceConfigAddress.address);
  let key = 'address';
  let flag = '#{{CONFIGADDRESS_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + instanceConfigAddress.address + '" ' + flag);
  flag = '#{{GAMEFACTORY_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + factoryaddr + '" ' + flag);
  key = 'startBlock';
  flag = '#{{STARTBLOCK}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + config.getStartBlockNumber(network.name) + '" ' + flag);
};

main();
