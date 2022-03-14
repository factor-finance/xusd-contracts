// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { MintableERC20 } from "./MintableERC20.sol";
import { ICERC20 } from "../interfaces/alphaHomora/ICERC20.sol";
import { ISafeBox } from "../interfaces/alphaHomora/ISafeBox.sol";
import { StableMath } from "../utils/StableMath.sol";


// https://alphafinancelab.gitbook.io/alpha-homora-developer-doc/become-the-leader-of-alpha-homora-v2
// 1. User calls 'deposit' (AlphaHomora)
//  - Deposit their underlying stablecoin[<8;60;9m]
//  - Mint cToken to them
// 2. User calls withdraw (cToken)
//  - Retrieve their cToken
//  - Return underlying + interest (using exchangeRate)

contract MockCERC20 is ICERC20 {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;
    uint256 public interestPerYear = 10e16; // 10% per year
    uint256 exchangeRate = 1e18;
    uint256 public mintRate = 1e18;
    uint256 public totalSupply = 0;

    mapping(address => uint256) public override balanceOf;
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

    function setMintRate(uint256 _mintRate) external {
        mintRate = _mintRate;
    }

    function mint(uint256 mintAmount) external override returns (uint256) {
        uint256 amountIn = mintAmount.mul(mintRate).div(1e18);
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountIn);
        totalSupply = totalSupply.add(mintAmount);
        balanceOf[msg.sender] = balanceOf[msg.sender].add(mintAmount);
        return 0;
    }

    function redeem(uint256 redeemAmount) external override returns (uint256) {
        uint256 amountOut = redeemAmount.mul(1e18).div(mintRate);
        IERC20(token).safeTransfer(msg.sender, amountOut);
        totalSupply = totalSupply.sub(redeemAmount);
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(redeemAmount);
        return 0;
    }

    function setMockExchangeRate() external {
        // 1% more
        exchangeRate = 1e18 + 1e16;
        // create enough DAI to pay back
        // do not make it too complicated
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
    MintableERC20 public REWARD_TOKEN;

    bytes32 public root;
    mapping(address => uint256) public rewards;

    constructor(
        ICERC20 _cToken,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        IERC20 _uToken = IERC20(_cToken.underlying());
        cToken = _cToken;
        uToken = _uToken;
        // MAX_INT
        _uToken.safeApprove(address(_cToken), uint256(2**256 - 1));
    }

    function setRewardsBalance(address user, uint256 amount) external {
        rewards[user] = amount;
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
        require(totalAmount > 0);
        REWARD_TOKEN.mint(totalAmount);
        require(rewards[msg.sender] == totalAmount);
        require(REWARD_TOKEN.transfer(msg.sender, totalAmount));
        rewards[msg.sender] = 0;
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
