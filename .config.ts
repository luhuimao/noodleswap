import fetch, { Response } from 'node-fetch';
import { resolve } from 'path';
//import { ConfigAddress } from './generated/schema';
import { ConfigAddress } from './generated/schema';

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_LOCALHOST = '0xc161F6fd99Cd7b8c19585121C1b0B0F575962897'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_LOCALHOST = '0xbc9f0AE44448EAed971694c51e111A42Ed4CB69d'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_LOCALHOST = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_HARDHAT = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_HARDHAT = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_HARDHAT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_DEVNET = '0x1813e4E8CEc28488615bde67eEf95C86b782D6C8'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_DEVNET = '0xE22D32f2a149487C61f35297646deeB85d1ba395'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_DEVNET = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_GANACHE = '0x983a25f9BE3227D6216B3573e789f32640F7F032'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_GANACHE = '0xCe5F6B9e3f507aF6B19F4c993B6DbaC48531C524'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_GANACHE = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSCTESTNET = '0x16F19c1f4033F3979C60aC8B9363f206ae70d0E0'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSCTESTNET = '0xd257766F6Ba54B6904009109a681487b31dEc51a'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSCTESTNET = '0x66f040c34C9bA21560952303AfF336dA12096ad2'; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSC = ''; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSC = ''; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSC = ''; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_RINKEBY = '0x3824c69ea91E51167386AEFC0315Cb104447Eb06'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_RINKEBY = '0x37D2cF9466Db988cca9DC0f15CeEeEc116EE5Fa0'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_RINKEBY = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_MAINNET = ''; //REPLACE_FLAG

export const TOKENS_BSC_TESTNET = [
  { symbol: 'tUSDC', address: '0x0b2af20b7ef759b1540a8844740bfe7ef4e5d1de' },
  { symbol: 'BUSD', address: '0x0b2af20b7ef759b1540a8844740bfe7ef4e5d1de' },
  { symbol: 'WBNB', address: '0xae13d989dac2f0debff460ac112a837c89baa7cd' },
];

