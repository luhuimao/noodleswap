// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract ERC20Faucet {
    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public totalSupply;

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _decimals
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function faucet(uint256 wad) public {
        balanceOf[msg.sender] += wad;
        totalSupply += wad;
        emit Transfer(address(0), msg.sender, wad);
    }

    function faucet(address addr, uint256 wad) public {
        balanceOf[addr] += wad;
        totalSupply += wad;
        emit Transfer(address(0), addr, wad);
    }

    function approve(address spender, uint256 wad) public returns (bool) {
        allowance[msg.sender][spender] = wad;
        emit Approval(msg.sender, spender, wad);
        return true;
    }

    function transfer(address dst, uint256 wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(balanceOf[src] >= wad, '');

        if (src != msg.sender && allowance[src][msg.sender] != type(uint256).max) {
            require(allowance[src][msg.sender] >= wad, '');
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}
