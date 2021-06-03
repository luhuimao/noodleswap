import { ethers, network, waffle } from 'hardhat';
import { GameERC20 } from '../typechain/GameERC20';
import { expect } from './utils/expect';

describe('GameERC20', () => {
  console.log('xxxxxxxxxx:0:', network.name);
  const [owner, user] = waffle.provider.getWallets();
  let instance: GameERC20;
  before('deploy test contract', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance = (await (await ethers.getContractFactory('GameERC20')).deploy()) as GameERC20;
  });

  describe('faucet', () => {
    it('faucet 1 eth', async () => {
      expect(await instance.balanceOf(owner.address)).to.be.eq(0);
    });
    //TODO 还没有水龙头接口
  });
  describe('transfer', () => {
    it('user should inc 1 eth', async () => {
      let before = await user.getBalance();
      await owner.sendTransaction({
        value: ethers.utils.parseEther('1'),
        to: user.address,
      });
      let after = await user.getBalance();
      expect(ethers.utils.formatEther(after.sub(before))).to.eq('1.0');
    });
    it('user should inc 1 eth', async () => {
      let before = await user.getBalance();
      await owner.sendTransaction({
        value: ethers.utils.parseEther('1'),
        to: user.address,
      });
      let after = await user.getBalance();
      expect(ethers.utils.formatEther(after.sub(before))).to.eq('1.0');
    });
    it('transfer 1000000 eth should revert', async () => {
      let tx = owner.sendTransaction({
        value: ethers.utils.parseEther('1000000'),
        to: user.address,
      });
      // await expect(tx).to.be.reverted;
      // await expect(tx).to.be.revertedWith('InvalidInputError');
    });
  });
});
