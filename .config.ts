import fetch, { Response } from 'node-fetch';
import { resolve } from 'path';
//import { ConfigAddress } from './generated/schema';
import { ConfigAddress } from './generated/schema';
import zlib from 'zlib';
import Stream, { PassThrough, pipeline as pump } from 'stream';

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_LOCALHOST = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_LOCALHOST = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"; //REPLACE_FLAG
export const VOTE_ADDRESS_LOCALHOST = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; //REPLACE_FLAG
export const STAKING_ADDRESS_LOCALHOST = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_LOCALHOST = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; //REPLACE_FLAG
export const LOCKING_ADDRESS_LOCALHOST = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; //REPLACE_FLAG
// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_HARDHAT = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_HARDHAT = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; //REPLACE_FLAG
export const VOTE_ADDRESS_HARDHAT = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; //REPLACE_FLAG
export const STAKING_ADDRESS_HARDHAT = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_HARDHAT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; //REPLACE_FLAG
export const LOCKING_ADDRESS_HARDHAT = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_DEVNET = "0x953166191665Cd5a8C1F6C8bD6b09a0a87907B58"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_DEVNET = "0x993630d22d60ef03b10DC0d82BEA5Aa71Eb66ea2"; //REPLACE_FLAG
export const VOTE_ADDRESS_DEVNET = "0xC3e87A25e4414cDE1D35B2FE9920E09a9f5f944D"; //REPLACE_FLAG
export const STAKING_ADDRESS_DEVNET = "0x30156AA84C298a77DA002A386b2Aa669307F6cCA"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_DEVNET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; //REPLACE_FLAG
export const LOCKING_ADDRESS_DEVNET = "0xDaB801A672a14916E4A22B859EfC3e8afb327514"; //REPLACE_FLAG

// ConfigAddree 地址
export const CONFIGADDRESS_ADDRESS_GANACHE = '0x983a25f9BE3227D6216B3573e789f32640F7F032'; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_GANACHE = '0xCe5F6B9e3f507aF6B19F4c993B6DbaC48531C524'; //REPLACE_FLAG
export const VOTE_ADDRESS_GANACHE = '0xCe5F6B9e3f507aF6B19F4c993B6DbaC48531C524'; //REPLACE_FLAG
export const STAKING_ADDRESS_GANACHE = '0xCe5F6B9e3f507aF6B19F4c993B6DbaC48531C524'; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_GANACHE = '0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D'; //REPLACE_FLAG
export const LOCKING_ADDRESS_GANACHE = "0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D";//REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSCTESTNET = "0x63bdb95cBC5061452ee33d4cC26AFE140A0c1EdF"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSCTESTNET = "0xf43DBa606858256ba6E6997313724e7eEaa40008"; //REPLACE_FLAG
export const VOTE_ADDRESS_BSCTESTNET = "0x60e85Fd317228620FD56088811EE3DD4176bDaC4"; //REPLACE_FLAG
export const STAKING_ADDRESS_BSCTESTNET = "0x4f2C0838C829f81400CFbc21fD208351E9aD23a0"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSCTESTNET = "0x66f040c34C9bA21560952303AfF336dA12096ad2"; //REPLACE_FLAG
export const LOCKING_ADDRESS_BSCTESTNET = "0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D";//REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_BSC = ''; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_BSC = ''; //REPLACE_FLAG
export const VOTE_ADDRESS_BSC = ''; //REPLACE_FLAG
export const STAKING_ADDRESS_BSC = ''; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_BSC = ''; //REPLACE_FLAG
export const LOCKING_ADDRESS_BSC = ''; //REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_RINKEBY = "0x0CE91cB68709b34fF21c21F248C544786E06a2E6"; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_RINKEBY = "0x451ee015f6Fd6F1D4d60e33CF9F9f7e8f4340D95"; //REPLACE_FLAG
export const VOTE_ADDRESS_RINKEBY = "0x38dCa1ae61546bCE7Eab0Da30f1334eAfdeF85dB"; //REPLACE_FLAG
export const STAKING_ADDRESS_RINKEBY = "0xbc719C504043607b9910a593aA708953adFa15f1"; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_RINKEBY = "0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D"; //REPLACE_FLAG
export const LOCKING_ADDRESS_RINKEBY = "0xf6c0570D6edDF4A73ef61d707a5caCD1e0be564D";//REPLACE_FLAG

