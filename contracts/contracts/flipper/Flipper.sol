// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "../governance/Governable.sol";
import "../token/XUSD.sol";
import "../interfaces/Tether.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Contract to exchange usdt, usdc, dai from and to xusd.
//   - 1 to 1. No slippage
//   - Optimized for low gas usage
//   - No guarantee of availability

contract Flipper is Governable {
    using SafeERC20 for IERC20;

    uint256 constant MAXIMUM_PER_TRADE = (25000 * 1e18);

    // Settable coin addresses allow easy testing and use of mock currencies.
    IERC20 immutable dai;
    XUSD immutable xusd;
    IERC20 immutable usdc;
    Tether immutable usdt;

    // ---------------------
    // Dev constructor
    // ---------------------
    constructor(
        address _dai,
        address _xusd,
        address _usdc,
        address _usdt
    ) {
        require(address(_dai) != address(0));
        require(address(_xusd) != address(0));
        require(address(_usdc) != address(0));
        require(address(_usdt) != address(0));
        dai = IERC20(_dai);
        xusd = XUSD(_xusd);
        usdc = IERC20(_usdc);
        usdt = Tether(_usdt);
    }

    // -----------------
    // Trading functions
    // -----------------

    /// @notice Purchase XUSD with Dai
    /// @param amount Amount of XUSD to purchase, in 18 fixed decimals.
    function buyXusdWithDai(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        require(
            dai.transferFrom(msg.sender, address(this), amount),
            "DAI transfer failed"
        );
        require(xusd.transfer(msg.sender, amount), "XUSD transfer failed");
    }

    /// @notice Sell XUSD for Dai
    /// @param amount Amount of XUSD to sell, in 18 fixed decimals.
    function sellXusdForDai(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        require(dai.transfer(msg.sender, amount), "DAI transfer failed");
        require(
            xusd.transferFrom(msg.sender, address(this), amount),
            "XUSD transfer failed"
        );
    }

    /// @notice Purchase XUSD with USDC
    /// @param amount Amount of XUSD to purchase, in 18 fixed decimals.
    function buyXusdWithUsdc(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        // Potential rounding error is an intentional trade off
        require(
            usdc.transferFrom(msg.sender, address(this), amount / 1e12),
            "USDC transfer failed"
        );
        require(xusd.transfer(msg.sender, amount), "XUSD transfer failed");
    }

    /// @notice Sell XUSD for USDC
    /// @param amount Amount of XUSD to sell, in 18 fixed decimals.
    function sellXusdForUsdc(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        require(
            usdc.transfer(msg.sender, amount / 1e12),
            "USDC transfer failed"
        );
        require(
            xusd.transferFrom(msg.sender, address(this), amount),
            "XUSD transfer failed"
        );
    }

    /// @notice Purchase XUSD with USDT
    /// @param amount Amount of XUSD to purchase, in 18 fixed decimals.
    function buyXusdWithUsdt(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        // Potential rounding error is an intentional trade off
        // USDT does not return a boolean and reverts,
        // so no need for a require.
        usdt.transferFrom(msg.sender, address(this), amount / 1e12);
        require(xusd.transfer(msg.sender, amount), "XUSD transfer failed");
    }

    /// @notice Sell XUSD for USDT
    /// @param amount Amount of XUSD to sell, in 18 fixed decimals.
    function sellXusdForUsdt(uint256 amount) external {
        require(amount <= MAXIMUM_PER_TRADE, "Amount too large");
        // USDT does not return a boolean and reverts,
        // so no need for a require.
        usdt.transfer(msg.sender, amount / 1e12);
        require(
            xusd.transferFrom(msg.sender, address(this), amount),
            "XUSD transfer failed"
        );
    }

    // --------------------
    // Governance functions
    // --------------------

    /// @dev Opting into yield reduces the gas cost per transfer by about 4K, since
    /// xusd needs to do less accounting and one less storage write.
    function rebaseOptIn() external onlyGovernor nonReentrant {
        xusd.rebaseOptIn();
    }

    /// @notice Owner function to withdraw a specific amount of a token
    function withdraw(address token, uint256 amount)
        external
        onlyGovernor
        nonReentrant
    {
        IERC20(token).safeTransfer(_governor(), amount);
    }

    /// @notice Owner function to withdraw all tradable tokens
    /// @dev Contract will not perform any swaps until liquidity is provided
    /// again by transferring assets to the contract.
    function withdrawAll() external onlyGovernor nonReentrant {
        IERC20(dai).safeTransfer(_governor(), dai.balanceOf(address(this)));
        IERC20(xusd).safeTransfer(_governor(), xusd.balanceOf(address(this)));
        IERC20(address(usdt)).safeTransfer(
            _governor(),
            usdt.balanceOf(address(this))
        );
        IERC20(usdc).safeTransfer(_governor(), usdc.balanceOf(address(this)));
    }
}
