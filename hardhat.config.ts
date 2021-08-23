import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-typechain';
import { task } from 'hardhat/config';

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.info('account:', account.address);
  }
});

export default {
  default: 'hardhat',
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1ffffffff,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      allowUnlimitedContractSize: true,
      gas: "auto",
    },
    ganache: {
      url: 'http://127.0.0.1:7545',
      allowUnlimitedContractSize: true,
    },
    bsctestnet: {
      //url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      //url: "https://data-seed-prebsc-2-s1.binance.org:8545",
      url: 'https://data-seed-prebsc-2-s3.binance.org:8545',
      gasPrice: 20000000000,
      allowUnlimitedContractSize: true,
    },
    bsc: {
      url: 'https://dataseed1.binance.org/',
      gasPrice: 20000000000,
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/3ba2cd9897d34c71ba203bd51488caa1',
      //accounts: [privateKey1, privateKey2, ...]
    },
    mainnet: {
      url: 'https://eth-mainnet.alchemyapi.io/v2/123abc123abc123abc123abc123abcde',
      //accounts: [privateKey1, privateKey2, ...]
    },
    devnet: { url: 'http://10.0.0.89:8545' },
  },
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './build/cache',
    artifacts: './build/artifacts',
  },
  gasReporter: {
    currency: 'USD',
    enabled: true,
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: '<api-key>',
  },
};
