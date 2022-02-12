// SPDX-License-Identifier: MIT

// FIXME: update?
// pragma solidity 0.6.12;
pragma solidity ^0.8.0;

interface ICERC20 {
    function decimals() external returns (uint8);

    function underlying() external returns (address);

    function mint(uint256 mintAmount) external returns (uint256);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function balanceOf(address user) external view returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function exchangeRateCurrent() external returns (uint256);
}
