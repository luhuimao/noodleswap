import { assertObjectType } from 'graphql';
import { ethers, network, waffle } from 'hardhat';
import { LockNoodleTokenERC20 } from '../typechain/LockNoodleTokenERC20';
import { NoodleLocking } from '../typechain/NoodleLocking';
import { NoodleTokenERC20 } from '../typechain/NoodleTokenERC20'
import { expect } from './utils/expect';

describe('LockingNoodleToken', () => {
  console.log('xxxxxxxxxx:0:', network.name);
  const [owner, user] = waffle.provider.getWallets();

  let instance_LockNoodleERC20: LockNoodleTokenERC20;
  let instance_NoodleTokenERC20: LockNoodleTokenERC20;
  let instance_LockingNoodle: NoodleLocking;
  before('deploy test contracts', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance_LockNoodleERC20 = (await (await ethers.getContractFactory('LockNoodleTokenERC20')).deploy('LockNoodleToken', 'lckndl')) as LockNoodleTokenERC20;
    instance_NoodleTokenERC20 = (await (await ethers.getContractFactory('LockNoodleTokenERC20')).deploy('NoodleToken', 'ndl')) as LockNoodleTokenERC20;
    console.log('Noodle Token address: ', instance_NoodleTokenERC20.address);
    instance_LockingNoodle = (await (await ethers.getContractFactory('NoodleLocking')).deploy(instance_NoodleTokenERC20.address, instance_LockNoodleERC20.address, 3)) as NoodleLocking;
    console.log('NoodleLocking address: ', instance_LockingNoodle.address);
  });

  describe('Locking Noodle Token', () => {
    it('mint 100 Noodle Token', async () => {
      await instance_NoodleTokenERC20.mint(owner.address, ethers.utils.parseEther('100.0'));
      let b = await instance_NoodleTokenERC20.balanceOf(owner.address);
      console.log(' noodle token balance:', b.toString());
      expect(await instance_NoodleTokenERC20.balanceOf(owner.address)).to.be.eq(ethers.utils.parseEther('100.0'));
    });

    it('lock 100 noodle token', async () => {
      await instance_LockingNoodle.addLockingPoolInfo(ethers.utils.parseEther('3.0'));
      await instance_NoodleTokenERC20.approve(instance_LockingNoodle.address, ethers.utils.parseEther('100.0'));
      let blocktimestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await instance_LockingNoodle.createLock(ethers.utils.parseEther('10.0'), blocktimestamp + 10000);

      await instance_NoodleTokenERC20.transfer(instance_LockingNoodle.address, ethers.utils.parseEther('10.0'));

      expect(await instance_LockingNoodle.fetchTotalLockedAmount()).to.be.eq(ethers.utils.parseEther('10.0'));

      expect(await instance_NoodleTokenERC20.balanceOf(instance_LockingNoodle.address)).to.be.eq(ethers.utils.parseEther('20.0'));

      expect(await instance_NoodleTokenERC20.balanceOf(owner.address)).to.be.eq(ethers.utils.parseEther('80.0'));
      expect(await instance_LockNoodleERC20.balanceOf(owner.address)).to.be.eq(ethers.utils.parseEther('10.0'));
    })

    it('get user noodle token locked amount', async () => {
      console.log('locked noodle amount: ', (await instance_LockingNoodle.lockedAmount(owner.address)).toString());
      expect(await instance_LockingNoodle.lockedAmount(owner.address)).to.be.eq(ethers.utils.parseEther('10.0'));
    });


    it('get user noodle token unlock time', async () => {
      let lockBeginTimeStamp = await instance_LockingNoodle.lockedBegin(owner.address);
      console.log('lock begin timestamp: ', lockBeginTimeStamp.toString());
      // expect(await instance_LockingNoodle.lockedEnd(owner.address)).to.be.eq(16287551830);
    });

    it('get pending reward noodle token', async () => {
      let reward = await instance_LockingNoodle.getPendingReward(owner.address);
      console.log('pending noodle reward: ', reward.toString());
    });

    it('withdraw noodle token ', async () => {
      let lockPoolBalance = await instance_NoodleTokenERC20.balanceOf(instance_LockingNoodle.address);
      console.log('lock pool balance: ', lockPoolBalance.toString());
      let reward = await instance_LockingNoodle.getPendingReward(owner.address);
      console.log('noodle reward: ', reward.toString());
      await instance_LockingNoodle.withdraw();
      console.log('lock pool balance: ', (await instance_NoodleTokenERC20.balanceOf(instance_LockingNoodle.address)).toString());
      console.log('locking pool balance: ', (await instance_LockingNoodle.fetchTotalLockedAmount()).toString());
      // expect(await instance_NoodleTokenERC20.balanceOf(owner.address)).to.be.eq(lockPoolBalance.add(reward));
      expect(await instance_LockNoodleERC20.balanceOf(owner.address)).to.be.eq(0);

    });



    // it('mint by not owner', async () => {
    //     await expect(instance.connect(user.address).mint(user.address, 1)).to.be.reverted;
  });

  /*
     describe('burn', () => {
         it('burn 1 locknoodle', async () => {
             let before = await instance.balanceOf(user.address);
             console.log('locknoodle token balance of ', user.address, before.toString());
             await instance.burn(user.address, 1);
             let after = await instance.balanceOf(user.address);
             console.log('locknoodle token balance of ', user.address, after.toString());
             expect(await instance.balanceOf(user.address)).to.be.eq(after);
         });
 
         it('burn by not owner', async () => {
             await expect(instance.connect(user.address).burn(user.address, 1)).to.be.reverted;
         });
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
