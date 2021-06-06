import { UpsertConfig, UpsertGameToken } from '../generated/ConfigAddress/ConfigAddress';
import { _GameCreated } from '../generated/GameFactory/GameFactory';
import * as GamePairEvent from '../generated/templates/Game/Game';
import { ERC20Token, ConfigAddress, GameInfo, BetInfo, Game } from '../generated/schema';
import { ERC20 } from '../generated/ConfigAddress/ERC20';
import * as boutils from './boutils';
import { BigInt, ethereum, Bytes, log } from '@graphprotocol/graph-ts';

export function handleUpsertConfig(event: UpsertConfig): void {
  let id = event.params.factoryAddress.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:handleUpsertConfig:' + id, []);
  let ndlToken = ERC20Token.load(event.params.ndlToken.toHexString());
  if (ndlToken == null) {
    ndlToken = new ERC20Token(event.params.ndlToken.toHexString());
    ndlToken.name = event.params.networkName + ' GST';
    ndlToken.symbol = 'GST';
    ndlToken.decimals = BigInt.fromI32(18);
    ndlToken.save();
  }
  let wethToken = ERC20Token.load(event.params.wethToken.toHexString());
  if (wethToken == null) {
    wethToken = new ERC20Token(event.params.wethToken.toHexString());
    wethToken.name = event.params.networkName + ' WETH';
    wethToken.symbol = 'WETH';
    wethToken.decimals = BigInt.fromI32(18);
    wethToken.save();
  }
  let usdtToken = ERC20Token.load(event.params.usdtToken.toHexString());
  if (usdtToken == null) {
    usdtToken = new ERC20Token(event.params.usdtToken.toHexString());
    usdtToken.name = event.params.networkName + ' USDT';
    usdtToken.symbol = 'USDT';
    usdtToken.decimals = BigInt.fromI32(18);
    usdtToken.save();
  }
  let config = ConfigAddress.load(id);
  if (config == null) {
    config = new ConfigAddress(id);
    config.gameTokens = [];
  }
  config.factoryAddress = event.params.factoryAddress;
  config.ndlToken = ndlToken.id;
  config.wethToken = wethToken.id;
  config.usdtToken = usdtToken.id;
  config.networkName = event.params.networkName;
  config.rpcUrl = event.params.rpcUrl;
  config.blockUrl = event.params.blockUrl;
  config.chainId = event.params.chainId;
  config.timestamp = event.block.timestamp;
  config.save();
}
export function handleUpsertGameToken(event: UpsertGameToken): void {
  let id = event.params.factoryAddress.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:handleUpsertGameToken:', []);
  var config = ConfigAddress.load(id);
  if (config == null) {
    log.info('please UpsertConfig first: {}', [id]);
    return;
  }
  let tokenId = event.params.tokenAddress.toHexString();
  let tokenName = boutils.getTokenSymbol(event.params.tokenAddress);
  var index = -2; // -1竟然不行,对ts还不熟悉。。。
  let gameTokens = config.gameTokens; //这里必须先复制,否则就存不进去,太奇怪了
  for (let i = 0; i < gameTokens.length; i++) {
    let token = ERC20Token.load(gameTokens[i]);
    // 这里需要检查是否已经无效
    if (token != null && token.symbol == event.params.tokenSymbol.toString()) {
      index = i;
      break;
    }
  }
  if (index != -2) {
    config.gameTokens.slice(index, 1);
  }
  let token = ERC20Token.load(event.params.tokenSymbol);
  if (token == null) {
    token = new ERC20Token(event.params.tokenAddress.toHex());
    //TODO 这里需要去合约里取token信息
    token.name = config.networkName + ' ' + event.params.tokenSymbol.toString();
    token.symbol = tokenName; //event.params.tokenSymbol.toString();
    token.decimals = boutils.getTokenDecimals(event.params.tokenAddress);
    token.save();
  }
  let tokens = config.gameTokens;
  let len = tokens.length;
  tokens.push(tokenId);
  tokens.sort();
  len = tokens.length;
  //config.unset("gameTokens");
  config.gameTokens = tokens;
  config.save();
  // */
}

export function handleEventCreateGame(event: _GameCreated): void {
  // event: _GameCreated(indexed address,indexed address,string,string[],uint256[],string,uint256)
  let gameStr = event.params._gameName;
  //let id = event.params.token.toHex() + "-" + gameStr[0];
  let id = event.params._game.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:handleEventCreateGame:0:{}', [id]);
  var game = Game.load(id);
  if (game != null) {
    log.info('GameInfo oready exist: {}', [id]);
    return;
  }
  log.info('xxxxxxxxxxxxxxxxxx:handleEventCreateGame:1:{}', [id]);
  game = new Game(id);
  game.title = event.params._gameName;
  game.locked = BigInt.fromI32(0);
  game.save();
  log.info('xxxxxxxxxxxxxxxxxx:handleEventCreateGame:2:{}', [id]);
  let gameInfo = new GameInfo(id);
  gameInfo._gameName = event.params._gameName;
  gameInfo._owner = event.params._owner;
  gameInfo._token = event.params._token.toHex();
  gameInfo._game = game.id;
  gameInfo._resultSource = event.params._resultSource;
  let optionName = event.params._optionName;
  gameInfo._optionName = optionName;
  let optionNum = event.params._optionNum;
  gameInfo._optionNum = optionNum;
  gameInfo._endSec = event.params._endTime;
  gameInfo.timestamp = event.block.timestamp;
  gameInfo.save();
}
// export function handleEventBetForToken(event: EventBetForToken): void {
//   let id = event.params.pair.toHex() + '-' + event.params.sender.toHex() + '-' + event.block.timestamp.toString();
//   log.info('xxxxxxxxxxxxxxxxxx:handleEventCreateGame:{}', [id]);
//   var bet = BetInfo.load(id);
//   if (bet != null) {
//     log.error('BetInfo oready exist: {}', [id]);
//     return;
//   }

//   bet = new BetInfo(id);
//   bet.sender = event.params.sender;
//   bet.token = event.params.token;

//   bet.gameInfo = event.params.pair.toHex();
//   bet.amount = event.params.amount;
//   bet.deadline = event.params.deadline;
//   bet.side = event.params.side;
//   bet.save();
// }
export function handleTransfer(event: GamePairEvent.Approval): void {
  // let pair = GamePair.load(event.address.toHex());
  // if (pair == null) {
  //   log.error('handleTransfer GamePair not find: {}', [event.address.toHex()]);
  //   return;
  // }
  // let pairContract = GamePairEvent.GamePair.bind(event.address);
  // pair.title = pairContract.title();
  // pair.save();
}
export function handleApproval(event: GamePairEvent.Approval): void {
  // let pair = GamePair.load(event.address.toHex());
  // if (pair == null) {
  //   log.error('handleTransfer GamePair not find: {}', [event.address.toHex()]);
  //   return;
  // }
  // let pairContract = GamePairEvent.GamePair.bind(event.address);
  // pair.title = pairContract.title();
  // pair.save();
}
export function handleBlock(block: ethereum.Block): void {
  let id = block.hash.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:wwwwwwwww:' + id, []);
  //let entity = new Block(id)
  //entity.save()
}