export const CONFIGADDRESS_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const GAMEFACTORY_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const VOTE_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const STAKING_ADDRESS_MAINNET = ''; //REPLACE_FLAG
export const DEPLOY_ACCOUNT_MAINNET = ''; //REPLACE_FLAG
export const LOCKING_ADDRESS_MAINNET = "";//REPLACE_FLAG

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
  '0xA0966A68F5b69777F22776Eb31e5e5c363280ECf',
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
      break;
    case 'bsc':
      return TOKENS_BSC;
      break;
    case 'rinkeby':
      return TOKENS_RINKEBY;
      break;
    case 'mainnet':
      return TOKENS_MAINNET;
      break;
    case 'ganache':
      return TOKENS_GANACHE;
      break;
    case 'hardhat':
      return TOKENS_HARDHAT;
      break;
    case 'devnet':
      return TOKENS_DEVNET;
      break;
    case 'localhost':
      return TOKENS_LOCALHOST;
      break;
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
      break;
    case 'devnet':
      return CONFIGADDRESS_ADDRESS_DEVNET;
      break;
    case 'hardhat':
      return CONFIGADDRESS_ADDRESS_HARDHAT;
      break;
    case 'ganache':
      return CONFIGADDRESS_ADDRESS_GANACHE;
      break;
    case 'bsctestnet':
      return CONFIGADDRESS_ADDRESS_BSCTESTNET;
      break;
    case 'bsc':
      return CONFIGADDRESS_ADDRESS_BSC;
      break;
    case 'rinkeby':
      return CONFIGADDRESS_ADDRESS_RINKEBY;
      break;
    case 'mainnet':
      return CONFIGADDRESS_ADDRESS_MAINNET;
      break;
  }
  return null;
}
export function getVoteAddressByNetwork(name: string): string {
  switch (name) {
    case 'localhost':
      return VOTE_ADDRESS_LOCALHOST;
      break;
    case 'hardhat':
      return VOTE_ADDRESS_HARDHAT;
      break;
    case 'ganache':
      return VOTE_ADDRESS_GANACHE;
      break;
    case 'devnet':
      return VOTE_ADDRESS_DEVNET;
      break;
    case 'bsctestnet':
      return VOTE_ADDRESS_BSCTESTNET;
      break;
    case 'bsc':
      return VOTE_ADDRESS_BSC;
      break;
    case 'rinkeby':
      return VOTE_ADDRESS_RINKEBY;
      break;
    case 'mainnet':
      return VOTE_ADDRESS_MAINNET;
      break;
  }
  return VOTE_ADDRESS_BSCTESTNET;
}
export function getStakingAddressByNetwork(name: string): string {
  switch (name) {
    case 'localhost':
      return STAKING_ADDRESS_LOCALHOST;
      break;
    case 'hardhat':
      return STAKING_ADDRESS_HARDHAT;
      break;
    case 'ganache':
      return STAKING_ADDRESS_GANACHE;
      break;
    case 'devnet':
      return STAKING_ADDRESS_DEVNET;
      break;
    case 'bsctestnet':
      return STAKING_ADDRESS_BSCTESTNET;
      break;
    case 'bsc':
      return STAKING_ADDRESS_BSC;
      break;
    case 'rinkeby':
      return STAKING_ADDRESS_RINKEBY;
      break;
    case 'mainnet':
      return STAKING_ADDRESS_MAINNET;
      break;
  }
  return STAKING_ADDRESS_BSCTESTNET;
}
export function getLockingAddressByNetwork(name: string): string {
  switch (name) {
    case 'localhost':
      return LOCKING_ADDRESS_LOCALHOST;
      break;
    case 'hardhat':
      return LOCKING_ADDRESS_HARDHAT;
      break;
    case 'ganache':
      return LOCKING_ADDRESS_GANACHE;
      break;
    case 'devnet':
      return LOCKING_ADDRESS_DEVNET;
      break;
    case 'bsctestnet':
      return LOCKING_ADDRESS_BSCTESTNET;
      break;
    case 'bsc':
      return LOCKING_ADDRESS_BSC;
      break;
    case 'rinkeby':
      return LOCKING_ADDRESS_RINKEBY;
      break;
    case 'mainnet':
      return LOCKING_ADDRESS_MAINNET;
      break;
  }
  return STAKING_ADDRESS_BSCTESTNET;
}
export function getGameFactoryAddressByNetwork(name: string): string {
  switch (name) {
    case 'localhost':
      return GAMEFACTORY_ADDRESS_LOCALHOST;
      break;
    case 'hardhat':
      return GAMEFACTORY_ADDRESS_HARDHAT;
      break;
    case 'ganache':
      return GAMEFACTORY_ADDRESS_GANACHE;
      break;
    case 'devnet':
      return GAMEFACTORY_ADDRESS_DEVNET;
      break;
    case 'bsctestnet':
      return GAMEFACTORY_ADDRESS_BSCTESTNET;
      break;
    case 'bsc':
      return GAMEFACTORY_ADDRESS_BSC;
      break;
    case 'rinkeby':
      return GAMEFACTORY_ADDRESS_RINKEBY;
      break;
    case 'mainnet':
      return GAMEFACTORY_ADDRESS_MAINNET;
      break;
  }
  return GAMEFACTORY_ADDRESS_BSCTESTNET;
}

