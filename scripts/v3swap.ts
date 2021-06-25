import { exec } from 'child_process';
import 'moment';
import { ethers, network, artifacts } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { Game } from '../typechain/Game';
import { LGame } from '../typechain/LGame';
import { LGameFactory } from '../typechain/LGameFactory';
// import * as V3Pool from '../abis/pool.json';
import { PlayNFT } from '../typechain/PlayNFT';
import { NoodleStaking } from '../typechain/NoodleStaking';
import { GameFactory } from '../typechain/GameFactory';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import * as config from '../.config';
import { BigNumber, Contract } from 'ethers';
import { getOwnerPrivateKey } from '../.privatekey';
import * as boutils from './boutils';
import moment from 'moment';
const V3Pool = require('../abis/pool.json');

let main = async () => {
  console.log('network:', network.name, (await ethers.provider.getNetwork()).chainId);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));

  const instanceV3USDCETH = await ethers.getContractAt(V3Pool, '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8');
  console.log('USDCETH V3Pool address:', instanceV3USDCETH.address);
  // 下注代币
  let eventFilter = instanceV3USDCETH.filters.Swap(null, null, null, null, null, null, null);
  // instanceV3USDCETH.on(
  //   eventFilter,
  //   async (sender, receiver, amount0: BigNumber, amount1: BigNumber, sqrtPriceX96, liquidity, tick) => {
  //     let block = await ethers.provider.getBlock('latest');
  //     let ltime = moment().format('YYYY-MM-DD HH:mm:ss');
  //     let rtime = moment(parseInt(block.timestamp.toString()) * 1000).format('YYYY-MM-DD HH:mm:ss');
  //     // lettime = moment('时间戳').format("'YYYY-MM-DD HH:mm:ss'"
  //     console.log(
  //       'V3.Swap:',
  //       ltime,
  //       rtime,
  //       element.blockNumber.toString(),
  //       amount0.abs().toString(),
  //       amount1.abs().toString()
  //     );
  //   }
  // );
  let step = 1000;
  //12603435 v3第一单
  //12603435 2021-06-10 00:00
  //12680684 2021-06-22 00:00
  let block = await ethers.provider.getBlock('latest');
  let beginBlock = 12680684;
  let latestBlock = block.number;
  let lastblockNumber = 0;
  block = await ethers.provider.getBlock(lastblockNumber);
  for (let i = beginBlock; i < latestBlock; i = i + step) {
    let query = await instanceV3USDCETH.queryFilter(eventFilter, i, i + step); // 'latest');
    for (let index = 0; index < query.length; index++) {
      const element = query[index];
      if (lastblockNumber != element.blockNumber) {
        block = await ethers.provider.getBlock(element.blockNumber);
        lastblockNumber = element.blockNumber;
      }
      let side = element.args?.amount0 < 0 ? 'SEL' : 'BUY';
      let usdc = element.args?.amount0.abs().toString();
      let eth = element.args?.amount1.abs().toString();
      let rtime = moment(parseInt(block.timestamp.toString()) * 1000).format('YYYY-MM-DD HH:mm:ss');
      console.log(
        // 'V3.Swap:',
        rtime,
        element.args?.recipient.toString(),
        side,
        element.blockNumber.toString(),
        usdc,
        eth,
        (usdc / 1e6 / (eth / 1e18)).toString(),
        (usdc / 1e6).toString()
      );
    }
  }
  // async (sender, receiver, amount0: BigNumber, amount1: BigNumber, sqrtPriceX96, liquidity, tick) => {
  //   let block = await ethers.provider.getBlock('latest');
  //   let ltime = moment().format('YYYY-MM-DD HH:mm:ss');
  //   let rtime = moment(parseInt(block.timestamp.toString()) * 1000).format('YYYY-MM-DD HH:mm:ss');
  //   // lettime = moment('时间戳').format("'YYYY-MM-DD HH:mm:ss'"
  //   console.log(
  //     'V3.Swap:',
  //     ltime,
  //     rtime,
  //     block.timestamp.toString(),
  //     amount0.abs().toString(),
  //     amount1.abs().toString()
  //   );
  // }
};

main();
