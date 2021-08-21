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
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  let factoryaddr = config.getGameFactoryAddressByNetwork(network.name);
  if (factoryaddr == null) {
    console.error('factoryaddr address null:', network.name);
    return;
  }
  let voteaddr = config.getVoteAddressByNetwork(network.name);
  if (voteaddr == null) {
    console.error('voteaddr address null:', network.name);
    return;
  }
  let stakingaddr = config.getStakingAddressByNetwork(network.name);
  if (stakingaddr == null) {
    console.error('stakingaddr address null:', network.name);
    return;
  }
  let lockingaddr = config.getLockingAddressByNetwork(network.name);
  if (lockingaddr == null) {
    console.error('lockingaddr address null:', network.name);
    return;
  }
  const ConfigAddressFactory = await ethers.getContractFactory('ConfigAddress');
  let configaddr = config.getConfigAddressByNetwork(network.name);
  console.log('#############getConfigAddressByNetwork: ', configaddr);
  if (configaddr == null) {
    console.error('config address null:', network.name);
    return;
  }
  const instanceConfigAddress = ConfigAddressFactory.connect(owner).attach(configaddr) as ConfigAddressContract;
  if (configaddr != instanceConfigAddress.address) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! config addr error!!!!!!!!!');
  }
  console.log('ConfigAddress address:', instanceConfigAddress.address);
  let key = 'address';
  let flag = '#{{CONFIGADDRESS_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + instanceConfigAddress.address + '" ' + flag);
  flag = '#{{GAMEFACTORY_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + factoryaddr + '" ' + flag);
  flag = '#{{VOTE_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + voteaddr + '" ' + flag);
  flag = '#{{STAKING_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + stakingaddr + '" ' + flag);
  flag = '#{{LOCKING_ADDRESS}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': "' + lockingaddr + '" ' + flag);
  key = 'startBlock';
  flag = '#{{STARTBLOCK}}';
  ReplaceLine('subgraph.yaml', key + '.*' + flag, key + ': ' + config.getStartBlockNumber(network.name) + ' ' + flag);

  // 指定索引网络
  key = 'network';
  flag = '#replace mainnet';
  ReplaceLine(
    'subgraph.yaml',
    key + '.*' + flag,
    key + ': ' + config.getIndexingNetWorkName(network.name) + ' ' + flag
  );
};

main();
