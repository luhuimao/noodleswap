// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import './interfaces/ILockNoodleERC20.sol';
import './interfaces/INoodleGameERC20.sol';

import './libraries/SafeMath.sol';

contract LockNoodleTokenERC20 is ILockNoodleERC20 {
    using SafeMath for uint256;

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    string public name = 'LockNoodleToken';
    string public symbol = 'LockNoodleToken';
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public owner;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    mapping(address => uint256) public nonces;

    constructor(string memory _tokenName, string memory _tokenSymbol) {
        name = _tokenName;
        symbol = _tokenSymbol;
        owner = msg.sender;
    }

    function _mint(address to, uint256 value) internal {
        // require(owner == msg.sender, 'permission deny');
        totalSupply = totalSupply.add(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(address(0), to, value);
    }

    function mint(address to, uint256 value) external override returns (bool) {
        _mint(to, value);
        return true;
    }

    function _burn(address from, uint256 value) internal {
        // require(owner == msg.sender, 'permission deny');
        balanceOf[from] = balanceOf[from].sub(value);
        totalSupply = totalSupply.sub(value);
        emit Transfer(from, address(0), value);
    }

    function burn(address from, uint256 value) external override returns (bool) {
        _burn(from, value);
        return true;
    }

    function _approve(
        address _owner,
        address spender,
        uint256 value
    ) internal {
        allowance[_owner][spender] = value;
        emit Approval(_owner, spender, value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(from, to, value);
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        //if (allowance[from][msg.sender] != uint256(-1)) {
        allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        //}
        _transfer(from, to, value);
        return true;
    }

    function permit(
        address _owner,
        address spender,
        uint256 value,
        uint256 deadline
    ) external {
        require(deadline >= block.timestamp, 'NoodleSwap: EXPIRED');
        _approve(_owner, spender, value);
    }
}
