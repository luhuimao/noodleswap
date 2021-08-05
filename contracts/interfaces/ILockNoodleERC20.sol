// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

interface ILockNoodleERC20 {
    // event Approval(address indexed owner, address indexed spender, uint value);
    // event Transfer(address indexed from, address indexed to, uint value);

    //function name() external pure returns (string memory);
    //function symbol() external pure returns (string memory);
    //function decimals() external pure returns (uint8);
    //function totalSupply() external view returns (uint);

    // function endTime() external returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function burn(address from, uint256 value) external returns (bool);

    function mint(address to, uint256 value) external returns (bool);
    // function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;
}