export const TOKENS_BSC = [
  { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
  { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095' },
  { symbol: 'Cake', address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' },
];

export const TOKENS_RINKEBY = [];

export const TOKENS_MAINNET = [];
export const TOKENS_GANACHE = [];
export const TOKENS_HARDHAT = [];
export const TOKENS_DEVNET = [];
export const TOKENS_LOCALHOST = [];

export const FAUCET_ADDRESSES = [
  '0x176791d147bEf3f62Dadde535604f339a1758E44', //来福
  '0x22F6Be7444e42f43F5d93CC729545af974A2CD62', //pg
  '0xf1b5311FC420643f15F7983f204763516c43B514', //pgg
];

export const TOKENS = {
  bsctestnet: TOKENS_BSC_TESTNET,
  bsc: TOKENS_BSC,
  rinkeby: TOKENS_RINKEBY,
  mainnet: TOKENS_MAINNET,
  ganache: TOKENS_GANACHE,
  hardhat: TOKENS_HARDHAT,
  devnet: TOKENS_DEVNET,
  localhost: TOKENS_LOCALHOST,
};
export function getTokensByNetwork(name: string): Array<{ symbol: string; address: string }> | null {
  switch (name) {
    case 'bsctestnet':
      return TOKENS_BSC_TESTNET;
    case 'bsc':
      return TOKENS_BSC;
    case 'rinkeby':
      return TOKENS_RINKEBY;
    case 'mainnet':
      return TOKENS_MAINNET;
    case 'ganache':
      return TOKENS_GANACHE;
    case 'hardhat':
      return TOKENS_HARDHAT;
    case 'devnet':
      return TOKENS_DEVNET;
    case 'localhost':
      return TOKENS_LOCALHOST;
  }
  return null;
}

export function getTokenAddrBySymbol(tokens: Array<{ symbol: string; address: string }>, symbol: string): string {
  for (let index = 0; index < tokens.length; index++) {
    const element = tokens[index];
    if (element.symbol == symbol) {
      return element.address;
    }
  }
  return '';
}

export function getConfigAddressByNetwork(name: string): string | null {
  switch (name) {
    case 'localhost':
      return CONFIGADDRESS_ADDRESS_LOCALHOST;
    case 'devnet':
      return CONFIGADDRESS_ADDRESS_DEVNET;
    case 'hardhat':
      return CONFIGADDRESS_ADDRESS_HARDHAT;
    case 'ganache':
      return CONFIGADDRESS_ADDRESS_GANACHE;
    case 'bsctestnet':
      return CONFIGADDRESS_ADDRESS_BSCTESTNET;
    case 'bsc':
      return CONFIGADDRESS_ADDRESS_BSC;
    case 'rinkeby':
      return CONFIGADDRESS_ADDRESS_RINKEBY;
    case 'mainnet':
      return CONFIGADDRESS_ADDRESS_MAINNET;
  }
  return null;
}
export function getGameFactoryAddressByNetwork(name: string): string {
  switch (name) {
    case 'localhost':
      return GAMEFACTORY_ADDRESS_LOCALHOST;
    case 'hardhat':
      return GAMEFACTORY_ADDRESS_HARDHAT;
    case 'ganache':
      return GAMEFACTORY_ADDRESS_GANACHE;
    case 'devnet':
      return GAMEFACTORY_ADDRESS_DEVNET;
    case 'bsctestnet':
      return GAMEFACTORY_ADDRESS_BSCTESTNET;
    case 'bsc':
      return GAMEFACTORY_ADDRESS_BSC;
    case 'rinkeby':
      return GAMEFACTORY_ADDRESS_RINKEBY;
    case 'mainnet':
      return GAMEFACTORY_ADDRESS_MAINNET;
  }
  return GAMEFACTORY_ADDRESS_BSCTESTNET;
}
export function getStartBlockNumber(name: string): number {
  //let blockNumber = await ethers.provider.getBlockNumber()
  switch (name) {
    case 'ganache':
      return 0;
    case 'devnet':
      return 0;
    case 'hardhat':
      return 0;
    case 'bsctestnet':
      return 8160000;
    case 'bsc':
      return 0;
    case 'rinkeby':
      return 8471670;
    case 'mainnet':
      return 0;
  }
  return 0;
}
//export function GetConfigAddressByGameFactoryAddress(name: string, addr: string): Promise<Response> {
export async function GetConfigAddressByGameFactoryAddress(name: string, addr: string): Promise<ConfigAddress | null> {
  let where = '';
  if (addr != '') {
    //where = 'where:{id:\\"' + addr.toLowerCase() + '\\"},';
  }
  let url = 'http://10.0.0.18:7000/subgraphs/name/fatter-bo/noodleswap';
  switch (name) {
    case 'ganache':
      url = 'http://127.0.0.1:8000/subgraphs/name/fatter-bo/noodleswap';
    case 'hardhat':
      url = 'http://127.0.0.1:8000/subgraphs/name/fatter-bo/noodleswap';
    case 'devnet':
    case 'bsctestnet':
    case 'bsc':
    case 'rinkeby':
      url = 'https://thegraph.com/explorer/subgraph/fatter-bo/noodlewap-rinkeby';
    case 'mainnet':
  }
  let response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'content-type': 'application/json',
    },
    body:
      '{"query":"{configAddresses(' +
      where +
      'subgraphError:allow,orderBy:timestamp,orderDirection:desc,first:2){id  factoryAddress ndlToken{id} wethToken{id} usdtToken{id} networkName  blockUrl  gameTokens{    id    symbol  }}}","variables":null,"operationName":null}',
    method: 'POST',
    //}).then(response => {
    //    return JSON.parse(response.body.read().toString());
  }).catch((error) => {
    console.log('GetConfigAddressByGameFactoryAddress error:', error);
    return null;
  });
  if (response == null) {
    console.log('GetConfigAddressByGameFactoryAddress error:null');
    return null;
  }
  let rawdata = response.body.read();
  if (rawdata == null) {
    console.log('GetConfigAddressByGameFactoryAddress error:null');
    await new Promise((resolve) => {
      setTimeout(() => {
        console.info('waiting GetConfigAddressByGameFactoryAddress');
        resolve(null);
      }, 3000);
    });
    return GetConfigAddressByGameFactoryAddress(name, addr);
  }
  let data = JSON.parse(rawdata.toString()).data;
  if (data.configAddresses) {
    if (data.configAddresses.length == 0) {
      console.log('GetConfigAddressByGameFactoryAddress error:null');
      await new Promise((resolve) => {
        setTimeout(() => {
          console.info('waiting GetConfigAddressByGameFactoryAddress');
          resolve(null);
        }, 2000);
      });
      return GetConfigAddressByGameFactoryAddress(name, addr);
    }
    return data.configAddresses[0] as ConfigAddress;
  }
  return null;
}

export function getRpcUrlByNetwork(name: string): string {
  let ret = 'https://data-seed-prebsc-1-s1.binance.org:8545';
  switch (name) {
    case 'bsctestnet':
      ret = 'https://data-seed-prebsc-2-s3.binance.org:8545';
    case 'bsc':
      ret = 'https://bscscan.com/';
    case 'rinkeby':
      ret = 'https://rinkeby.infura.io/v3/';
    case 'mainnet':
      ret = 'https://mainnet.infura.io/v3/';
  }
  return ret;
}

export function getBlockUrlByNetwork(name: string): string {
  let ret = 'https://testnet.bscscan.com/';
  switch (name) {
    case 'bsctestnet':
      ret = 'https://testnet.bscscan.com/';
    case 'bsc':
      ret = 'https://dataseed1.binance.org/';
    case 'rinkeby':
      ret = 'https://rinkeby.etherscan.io/';
    case 'mainnet':
      ret = 'https://etherscan.io/';
  }
  return ret;
}
