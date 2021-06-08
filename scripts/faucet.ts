import { exec } from 'child_process';
import { ethers, network } from 'hardhat';
import { ERC20Faucet } from '../typechain/ERC20Faucet';
import { GameFactory } from '../typechain/GameFactory';
import * as config from '../.config';
import { BigNumber, Contract, utils } from 'ethers';
//import { TransactionReceipt } from 'web3-eth';
import { AbiCoder } from 'web3-eth-abi';
import { getOwnerPrivateKey } from '../.privatekey';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import * as boutils from './boutils';
import { GameERC20 } from '../typechain';
import { ConfigAddress, ERC20Token } from '../generated/schema';

const abi: AbiCoder = require('web3-eth-abi');
let main = async () => {
  console.log('network:', network.name);
  let user;
  let owner = new ethers.Wallet(await getOwnerPrivateKey(network.name), ethers.provider);
  [, user] = await ethers.getSigners();

  console.log(
    'deploy account:',
    network.name,
    owner.address,
    ethers.utils.formatEther((await owner.getBalance()).toString())
  );

  let configAddress = await config.GetConfigAddressByGameFactoryAddress(
    network.name,
    config.getGameFactoryAddressByNetwork(network.name)
  );
  if (!configAddress) {
    console.log('configAddress null:', network.name, config.getGameFactoryAddressByNetwork(network.name));
    return;
  }
  const NDLTOKENFactory = await ethers.getContractFactory('ERC20Faucet');
  //address marketAddress, address omAddress, address adminAddress, address WETHAddress
  const instanceNDLTOKEN = NDLTOKENFactory.connect(owner).attach(
    (configAddress.ndlToken as any as ERC20Faucet).id
  ) as ERC20Faucet;
  console.log('ndlToken address:', instanceNDLTOKEN.address);

  // await (
  //   await instanceNDLTOKEN.approve(configAddress.factoryAddress.toString(), ethers.utils.parseEther('100000'))
  // ).wait();
  for (let index = 0; index < config.FAUCET_ADDRESSES.length; index++) {
    const faucet_addr = config.FAUCET_ADDRESSES[index];
    const [, _, user] = await ethers.getSigners();
    let balance = await ethers.provider.getBalance(faucet_addr);
    if (balance.toString() <= '1') {
      await user.sendTransaction({
        value: ethers.utils.parseEther('10'),
        to: faucet_addr,
      });
      console.log('fauct eth:', (await ethers.provider.getBalance(faucet_addr)).toString());
    }

    await instanceNDLTOKEN['faucet(address,uint256)'](faucet_addr, ethers.utils.parseEther('100000'));
    //await (await instanceNDLTOKEN.transfer(faucet_addr, ethers.utils.parseEther('100000'))).wait();
    console.log(
      instanceNDLTOKEN.address,
      faucet_addr,
      'NDL' + ' balance:',
      (await instanceNDLTOKEN.balanceOf(faucet_addr)).toString()
    );

    let faucet_num = ethers.utils.parseEther('100000000.1');
    if (configAddress.usdtToken != '') {
      let tmpToken = configAddress.usdtToken as any as ERC20Faucet;
      const USDTFactory = await ethers.getContractFactory('ERC20Faucet');
      let instanceUSDT = USDTFactory.connect(owner).attach(tmpToken.id) as ERC20Faucet;
      if ((await instanceUSDT.balanceOf(faucet_addr)) < faucet_num) {
        await (await instanceUSDT['faucet(address,uint256)'](faucet_addr, faucet_num)).wait();
        console.log(
          'faucet:',
          instanceUSDT.address,
          faucet_addr,
          (await instanceUSDT.symbol()) + ' balance:',
          (await instanceUSDT.balanceOf(faucet_addr)).toString()
        );
      } else {
        console.log(
          instanceUSDT.address,
          faucet_addr,
          (await instanceUSDT.symbol()) + ' balance:',
          (await instanceUSDT.balanceOf(faucet_addr)).toString()
        );
      }
    }
    for (let index = 0; index < configAddress.gameTokens.length; index++) {
      let p = new Promise((resolved, reject) => {});
      const element = configAddress.gameTokens[index] as any as ERC20Faucet;
      const ERC20Factory = await ethers.getContractFactory('ERC20Faucet');
      let instanceERC20 = ERC20Factory.connect(owner).attach(element.id) as ERC20Faucet;
      if ((await instanceERC20.symbol()) == 'BOST') {
        if ((await instanceERC20.balanceOf(faucet_addr)) < faucet_num) {
          await (
            await instanceERC20['faucet(address,uint256)'](faucet_addr, ethers.utils.parseEther('100000000.1'))
          ).wait();
          //await instanceERC20['faucet(address,uint256)'](owner.address,1e19);
          console.log(
            'faucet:',
            instanceERC20.address,
            faucet_addr,
            (await instanceERC20.symbol()) + ' balance:',
            (await instanceERC20.balanceOf(faucet_addr)).toString()
          );
        } else {
          console.log(
            instanceERC20.address,
            faucet_addr,
            (await instanceERC20.symbol()) + ' balance:',
            (await instanceERC20.balanceOf(faucet_addr)).toString()
          );
        }
      }
    }
  }
};

main();
