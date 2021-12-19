// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IVault } from "../interfaces/IVault.sol";

import { XUSD } from "../token/XUSD.sol";

contract MockNonRebasing {
    XUSD xUSD;

    function setXUSD(address _xUSDAddress) public {
        xUSD = XUSD(_xUSDAddress);
    }

    function rebaseOptIn() public {
        xUSD.rebaseOptIn();
    }

    function rebaseOptOut() public {
        xUSD.rebaseOptOut();
    }

    function transfer(address _to, uint256 _value) public {
        xUSD.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public {
        xUSD.transferFrom(_from, _to, _value);
    }

    function increaseAllowance(address _spender, uint256 _addedValue) public {
        xUSD.increaseAllowance(_spender, _addedValue);
    }

    function mintXusd(
        address _vaultContract,
        address _asset,
        uint256 _amount
    ) public {
        IVault(_vaultContract).mint(_asset, _amount, 0);
    }

    function redeemXusd(address _vaultContract, uint256 _amount) public {
        IVault(_vaultContract).redeem(_amount, 0);
    }

    function approveFor(
        address _contract,
        address _spender,
        uint256 _addedValue
    ) public {
        IERC20(_contract).approve(_spender, _addedValue);
    }
}
