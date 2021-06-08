import { ethers, network } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';

let main = async () => {
  console.log('network:', network.name);
  let deadline = boutils.GetUnixTimestamp() + 86400;
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log(
    'deploy account:',
    network.name,
    owner.address,
    ethers.utils.formatEther((await owner.getBalance()).toString())
  );

  console.log(
    await ethers.provider.getTransaction('0x385f04fad19072e2a4ebb459a2989a05fa1b7ecc901a1edf6ea39513993a4183')
  );
  console.log(
    await ethers.provider.getTransactionReceipt('0x385f04fad19072e2a4ebb459a2989a05fa1b7ecc901a1edf6ea39513993a4183')
  );
  console.log('wwwww:', (await ethers.provider.getBlockWithTransactions('latest')).transactions);
};

main();