export function getIndexingNetWorkName(name: string): string {
  let ret = 'mainnet';
  switch (name) {
    case 'rinkeby':
      ret = 'rinkeby';
      break;
  }
  return ret;
}
export function getStartBlockNumber(name: string): number {
  //let blockNumber = await ethers.provider.getBlockNumber()
  switch (name) {
    case 'ganache':
      return 0;
      break;
    case 'devnet':
      return 0;
      break;
    case 'hardhat':
      return 0;
      break;
    case 'bsctestnet':
      return 8160000;
      break;
    case 'bsc':
      return 0;
      break;
    case 'rinkeby':
      return 8471670;
      break;
    case 'mainnet':
      return 0;
      break;
  }
  return 0;
}
//export function GetConfigAddressByGameFactoryAddress(name: string, addr: string): Promise<Response> {
export async function GetConfigAddressByGameFactoryAddress(
  name: string,
  addr: string,
  num: number = 10
): Promise<ConfigAddress | null> {
  let where = '';
  if (addr != '') {
    where = 'where:{id:\\"' + addr.toLowerCase() + '\\"},';
  }
  let url = 'http://10.0.0.89:8000/subgraphs/name/fatter-bo/noodleswap';
  switch (name) {
    case 'ganache':
      url = 'http://127.0.0.1:8000/subgraphs/name/fatter-bo/noodleswap';
      break;
    case 'hardhat':
      url = 'http://127.0.0.1:8000/subgraphs/name/fatter-bo/noodleswap';
      break;
    case 'localhost':
      url = 'http://127.0.0.1:8000/subgraphs/name/fatter-bo/noodleswap';
      break;
    case 'devnet':
      url = 'http://10.0.0.89:8000/subgraphs/name/fatter-bo/noodleswap';
      break;
    case 'bsctestnet':
      url = 'http://10.0.0.89:7000/subgraphs/name/fatter-bo/noodleswap';
      break;
    case 'bsc':
      break;
    case 'rinkeby':
      url = 'https://thegraph.com/explorer/subgraph/fatter-bo/noodlewap-rinkeby';
      break;
    case 'mainnet':
      break;
  }
  const options = {
    method: 'POST',
    mode: 'cors',
    headers: {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'content-type': 'application/json',
      'Accept-Encoding': 'gzip',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'sec-fetch-site': 'same-site',
    },
    compress: false,
    body:
      '{"query":"{configAddresses(' +
      where +
      'subgraphError:allow,orderBy:timestamp,orderDirection:desc,first:2){id  factoryAddress configAddress ndlToken{id} wethToken{id} usdtToken{id} networkName  blockUrl  gameTokens{    id    symbol  }}}","variables":null,"operationName":null}',
  };
  let response = await fetch(url, options).catch((err) => {
    console.log('xxxxxxx:', err);
  });
  if (response == null) {
    console.log('GetConfigAddressByGameFactoryAddress error:null');
    return null;
  }
  let isGzip: boolean = false;
  let rawdata;
  let encoding = response.headers.get('Content-Encoding');
  switch (encoding) {
    case 'gzip':
      let body = response.body as zlib.Gunzip;
      body.on('data', (data) => {
        rawdata = data;
        // console.log(data);
      });
      // await body.read();
      // console.log('xxxxxx:', body.read());
      // zlib.unzip(await response.buffer(), (err, data) => {
      //   console.log('wwwwwwwwww:', err, data.toString());
      // });
      // response.body.pipe(zlib.createGunzip());
      // console.log('wwwwwwwww:', await response.buffer());
      // console.log('wwwwwwwww:', await response.json());
      // zlib.gunzip(await response.arrayBuffer(), (err, data) => {
      //   console.log('wwwwwwwwww:', err, data);
      // });
      // zlib.gzip(await response.buffer(), (err, data) => {
      //   console.log('wwwwwwwwww:', err, data.toString());
      // });

      break;

    default:
      rawdata = response.body.read();
      break;
  }
  if (rawdata == null) {
    if (num >= 0) {
      console.log('GetConfigAddressByGameFactoryAddress rawdata:null', addr, num);
      await new Promise((resolve) => {
        setTimeout(() => {
          console.info('waiting GetConfigAddressByGameFactoryAddress');
          resolve(null);
        }, 3000);
      });
      return GetConfigAddressByGameFactoryAddress(name, addr, --num);
    } else {
      return null;
    }
  }
  let data = JSON.parse(rawdata.toString()).data;
  if (!data) {
    return null;
  }
  if (data.configAddresses) {
    if (num >= 0) {
      if (data.configAddresses.length == 0) {
        console.log('GetConfigAddressByGameFactoryAddress rrodata.configAddressesr:0', addr, num);
        await new Promise((resolve) => {
          setTimeout(() => {
            console.info('waiting GetConfigAddressByGameFactoryAddress');
            resolve(null);
          }, 2000);
        });
        return GetConfigAddressByGameFactoryAddress(name, addr, --num);
      }
      return data.configAddresses[0] as ConfigAddress;
    } else {
      return null;
    }
  }
  return null;
}

