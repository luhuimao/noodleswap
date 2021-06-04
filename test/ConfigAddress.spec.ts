import { ethers, network, waffle } from 'hardhat';
import { ConfigAddress } from '../typechain/ConfigAddress';
import { expect } from './utils/expect';

console.log('network:', network.name);
describe('ConfigAddress', () => {
  const [owner, user] = waffle.provider.getWallets();
  let instance: ConfigAddress;
  before('deploy test contract', async () => {
    console.log('deploy account:', owner.address, ethers.utils.formatEther((await owner.getBalance()).toString()));
    instance = (await (await ethers.getContractFactory('ConfigAddress')).deploy()) as ConfigAddress;
  });

  describe('upsert', () => {
    it('upsert ok', async () => {
      await instance.upsert(
        instance.address,
        network.config.chainId || 0,
        instance.address,
        instance.address,
        instance.address,
        'testUrl',
        'blockUrl',
        network.name
      );
      expect((await instance.configMap(instance.address)).factoryAddress).to.eq(instance.address);
    });
  });
});
