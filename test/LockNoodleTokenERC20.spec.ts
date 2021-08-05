import { ethers, network, waffle } from 'hardhat';
import { LockNoodleTokenERC20 } from '../typechain/LockNoodleTokenERC20';
import { expect } from './utils/expect';

describe('LockNoodleTokenERC20', () => {
  console.log('xxxxxxxxxx:0:', network.name);
  const [owner, user, user1] = waffle.provider.getWallets();
  let instance: LockNoodleTokenERC20;
  before('deploy test contract', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance = (await (await ethers.getContractFactory('LockNoodleTokenERC20')).deploy('LockNoodleToken', 'lckndl')) as LockNoodleTokenERC20;
  });
  describe('get token info', () => {
    it('get token detail', async () => {
      let tokenname = await instance.name();
      let tokensymbol = await instance.symbol();
      console.log('token name:', tokenname)
      console.log('token symbol:', tokensymbol)
      expect(await instance.name()).to.be.eq('LockNoodleToken');
      expect(await instance.symbol()).to.be.eq('lckndl');
    });
  });
  describe('mint', () => {
    it('mint 1 locknoodle', async () => {
      let before = await user.getBalance();
      console.log('balance of ', user.address, before.toString());
      let before_totalSupply = await instance.totalSupply();
      console.log('locknoodle token total supply: ', before_totalSupply.toString());
      await instance.mint(owner.address, 10);

      let after_totalSupply = await instance.totalSupply();
      console.log('locknoodle token total supply: ', after_totalSupply.toString());
      expect(await instance.balanceOf(owner.address)).to.be.eq(10);
      expect(await instance.totalSupply()).to.be.eq(10);

    });

    it('transfer', async () => {
      await instance.transfer(user.address, 1);
      expect(await instance.balanceOf(owner.address)).to.be.eq(9);
    });

    it('transferFrom', async () => {
      const [_, addr1] = await ethers.getSigners();

      await instance.approve(addr1.address, 1);
      expect(await instance.allowance(owner.address, addr1.address)).to.be.eq(1);
      console.log((await instance.balanceOf(addr1.address)).toString());
      let balance = await instance.balanceOf(owner.address);
      console.log(balance.toString());
      await instance.connect(addr1).transferFrom(owner.address, addr1.address, 1);
      expect(await instance.balanceOf(addr1.address)).to.be.eq(2);
    })
    it('mint by not owner', async () => {
      await expect(instance.connect(user.address).mint(user.address, 1)).to.be.reverted;
    });
  });

  describe('burn', () => {
    it('burn 1 locknoodle', async () => {
      let before = await instance.balanceOf(user.address);
      console.log('locknoodle token balance of ', user.address, before.toString());
      await instance.burn(user.address, 1);
      let after = await instance.balanceOf(user.address);
      console.log('locknoodle token balance of ', user.address, after.toString());
      expect(await instance.balanceOf(user.address)).to.be.eq(after);
      expect(await instance.totalSupply()).to.be.eq(9);
    });

    it('burn by not owner', async () => {
      await expect(instance.connect(user.address).burn(user.address, 1)).to.be.reverted;
    });
  });

  /*
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
      let tx = instance.transfer(user.address, 1);
      await expect(tx).to.be.reverted;
      // await expect(tx).to.be.revertedWith('InvalidInputError');
    });
    // it('checkFalse should revert', async () => {
    //   await expect(instance.checkFalse()).to.be.reverted;
    //   await expect(instance.checkFalse()).to.be.revertedWith('false');
    // });
  });*/
});