export function getRpcUrlByNetwork(name: string): string {
  let ret = 'https://data-seed-prebsc-1-s1.binance.org:8545';
  switch (name) {
    case 'bsctestnet':
      ret = 'https://data-seed-prebsc-2-s3.binance.org:8545';
      break;
    case 'bsc':
      ret = 'https://bscscan.com/';
      break;
    case 'rinkeby':
      ret = 'https://rinkeby.infura.io/v3/';
      break;
    case 'mainnet':
      ret = 'https://mainnet.infura.io/v3/';
      break;
  }
  return ret;
}

export function getBlockUrlByNetwork(name: string): string {
  let ret = 'https://testnet.bscscan.com/';
  switch (name) {
    case 'bsctestnet':
      ret = 'https://testnet.bscscan.com/';
      break;
    case 'bsc':
      ret = 'https://dataseed1.binance.org/';
      break;
    case 'rinkeby':
      ret = 'https://rinkeby.etherscan.io/';
      break;
    case 'mainnet':
      ret = 'https://etherscan.io/';
      break;
  }
  return ret;
}
// type NetWorkInfo = {
// symbol:string
// blockUrl:string
// }
// export function getNetWorkInfoByNetworkName(name: string): { blockUrl:string } {
//   let ret = 'https://testnet.bscscan.com/';
//   switch (name) {
//     case 'bsctestnet':
//       ret = 'https://testnet.bscscan.com/';
//       break;
//     case 'bsc':
//       ret = 'https://dataseed1.binance.org/';
//       break;
//     case 'rinkeby':
//       ret = 'https://rinkeby.etherscan.io/';
//       break;
//     case 'mainnet':
//       ret = 'https://etherscan.io/';
//       break;
//   }
//   return ret;
// }
