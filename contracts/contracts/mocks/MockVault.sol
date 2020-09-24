pragma solidity 0.5.11;

import { VaultCore } from "../vault/VaultCore.sol";
import { VaultInitializer } from "../vault/VaultInitializer.sol";


contract MockVault is VaultCore, VaultInitializer {
    uint256 storedTotalValue;

    function setTotalValue(uint256 _totalValue) public {
        storedTotalValue = _totalValue;
    }

    function totalValue() external returns (uint256) {
        return storedTotalValue;
    }

    function _totalValue(uint256[] memory assetPrices)
        internal
        view
        returns (uint256)
    {
        return storedTotalValue;
    }
}
