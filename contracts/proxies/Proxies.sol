// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import { InitializeGovernedUpgradeabilityProxy } from "./InitializeGovernedUpgradeabilityProxy.sol";

/**
 * @notice XUSDProxy delegates calls to an XUSD implementation
 */
contract XUSDProxy is InitializeGovernedUpgradeabilityProxy {

}

/**
 * @notice VaultProxy delegates calls to a Vault implementation
 */
contract VaultProxy is InitializeGovernedUpgradeabilityProxy {

}

/**
 * @notice AaveStrategyProxy delegates calls to a AaveStrategy implementation
 */
contract AaveStrategyProxy is InitializeGovernedUpgradeabilityProxy {

}

/**
 * @notice AlphaHomoraStrategyProxy delegates calls to a AlphaHomoraStrategy implementation
 */
contract AlphaHomoraStrategyProxy is InitializeGovernedUpgradeabilityProxy {

}

/**
 * @notice AaveStrategyProxy delegates calls to a AaveStrategy implementation
 */
contract CurveUsdcStrategyProxy is InitializeGovernedUpgradeabilityProxy {

}
