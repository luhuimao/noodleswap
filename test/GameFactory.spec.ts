import { ethers, network, waffle } from 'hardhat';
import { GameFactory } from '../typechain/GameFactory';
import { ERC20 } from '../typechain/ERC20';
import { expect } from './utils/expect';

describe('GameFactory', () => {
  const [owner, user] = waffle.provider.getWallets();
  let instance: GameFactory;
  let instanceERC20: ERC20;
  let deadline = Date.now() + 86400;
  before('deploy test contract', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance = (await (await ethers.getContractFactory('GameFactory')).deploy()) as GameFactory;
    instanceERC20 = (await (await ethers.getContractFactory('ERC20')).deploy('T0', 'Token 0')) as ERC20;
  });

  describe('createGame', () => {
    it('createGame', async () => {
      let gameAddress: String;
      let eventFilter = instance.filters._GameCreated(null, null, null, null, null, null, null);
      instance.once(eventFilter, (v0, v1) => {
        console.log('xxxxxxxxx:', v0, v1);
      });
      let tx = await instance.createGame(
        instanceERC20.address,
        'Test T0',
        ['BIG', 'SMALL'],
        [1, 1],
        'https://github.com/NoodleDAO/noodleswap',
        deadline
      );
      tx.wait(1);
      //expect(ethers.utils.formatEther(after.sub(before))).to.eq('1.0');
    });
  });
});
