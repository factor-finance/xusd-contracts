// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title XUSD VaultInitializer Contract
 * @notice The VaultInitializer sets up the initial contract.
 * @author Factor Finance
 */
import { VaultInitializer } from "./VaultInitializer.sol";
import { VaultAdmin } from "./VaultAdmin.sol";

contract Vault is VaultInitializer, VaultAdmin {}
