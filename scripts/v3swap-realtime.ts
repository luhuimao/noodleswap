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
  instanceV3USDCETH.on(
    eventFilter,
    async (sender, receiver, amount0: BigNumber, amount1: BigNumber, sqrtPriceX96, liquidity, tick) => {
      let block = await ethers.provider.getBlock('latest');
      let ltime = moment().format('YYYY-MM-DD HH:mm:ss');
      let rtime = moment(parseInt(block.timestamp.toString()) * 1000).format('YYYY-MM-DD HH:mm:ss');
      let side = parseInt(amount0.toString()) < 0 ? 'SEL' : 'BUY';
      let usdc = parseInt(amount0.abs().toString());
      let eth = parseInt(amount1.abs().toString());
      console.log(
        'V3.Swap:',
        ltime,
        rtime,
        side,
        block.number,
        usdc,
        eth,
        (usdc / 1e6 / (eth / 1e18)).toString(),
        (usdc / 1e6).toString()
      );
    }
  );
};

main();
