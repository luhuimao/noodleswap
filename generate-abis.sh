#!/bin/bash

script=./abis.sh

echo  $script  contracts/ConfigAddress.sol
$script  contracts/ConfigAddress.sol

echo  $script  contracts/Game.sol
$script  contracts/Game.sol

echo  $script  contracts/GameERC20.sol
$script  contracts/GameERC20.sol

echo  $script  contracts/GameFactory.sol
$script  contracts/GameFactory.sol

echo  $script  contracts/libraries/LGame.sol
$script  contracts/libraries/LGame.sol

echo  $script  contracts/LockNoodleTokenERC20.sol
$script  contracts/LockNoodleTokenERC20.sol

echo  $script  contracts/NoodleStaking.sol
$script  contracts/NoodleStaking.sol

echo  $script  contracts/PlayNFT.sol
$script  contracts/PlayNFT.sol