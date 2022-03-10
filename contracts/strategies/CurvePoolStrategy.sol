// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title Curve Pool Strategy
 * @notice Investment strategy for investing in Curve Pools
 * @author Origin Protocol Inc
 * @author Factor Finance 2022
 */
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { ICurveGauge } from "./ICurveGauge.sol";
import { IERC20, BaseCurveStrategy } from "./BaseCurveStrategy.sol";
import { StableMath } from "../utils/StableMath.sol";
import { Helpers } from "../utils/Helpers.sol";

contract CurveUsdcStrategy is BaseCurveStrategy {
    using StableMath for uint256;
    using SafeERC20 for IERC20;

    address internal crvGaugeAddress;

    /**
     * Initializer for setting up strategy internal state. This overrides the
     * InitializableAbstractStrategy initializer as Curve strategies don't fit
     * well within that abstraction.
     * @param _platformAddress Address of the Curve pool
     * @param _vaultAddress Address of the vault
     * @param _rewardTokenAddress Address of reward
     * @param _assets Addresses of supported assets. MUST be passed in the same
     *                order as returned by coins on the pool contract, i.e.
     *                USDC, USDCe
     * @param _pTokens Platform Token corresponding addresses
     * @param _crvGaugeAddress Address of the Curve DAO gauge for this pool
     */
    function initialize(
        address _platformAddress, // Pool address
        address _vaultAddress,
        address[] calldata _rewardTokenAddresses, // [WAVAX, CRV]
        address[] calldata _assets,
        address[] calldata _pTokens,
        address _crvGaugeAddress
    ) external onlyGovernor initializer {
        require(_assets.length == 2, "Must have exactly two assets");
        // Should be set prior to abstract initialize call otherwise
        // abstractSetPToken calls will fail
        crvGaugeAddress = _crvGaugeAddress;
        pTokenAddress = _pTokens[0];
        super._initialize(
            _platformAddress,
            _vaultAddress,
            _rewardTokenAddresses,
            _assets,
            _pTokens
        );
        _approveBase();
    }

    function _lpDepositAll() internal override {
        IERC20 pToken = IERC20(pTokenAddress);
        // Deposit into Gauge
        ICurveGauge(crvGaugeAddress).deposit(
            pToken.balanceOf(address(this)),
            address(this)
        );
    }

    function _lpWithdraw(uint256 numPTokens) internal override {
        // Not enough of pool token exists on this contract, some must be
        // staked in Gauge, unstake difference
        ICurveGauge(crvGaugeAddress).withdraw(numPTokens);
    }

    /**
     * @dev Calculate the total platform token balance (i.e. 3CRV) that exist in
     * this contract or is staked in the Gauge (or in other words, the total
     * amount platform tokens we own).
     * @return contractPTokens Amount of platform tokens in this contract
     * @return gaugePTokens Amount of platform tokens staked in gauge
     * @return totalPTokens Total amount of platform tokens in native decimals
     */
    function _getTotalPTokens()
        internal
        view
        override
        returns (
            uint256 contractPTokens,
            uint256 gaugePTokens,
            uint256 totalPTokens
        )
    {
        contractPTokens = IERC20(pTokenAddress).balanceOf(address(this));
        ICurveGauge gauge = ICurveGauge(crvGaugeAddress);
        gaugePTokens = gauge.balanceOf(address(this));
        totalPTokens = contractPTokens + gaugePTokens;
    }

    function _approveBase() internal override {
        IERC20 pToken = IERC20(pTokenAddress);
        // Pool for LP token (required for removing liquidity)
        pToken.safeApprove(platformAddress, 0);
        pToken.safeApprove(platformAddress, type(uint256).max);
        // Gauge for LP token
        pToken.safeApprove(crvGaugeAddress, 0);
        pToken.safeApprove(crvGaugeAddress, type(uint256).max);
    }

    /**
     * @dev Collect accumulated rewards and send to Vault.
     */
    function collectRewardTokens() external override onlyVault nonReentrant {
        // Collect rewards directly to the vault.
        // N.B. if there are new rewards, we do not need to transfer them.
        ICurveGauge(crvGaugeAddress).claim_rewards(address(this), vaultAddress);
        // FIXME: for each reward token: compute diff on vault and emit amounts claimed
        // emit RewardTokenCollected(vaultAddress, amount);
    }
}
