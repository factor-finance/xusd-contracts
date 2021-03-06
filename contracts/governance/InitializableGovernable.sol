// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title XUSD InitializableGovernable Contract
 * @author Factor Finance
 */
import { Initializable } from "../utils/Initializable.sol";

import { Governable } from "./Governable.sol";

contract InitializableGovernable is Governable, Initializable {
    function _initialize(address _newGovernor) internal {
        _changeGovernor(_newGovernor);
    }
}
