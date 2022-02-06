// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "../interfaces/chainlink/AggregatorV3Interface.sol";
import { IOracle } from "../interfaces/IOracle.sol";
import { Helpers } from "../utils/Helpers.sol";

abstract contract OracleRouterBase is IOracle {
    uint256 constant MIN_DRIFT = uint256(70000000);
    uint256 constant MAX_DRIFT = uint256(130000000);

    /**
     * @dev The price feed contract to use for a particular asset.
     * @param asset address of the asset
     * @return address address of the price feed for the asset
     */
    function feed(address asset) internal view virtual returns (address);

    /**
     * @notice Returns the total price in 8 digit USD for a given asset.
     * @param asset address of the asset
     * @return uint256 USD price of 1 of the asset, in 8 decimal fixed
     */
    function price(address asset) external view override returns (uint256) {
        address _feed = feed(asset);

        require(_feed != address(0), "Asset not available");
        (, int256 _iprice, , , ) = AggregatorV3Interface(_feed)
            .latestRoundData();
        uint256 _price = uint256(_iprice);
        if (isStablecoin(asset)) {
            require(_price <= MAX_DRIFT, "Oracle: Price exceeds max");
            require(_price >= MIN_DRIFT, "Oracle: Price under min");
        }
        return uint256(_price);
    }

    function isStablecoin(address _asset) internal view returns (bool) {
        string memory symbol = Helpers.getSymbol(_asset);
        bytes32 symbolHash = keccak256(abi.encodePacked(symbol));
        return
            symbolHash == keccak256(abi.encodePacked("DAI")) ||
            symbolHash == keccak256(abi.encodePacked("USDC")) ||
            symbolHash == keccak256(abi.encodePacked("USDT"));
    }
}

contract OracleRouter is OracleRouterBase {
    /**
     * @dev The price feed contract to use for a particular asset.
     * @param asset address of the asset
     */
    function feed(address asset) internal pure override returns (address) {
        // DAI
        if (asset == address(0xd586E7F844cEa2F87f50152665BCbc2C279D8d70)) {
            // Chainlink: DAI/USD
            return address(0x51D7180edA2260cc4F6e4EebB82FEF5c3c2B8300);
        } else if (
            // USDCe
            asset == address(0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664) ||
            // USDC
            asset == address(0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E)
        ) {
            // Chainlink: USDC/USD
            return address(0xF096872672F44d6EBA71458D74fe67F9a77a23B9);
        } else if (
            // USDTe
            asset == address(0xc7198437980c041c805A1EDcbA50c1Ce5db95118) ||
            // USDT
            asset == address(0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7)
        ) {
            // Chainlink: USDT/USD
            return address(0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a);
        } else if (
            // WAVAX
            asset == address(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7)
        ) {
            // Chainlink: WAVAX/USD
            return address(0x0A77230d17318075983913bC2145DB16C7366156);
        } else {
            revert("Asset not available");
        }
    }
}

contract OracleRouterTestnet is OracleRouterBase {
    /**
     * @dev The price feed contract to use for a particular asset. Testnet hacks.
     * @param asset address of the asset
     */
    function feed(address asset) internal pure override returns (address) {
        // DAI
        if (asset == address(0x51BC2DfB9D12d9dB50C855A5330fBA0faF761D15)) {
            // Chainlink: USDT/USD ~1
            return address(0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad);
        } else if (
            // rando USDC
            asset == address(0x3a9fC2533eaFd09Bc5C36A7D6fdd0C664C81d659)
        ) {
            // Chainlink: USDT/USD ~1
            return address(0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad);
        } else if (
            // USDTe
            asset == address(0x02823f9B469960Bb3b1de0B3746D4b95B7E35543)
        ) {
            // Chainlink: USDT/USD ~1
            return address(0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad);
        } else if (
            // WAVAX
            asset == address(0xd00ae08403B9bbb9124bB305C09058E32C39A48c)
        ) {
            // Chainlink: WAVAX/USD
            return address(0x5498BB86BC934c8D34FDA08E81D444153d0D06aD);
        } else {
            revert("Asset not available");
        }
    }
}

contract OracleRouterDev is OracleRouterBase {
    mapping(address => address) public assetToFeed;

    function setFeed(address _asset, address _feed) external {
        assetToFeed[_asset] = _feed;
    }

    /**
     * @dev The price feed contract to use for a particular asset.
     * @param asset address of the asset
     */
    function feed(address asset) internal view override returns (address) {
        return assetToFeed[asset];
    }
}
