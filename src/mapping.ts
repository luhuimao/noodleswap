import { UpsertConfig, UpsertGameToken } from '../generated/ConfigAddress/ConfigAddress';
import { _GameCreated } from '../generated/GameFactory/GameFactory';
import * as GameEvent from '../generated/templates/Game/Game';
import * as VoteEvent from '../generated/VoteInfo/Vote';
import { Game as GameTemplate } from '../generated/templates';
import { Game as GameContract } from '../generated/GameFactory/Game';
// import { VoteInfo as VoteTemplate } from '../generated/templates';
import {
  ERC20Token,
  ConfigAddress,
  VoteUserInfo,
  VoteInfo,
  NFTInfo,
  GameInfo,
  OptionInfo,
  GameUserInfo,
  BetInfo,
  Game,
} from '../generated/schema';
import { ERC20 } from '../generated/ConfigAddress/ERC20';
import * as boutils from './boutils';
import { Address, BigInt, ethereum, Bytes, log } from '@graphprotocol/graph-ts';

export function handleUpsertConfig(event: UpsertConfig): void {
  let id = event.params.factoryAddress.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:handleUpsertConfig:' + id, []);
  let ndlToken = ERC20Token.load(event.params.ndlToken.toHexString());
  if (ndlToken == null) {
    ndlToken = new ERC20Token(event.params.ndlToken.toHexString());
    ndlToken.name = event.params.networkName + ' NDL';
    ndlToken.symbol = 'NDL';
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
  config.configAddress = event.params.configAddress;
  config.ndlToken = ndlToken.id;
  config.wethToken = wethToken.id;
  config.usdtToken = usdtToken.id;
  config.networkName = event.params.networkName;
  config.rpcUrl = event.params.rpcUrl;
  config.blockUrl = event.params.blockUrl;
  config.chainId = event.params.chainId;
  config.voteAddress = event.params.voteAddress;
  config.timestamp = event.block.timestamp;
  config.save();
}
export function handleUpsertGameToken(event: UpsertGameToken): void {
  let id = event.params.factoryAddress.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:handleUpsertGameToken:0:', []);
  var config = ConfigAddress.load(id);
  if (config == null) {
    log.info('please UpsertConfig first: {}', [id]);
    return;
  }
  let tokenId = event.params.tokenAddress.toHexString();
  let tokenName = boutils.fetchTokenSymbol(event.params.tokenAddress);
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
  let token = ERC20Token.load(event.params.tokenAddress.toHex());
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
    log.info('GameInfo already exist: {}', [id]);
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
  gameInfo._shortGameName = event.params._shortGameName;
  gameInfo._owner = event.params._owner;
  gameInfo._token = event.params._token.toHex();
  gameInfo._game = game.id;
  gameInfo._resultSource = event.params._resultSource;
  updateGameInfos(gameInfo as GameInfo);
  let optionNum = event.params._optionNum;
  gameInfo._optionNum = optionNum;
  // let ret = instanceGame.try_options();
  // if (!ret.reverted) {
  // }
  let optionName = event.params._optionName;
  gameInfo._optionName = optionName;
  gameInfo._endSec = event.params._endTime;
  gameInfo.timestamp = event.block.timestamp;
  gameInfo.save();
  GameTemplate.create(event.params._game);
}
function updateGameInfos(gameInfo: GameInfo): void {
  let instanceGame = GameContract.bind(Address.fromString(gameInfo.id));
  let try_len = instanceGame.try_getOptionsLength();
  let tmp: string[] = [];
  for (let index = 0; index < try_len.value.toI32(); index++) {
    let element = instanceGame.try_options(BigInt.fromI32(index));
    if (!element.reverted) {
      let oid = gameInfo.id + '-' + index.toString();
      var optionInfo = OptionInfo.load(oid);
      if (!optionInfo) {
        optionInfo = new OptionInfo(oid);
      }
      optionInfo.game = gameInfo.id;
      optionInfo.marketNumber = element.value.value0;
      optionInfo.placeNumber = element.value.value1;
      optionInfo.frozenNumber = element.value.value2;
      // let v = element.value as any as OptionInfo;
      // optionInfo.marketNumber = v.marketNumber;
      // optionInfo.placeNumber = v.placeNumber;
      // optionInfo.frozenNumber = v.frozenNumber;
      optionInfo.save();
      // tmp.push(oid);
    } else {
      break;
    }
  }
  // gameInfo._optionInfos = tmp;
}
export function handleTransfer(event: GameEvent.Approval): void {
  // let pair = GamePair.load(event.address.toHex());
  // if (pair == null) {
  //   log.error('handleTransfer GamePair not find: {}', [event.address.toHex()]);
  //   return;
  // }
  // let pairContract = GameEvent.GamePair.bind(event.address);
  // pair.title = pairContract.title();
  // pair.save();
}
export function handleApproval(event: GameEvent.Approval): void {
  // let pair = GamePair.load(event.address.toHex());
  // if (pair == null) {
  //   log.error('handleTransfer GamePair not find: {}', [event.address.toHex()]);
  //   return;
  // }
  // let pairContract = GameEvent.GamePair.bind(event.address);
  // pair.title = pairContract.title();
  // pair.save();
}
export function handPlaceGame(event: GameEvent._placeGame): void {
  let id =
    event.params.game.toHex() +
    '-' +
    event.params.sender.toHex() +
    '-' +
    event.block.timestamp.toString() +
    '-1' +
    '-0';
  log.info('xxxxxxxxxxxxxxxxxx:handPlaceGame:{}', [id]);
  var bet = BetInfo.load(id);
  if (bet != null) {
    log.error('BetInfo already exist: {}', [id]);
    return;
  }
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('BetInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  // let tokenId = event.params.token.toHexString();
  // let token = ERC20Token.load(tokenId);
  // if (token == null) {
  //   let tokenName = boutils.fetchTokenSymbol(event.params.token);
  //   if (tokenName == '') {
  //     log.error('token not found : {}', [event.params.token.toHex()]);
  //     return;
  //   }
  //   token = new ERC20Token(tokenId);
  //   //TODO 这里需要去合约里取token信息
  //   token.name = 'Tmp ' + tokenName;
  //   token.symbol = tokenName; //event.params.tokenSymbol.toString();
  //   token.decimals = boutils.getTokenDecimals(event.params.token);
  //   token.save();
  // }

  bet = new BetInfo(id);
  bet.sender = event.params.sender;
  //bet.token = event.params.token.toString();
  bet.token = gameInfo._token;

  bet.game = gameInfo.id;
  let optionNum = event.params.optionNum;
  bet.optionNum = optionNum;
  let options = event.params.options;
  bet.options = options;
  let tokenIds = event.params.tokenIds;
  bet.tokenIds = tokenIds;
  bet.timestamp = event.block.timestamp;
  // let gameOptionNum = gameInfo._optionNum;
  // for (let index = 0; index < options.length; index++) {
  //   let element = options[index];
  //   // log.info('xxxxxxxxxxxxxxxxxx:optionNum:{},{}', [String(gameOptionNum.length), element.toString())]);
  //   gameOptionNum[element] += optionNum[index];
  // }
  // gameInfo._optionNum = gameOptionNum;
  let instanceGame = GameContract.bind(event.params.game);
  let ret = instanceGame.try_getOptions();
  if (!ret.reverted) {
    gameInfo._optionNum = ret.value;
  }
  updateGameInfos(gameInfo as GameInfo);
  for (let index = 0; index < tokenIds.length; index++) {
    let element = tokenIds[index];
    let nftInfo = new NFTInfo(element.toHex() + '-' + gameInfo.id);
    nftInfo.tokenId = element;
    nftInfo.owner = event.params.sender;
    nftInfo.game = gameInfo.id;
    nftInfo.save();
  }
  // VoteUserInfo,
  // VoteInfo,
  bet.save();
  gameInfo.save();
}
export function handAddLiquidity(event: GameEvent._addLiquidity): void {
  log.info('xxxxxxxxxxxxxxxxxx:handAddLiquidity:', []);
  // event _addLiquidity(
  //     address indexed game,
  //     address indexed token,
  //     address indexed sender,
  //     uint256 amount,
  //     uint256 liquidity,
  //     uint256[] tokenIds
  // );
  //
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('BetInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  // let tokenId = event.params.token.toHexString();
  // let token = ERC20Token.load(tokenId);
  // if (token == null) {
  //   let tokenName = boutils.fetchTokenSymbol(event.params.token);
  //   if (tokenName == '') {
  //     log.error('token not found : {}', [event.params.token.toHex()]);
  //     return;
  //   }
  //   token = new ERC20Token(tokenId);
  //   //TODO 这里需要去合约里取token信息
  //   token.name = 'Tmp ' + tokenName;
  //   token.symbol = tokenName; //event.params.tokenSymbol.toString();
  //   token.decimals = boutils.getTokenDecimals(event.params.token);
  //   token.save();
  // }
  let tokenIds = event.params.tokenIds;
  for (let index = 0; index < tokenIds.length; index++) {
    let element = tokenIds[index];
    let nftInfo = new NFTInfo(element.toHex() + '-' + gameInfo.id);
    nftInfo.tokenId = element;
    nftInfo.owner = event.params.sender;
    nftInfo.game = gameInfo.id;
    nftInfo.save();
  }

  let instanceGame = GameContract.bind(event.params.game);
  let ret = instanceGame.try_getOptions();
  if (!ret.reverted) {
    gameInfo._optionNum = ret.value;
  }
  updateGameInfos(gameInfo as GameInfo);
  gameInfo.save();

  // let tmp: i32[] = [];
  for (let index = 0; index < tokenIds.length; index++) {
    let element = tokenIds[index];
    let id =
      event.params.game.toHex() +
      '-' +
      event.params.sender.toHex() +
      '-' +
      event.block.timestamp.toString() +
      '-2' +
      '-' +
      index.toString();
    let bet = new BetInfo(id);
    bet.sender = event.params.sender;
    bet.token = gameInfo._token;
    bet.game = gameInfo.id;
    // let tmp: i32[];
    // tmp = [];
    // tmp.push(instanceGame.playInfoMap(element).value0);
    // bet.options = tmp;
    bet.options = [instanceGame.playInfoMap(element).value0];
    // let tmp1: BigInt[];
    // tmp1 = [];
    // tmp1.push(instanceGame.playInfoMap(element).value1);
    // bet.optionNum = tmp1;
    bet.optionNum = [instanceGame.playInfoMap(element).value1];
    bet.tokenIds = tokenIds;
    bet.timestamp = event.block.timestamp;
    bet.save();
  }
}
export function handRemoveLiquidity(event: GameEvent._removeLiquidity): void {
  log.info('xxxxxxxxxxxxxxxxxx:handRemoveLiquidity:', []);
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('BetInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  let tokenIds = event.params.tokenIds;
  for (let index = 0; index < tokenIds.length; index++) {
    let element = tokenIds[index];
    let nftInfo = new NFTInfo(element.toHex() + '-' + gameInfo.id);
    nftInfo.tokenId = element;
    nftInfo.owner = event.params.sender;
    nftInfo.game = gameInfo.id;
    nftInfo.save();
  }
  let instanceGame = GameContract.bind(event.params.game);
  let ret = instanceGame.try_getOptions();
  if (!ret.reverted) {
    gameInfo._optionNum = ret.value;
  }
  updateGameInfos(gameInfo as GameInfo);
  gameInfo.save();

  for (let index = 0; index < tokenIds.length; index++) {
    let element = tokenIds[index];
    let id =
      event.params.game.toHex() +
      '-' +
      event.params.sender.toHex() +
      '-' +
      event.block.timestamp.toString() +
      '-3' +
      '-' +
      index.toString();
    let bet = new BetInfo(id);
    bet.sender = event.params.sender;
    bet.token = gameInfo._token;
    bet.game = gameInfo.id;
    // let tmp: i32[];
    // tmp = [];
    // tmp.push(instanceGame.playInfoMap(element).value0);
    // bet.options = tmp;
    bet.options = [instanceGame.playInfoMap(element).value0];
    // let tmp1: BigInt[];
    // tmp1 = [];
    // tmp1.push(instanceGame.playInfoMap(element).value1);
    // bet.optionNum = tmp1;
    bet.optionNum = [instanceGame.playInfoMap(element).value1];
    bet.tokenIds = tokenIds;
    bet.timestamp = event.block.timestamp;
    bet.save();
  }
}
export function handStakeGame(event: GameEvent._stakeGame): void {
  log.info('xxxxxxxxxxxxxxxxxx:handStakeGame:', []);
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('BetInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  gameInfo._openAddress = event.params.sender;
  gameInfo.save();
}
export function handChallengeGame(event: GameEvent._challengeGame): void {
  log.info('xxxxxxxxxxxxxxxxxx:handChallengeGame:', []);
  var voteInfo = VoteInfo.load(event.params.game.toHex());
  if (voteInfo != null) {
    log.error('VoteInfo game already exists: {}', [event.params.game.toHex()]);
    return;
  }
  voteInfo = new VoteInfo(event.params.game.toHex());
  voteInfo.game = event.params.game.toHex();
  voteInfo.vote = event.params.vote;
  voteInfo.owner = event.params.sender;
  voteInfo.winOption = event.params.originOption;
  voteInfo.option = event.params.challengeOption;
  voteInfo.agreeNum = 0;
  voteInfo.disAgreeNum = 0;
  voteInfo.timestamp = event.block.timestamp;
  voteInfo.save();
  //VoteTemplate.create(event.params.vote);
}
export function handOpenGame(event: GameEvent._openGame): void {
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('BetInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  gameInfo._winOption = event.params.option;
  gameInfo.save();
  log.info('xxxxxxxxxxxxxxxxxx:handOpenGame:', []);
}
export function handleBlock(block: ethereum.Block): void {
  let id = block.hash.toHex();
  log.info('xxxxxxxxxxxxxxxxxx:wwwwwwwww:' + id, []);
  //let entity = new Block(id)
  //entity.save()
}
export function handAddVote(event: VoteEvent._addVote): void {
  log.info('xxxxxxxxxxxxxxxxxx:handAddVote:', []);
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('GameInfo game not found: {}', [event.params.game.toHex()]);
    return;
  }
  var voteInfo = VoteInfo.load(event.params.game.toHex());
  if (voteInfo == null) {
    log.error('VoteInfo vote not exists: {}', [event.params.game.toHex()]);
    return;
  }
  let id = event.params.game.toHex() + '-' + event.params.sender.toHex();
  var voteUserInfo = VoteUserInfo.load(id);
  if (voteUserInfo != null) {
    log.error('VoteUserInfo game already exists: {}', [id]);
    return;
  }
  // event _addVote(address indexed game, address indexed sender, uint8 option,uint256 originVoteNumber,uint256 challengeVoteNumber);
  voteUserInfo = new VoteUserInfo(id);
  voteUserInfo.option = event.params.option;
  voteUserInfo.sender = event.params.sender;
  voteUserInfo.vote = voteInfo.id;
  // voteUserInfo.game = gameInfo.id;
  voteUserInfo.timestamp = event.block.timestamp;
  if (voteInfo.option.toI32() == voteUserInfo.option) {
    voteInfo.agreeNum = voteInfo.agreeNum + 1;
  } else {
    voteInfo.disAgreeNum = voteInfo.disAgreeNum + 1;
  }
  voteUserInfo.save();
  voteInfo.save();
  gameInfo.save();
}
export function handStartVote(event: VoteEvent._startVote): void {
  log.info('xxxxxxxxxxxxxxxxxx:handConfirmVote:', []);
  var voteInfo = VoteInfo.load(event.params.game.toHex() + '3');
  if (voteInfo == null) {
    log.error('VoteInfo game already exists: {}', [event.params.game.toHex()]);
    return;
  }
}

export function handGetAward(event: GameEvent._getAward): void {
  log.info('xxxxxxxxxxxxxxxxxx:handGetAward:', []);
  var gameInfo = GameInfo.load(event.params.game.toHex());
  if (gameInfo == null) {
    log.error('GetAward game not found: {}', [event.params.game.toHex()]);
    return;
  }
  let id = event.params.game.toHex() + '-' + event.params.sender.toHex();
  var gameUserInfo = GameUserInfo.load(id);
  if (!gameUserInfo) {
    gameUserInfo = new GameUserInfo(id);
    gameUserInfo.game = gameInfo.id;
    gameUserInfo.timestamp = event.block.timestamp;
  }
  gameUserInfo.sender = event.params.sender;
  gameUserInfo.finishReward = event.params.amount;
  gameUserInfo.save();
  //VoteTemplate.create(event.params.vote);
}
