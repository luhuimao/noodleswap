// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface TokenStandardInterface {
    function balanceOf(address ownerAddr) external returns (uint256);
    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address fromAddr, address to, uint value) external returns (bool);
}