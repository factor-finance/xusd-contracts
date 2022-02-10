// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

// import { SafeERC20 } from
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { ICERC20 } from "../interfaces/alphaHomora/ICERC20.sol";
import { ISafeBox } from "../interfaces/alphaHomora/ISafeBox.sol";
import { StableMath } from "../utils/StableMath.sol";

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// https://alphafinancelab.gitbook.io/alpha-homora-developer-doc/become-the-leader-of-alpha-homora-v2
// 1. User calls 'deposit' (AlphaHomora)
//  - Deposit their underlying stablecoin
//  - Mint cToken to them
// 2. User calls withdraw (cToken)
//  - Retrieve their cToken
//  - Return underlying + interest (using exchangeRate)

contract MockCERC20 is ICERC20 {
    using SafeMath for uint256;

    IERC20 public token;
    uint256 public interestPerYear = 10e16; // 10% per year
    uint256 exchangeRate = 1e18;

    mapping(address => uint256) public borrows;
    mapping(address => uint256) public lastBlock;

    constructor(IERC20 _token) {
        token = _token;
    }

    function decimals() external override returns (uint8) {
        return 8;
    }

    function underlying() external override returns (address) {
        return address(token);
    }

    function mint(uint256 mintAmount) external override returns (uint256) {
        // FIXME: mint token (change interface of mock?) and send
    }

    function redeem(uint256 redeemTokens) external override returns (uint256) {
        // FIXME: burn and return proper amount w/ exchange rate
    }

    function balanceOf(address user) external view override returns (uint256) {
        return token.balanceOf(user);
    }

    function borrowBalanceCurrent(address account)
        public
        override
        returns (uint256)
    {
        uint256 timePast = block.timestamp - lastBlock[account];
        if (timePast > 0) {
            uint256 interest = borrows[account]
                .mul(interestPerYear)
                .div(100e16)
                .mul(timePast)
                .div(365 days);
            borrows[account] = borrows[account].add(interest);
            lastBlock[account] = block.timestamp;
        }
        return borrows[account];
    }

    function borrowBalanceStored(address account)
        external
        view
        override
        returns (uint256)
    {
        return borrows[account];
    }

    function borrow(uint256 borrowAmount) external override returns (uint256) {
        borrowBalanceCurrent(msg.sender);
        token.transfer(msg.sender, borrowAmount);
        borrows[msg.sender] = borrows[msg.sender].add(borrowAmount);
        return 0;
    }

    function repayBorrow(uint256 repayAmount)
        external
        override
        returns (uint256)
    {
        borrowBalanceCurrent(msg.sender);
        token.transferFrom(msg.sender, address(this), repayAmount);
        borrows[msg.sender] = borrows[msg.sender].sub(repayAmount);
        return 0;
    }

    function setMockExchangeRate() external {
        // 1% more
        exchangeRate = 1e18 + 1e16;
    }

    function exchangeRateCurrent() external override returns (uint256) {
        // https://github.com/CreamFi/cream-deployment/blob/avax/contracts/CToken.sol#L268-L283
        return exchangeRate;
    }

    function exchangeRateStored() external view override returns (uint256) {
        return 1e18;
    }
}

contract MockSafeBox is ISafeBox, ReentrancyGuard, ERC20 {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    ICERC20 public immutable override cToken;
    IERC20 public immutable override uToken;

    bytes32 public root;
    mapping(address => uint256) public claimed;

    constructor(
        ICERC20 _cToken,
        string memory _name,
        string memory _symbol
    ) public ERC20(_name, _symbol) {
        IERC20 _uToken = IERC20(_cToken.underlying());
        cToken = _cToken;
        uToken = _uToken;
        // MAX_INT
        _uToken.safeApprove(address(_cToken), uint256(2**256 - 1));
    }

    function deposit(uint256 amount) external override nonReentrant {
        uint256 uBalanceBefore = uToken.balanceOf(address(this));
        uToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 uBalanceAfter = uToken.balanceOf(address(this));
        uint256 cBalanceBefore = cToken.balanceOf(address(this));
        require(cToken.mint(uBalanceAfter.sub(uBalanceBefore)) == 0, "!mint");
        uint256 cBalanceAfter = cToken.balanceOf(address(this));
        _mint(msg.sender, cBalanceAfter.sub(cBalanceBefore));
    }

    function withdraw(uint256 amount) public override nonReentrant {
        _burn(msg.sender, amount);
        uint256 uBalanceBefore = uToken.balanceOf(address(this));
        require(cToken.redeem(amount) == 0, "!redeem");
        uint256 uBalanceAfter = uToken.balanceOf(address(this));
        uToken.safeTransfer(msg.sender, uBalanceAfter.sub(uBalanceBefore));
    }

    function claim(uint256 totalAmount, bytes32[] memory proof)
        public
        override
        nonReentrant
    {
        // FIXME use a setMockRewards and ignore proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, totalAmount));
        require(MerkleProof.verify(proof, root, leaf), "!proof");
        uint256 send = totalAmount.sub(claimed[msg.sender]);
        claimed[msg.sender] = totalAmount;
        uToken.safeTransfer(msg.sender, send);
    }

    function claimAndWithdraw(
        uint256 totalAmount,
        bytes32[] memory proof,
        uint256 withdrawAmount
    ) external override {
        claim(totalAmount, proof);
        withdraw(withdrawAmount);
    }
}
