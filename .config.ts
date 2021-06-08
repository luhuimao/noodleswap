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
export const CONFIGADDRESS_ADDRESS_DEVNET = "0x4C6Acde895704581F1742AC8A78485797663A34e"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_DEVNET = "0xbc9f0AE44448EAed971694c51e111A42Ed4CB69d"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_DEVNET = "0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D"; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_GANACHE = '0x0895211038947699A86aCf643708F0aDE55352f9'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_GANACHE = '0xB3C438FCAf29bD07E7f99e4F9E6761252DaD9820'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_GANACHE = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSCTESTNET = '0x5Dd24EB6f115f58d26aF14Bd088aD6Bf2a1292E0'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSCTESTNET = '0xd257766F6Ba54B6904009109a681487b31dEc51a'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSCTESTNET = '0x66f040c34C9bA21560952303AfF336dA12096ad2'; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSC = ''; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSC = ''; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSC = ''; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_RINKEBY = '0xD1E1E4EbCBeB57e015A8212aB7Cc779f3095Dd8C'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_RINKEBY = '0xb83D957D5Acd4FE45CBe6f1605C1d7E6b3aB9946'; //REPLACE_FLAG
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
    where = 'where:{id:\\"' + addr.toLowerCase() + '\\"},';
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
  }).catch(() => {
    return null;
  });
  if (response == null) {
    return null;
  }
  let data = JSON.parse(response.body.read().toString()).data;
  return data.configAddresses ? (data.configAddresses[0] as ConfigAddress) : null;
}
