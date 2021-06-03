import { ethers, network, waffle } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { expect } from './utils/expect';

console.log('network:', network.name);
describe('ERC20Faucet', () => {
  const [owner, user] = waffle.provider.getWallets();
  let instance: ERC20Faucet;
  before('deploy test contract', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance = (await (await ethers.getContractFactory('ERC20Faucet')).deploy('T0', 'Token 0', 18)) as ERC20Faucet;
  });

  describe('faucet', () => {
    it('faucet 1 eth', async () => {
      expect(await instance['faucet(uint256)'](1))
        .to.be.be.be.be.emit(instance, 'Transfer')
        .withArgs('0x0000000000000000000000000000000000000000', owner.address, 1);
      // expect(await instance.balanceOf(owner.address)).to.be.eq(0);
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
    it('transfer 1 should revert', async () => {
      let tx = instance.transfer(user.address, ethers.utils.parseEther('1'));
      await expect(tx).to.be.reverted;
      // await expect(tx).to.be.revertedWith('InvalidInputError');
    });
    // it('checkFalse should revert', async () => {
    //   await expect(instance.checkFalse()).to.be.reverted;
    //   await expect(instance.checkFalse()).to.be.revertedWith('false');
    // });
  });
});
