// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import './interfaces/ILockNoodleERC20.sol';
import './interfaces/INoodleGameERC20.sol';
import './libraries/openzeppelin/contracts/utils/cryptography/draft-EIP712.sol';
import './libraries/SafeMath.sol';
import './libraries/openzeppelin/contracts/utils/Counters.sol';
import './libraries/openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol';

contract LockNoodleTokenERC20 is ILockNoodleERC20 {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);
    bytes32 private immutable _PERMIT_TYPEHASH =
        keccak256('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)');

    string public name = 'LockNoodleToken';
    string public symbol = 'LockNoodleToken';
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public owner;
    mapping(address => Counters.Counter) private _nonces;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

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

    /**
     * @dev See {IERC20Permit-permit}.
     */
    function permit(
        address _owner,
        address _spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp <= deadline, 'ERC20Permit: expired deadline');

        // bytes32 structHash = keccak256(
        //     abi.encode(_PERMIT_TYPEHASH, _owner, _spender, value, _useNonce(_owner), deadline)
        // );

        // bytes32 hash = _hashTypedDataV4(structHash);

        // address signer = ECDSA.recover(hash, v, r, s);
        // require(signer == owner, 'ERC20Permit: invalid signature');

        _approve(_owner, _spender, value);
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     *
     * _Available since v4.1._
     */
    function _useNonce(address _owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[_owner];
        current = nonce.current();
        nonce.increment();
    }
}
