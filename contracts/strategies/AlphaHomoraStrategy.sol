// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title XUSD AlphaHomora Strategy
 * @notice Investment strategy for investing stablecoins via AlphaHomora/CREAM
 * @author XUSD.fi Inc
 */
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IERC20, InitializableAbstractStrategy } from "../utils/InitializableAbstractStrategy.sol";
import { ICERC20 } from "../interfaces/alphaHomora/ICERC20.sol";
import { ISafeBox } from "../interfaces/alphaHomora/ISafeBox.sol";

contract AlphaHomoraStrategy is InitializableAbstractStrategy {
    using SafeERC20 for IERC20;

    function initialize(
        address _platformAddress, // SafeBox
        address _vaultAddress,
        address _rewardTokenAddress, // ALPHA.e
        address[] calldata _assets,
        address[] calldata _pTokens,
        address _incentivesAddress
    ) external onlyGovernor initializer {
        // TODO implement incentivecontroller for ALPHA
        // they use merkledistributor: https://etherscan.io/address/0x94207cb2a02f0dbc16040b6692ee1cb999e85d9b#code
        // incentivesController = IAlphaIncentivesController(_incentivesAddress);
        _incentivesAddress;
        InitializableAbstractStrategy._initialize(
            _platformAddress,
            _vaultAddress,
            _rewardTokenAddress,
            _assets,
            _pTokens
        );
    }

    event SkippedWithdrawal(address asset, uint256 amount);

    /**
     * @dev Collect accumulated ALPHA and send to Vault.
     */
    function collectRewardToken() external override onlyVault nonReentrant {
        // TODO: implement WAVAX rewards on safebox
        ISafeBox safeBox = _getSafeBoxFor(assetsMapped[0]);
        // ICERC20 cToken = _getCTokenFor(assetsMapped[0]);
        /* IComptroller comptroller = IpComptroller(cToken.comptroller()); */
        /* // Only collect from active cTokens, saves gas */
        /* address[] memory ctokensToCollect = new address[](assetsMapped.length); */
        /* for (uint256 i = 0; i < assetsMapped.length; i++) { */
        /*     ICERC20 cToken = _getCTokenFor(assetsMapped[i]); */
        /*     ctokensToCollect[i] = address(cToken); */
        /* } */
        /* // Claim only for this strategy */
        /* address[] memory claimers = new address[](1); */
        /* claimers[0] = address(this); */
        /* // Claim COMP from Comptroller. Only collect for supply, saves gas */
        /* comptroller.claimComp(claimers, ctokensToCollect, false, true); */
        /* // Transfer COMP to Vault */
        /* IERC20 rewardToken = IERC20(rewardTokenAddress); */
        /* uint256 balance = rewardToken.balanceOf(address(this)); */
        /* emit RewardTokenCollected(vaultAddress, balance); */
        /* rewardToken.safeTransfer(vaultAddress, balance); */
    }

    /**
     * @dev Deposit asset into AlphaHomora
     * @param _asset Address of asset to deposit
     * @param _amount Amount of asset to deposit
     */
    function deposit(address _asset, uint256 _amount)
        external
        override
        onlyVault
        nonReentrant
    {
        _deposit(_asset, _amount);
    }

    /**
     * @dev Deposit asset into AlphaHomorax
     * @param _asset Address of asset to deposit
     * @param _amount Amount of asset to deposit
     */
    function _deposit(address _asset, uint256 _amount) internal {
        require(_amount > 0, "Must deposit something");
        ISafeBox safeBox = _getSafeBoxFor(_asset);
        emit Deposit(_asset, address(safeBox), _amount);
        safeBox.deposit(_amount);
    }

    /**
     * @dev Deposit the entire balance of any supported asset into AlphaHomora
     */
    function depositAll() external override onlyVault nonReentrant {
        for (uint256 i = 0; i < assetsMapped.length; i++) {
            uint256 balance = IERC20(assetsMapped[i]).balanceOf(address(this));
            if (balance > 0) {
                _deposit(assetsMapped[i], balance);
            }
        }
    }

    /**
     * @dev Withdraw asset from AlphaHomora
     * @param _recipient Address to receive withdrawn asset
     * @param _asset Address of asset to withdraw
     * @param _amount Amount of asset to withdraw
     */
    function withdraw(
        address _recipient,
        address _asset,
        uint256 _amount
    ) external override onlyVault nonReentrant {
        require(_amount > 0, "Must withdraw something");
        require(_recipient != address(0), "Must specify recipient");

        ISafeBox safeBox = _getSafeBoxFor(_asset);
        ICERC20 cToken = _getCTokenFor(_asset);
        uint256 cTokensToRedeem = _convertUnderlyingToCToken(cToken, _amount);
        emit Withdrawal(_asset, address(safeBox), cTokensToRedeem);
        if (cTokensToRedeem == 0) {
            emit SkippedWithdrawal(_asset, _amount);
            return;
        }
        emit Withdrawal(_asset, address(cToken.underlying()), _amount);
        uint256 balanceBefore = IERC20(_asset).balanceOf(address(this));
        safeBox.withdraw(cTokensToRedeem);
        uint256 balanceAfter = IERC20(_asset).balanceOf(address(this));
        require(
            balanceAfter - balanceBefore == _amount,
            "Did not withdraw enough"
        );
        IERC20(_asset).safeTransfer(_recipient, _amount);
    }

    /**
     * @dev Remove all assets from platform and send all of that asset to Vault contract.
     */
    function withdrawAll() external override onlyVaultOrGovernor nonReentrant {
        for (uint256 i = 0; i < assetsMapped.length; i++) {
            IERC20 asset = IERC20(assetsMapped[i]);
            ISafeBox safeBox = _getSafeBoxFor(assetsMapped[i]);
            ICERC20 cToken = _getCTokenFor(assetsMapped[i]);
            uint256 balance = cToken.balanceOf(address(this));
            // Redeem entire balance of safeBox
            if (balance > 0) {
                safeBox.withdraw(balance);
                // Transfer entire balance to Vault, including any already held
                asset.safeTransfer(
                    vaultAddress,
                    asset.balanceOf(address(this))
                );
            }
        }
    }

    /**
     * @dev Get the total asset value held in the platform
     *      This includes any interest that was generated since depositing
     *      Compound exchange rate between the cToken and asset gradually increases,
     *      causing the cToken to be worth more corresponding asset.
     * @param _asset      Address of the asset
     * @return balance    Total value of the asset in the platform
     */
    function checkBalance(address _asset)
        external
        view
        override
        returns (uint256 balance)
    {
        // Balance is always with token cToken decimals
        ICERC20 cToken = _getCTokenFor(_asset);
        balance = _checkBalance(cToken);
    }

    /**
     * @dev Get the total asset value held in the platform
     *      underlying = (cTokenAmt * exchangeRate) / 1e18
     * @param _cToken     cToken for which to check balance
     * @return balance    Total value of the asset in the platform
     */
    function _checkBalance(ICERC20 _cToken)
        internal
        view
        returns (uint256 balance)
    {
        uint256 cTokenBalance = _cToken.balanceOf(address(this));
        uint256 exchangeRate = _cToken.exchangeRateStored();
        // e.g. 50e8*205316390724364402565641705 / 1e18 = 1.0265..e18
        balance = (cTokenBalance * exchangeRate) / 1e18;
    }

    /**
     * @dev Retuns bool indicating whether asset is supported by strategy
     * @param _asset Address of the asset
     */
    function supportsAsset(address _asset)
        external
        view
        override
        returns (bool)
    {
        return assetToPToken[_asset] != address(0);
    }

    /**
     * @dev Approve the spending of all assets by their corresponding cToken,
     *      if for some reason is it necessary.
     */
    function safeApproveAllTokens() external override {
        uint256 assetCount = assetsMapped.length;
        for (uint256 i = 0; i < assetCount; i++) {
            address asset = assetsMapped[i];
            address cToken = assetToPToken[asset];
            // Safe approval
            IERC20(asset).safeApprove(cToken, 0);
            IERC20(asset).safeApprove(cToken, type(uint256).max);
        }
    }

    /**
     * @dev Internal method to respond to the addition of new asset / cTokens
     *      We need to approve the cToken and give it permission to spend the asset
     * @param _asset Address of the asset to approve
     * @param _cToken The cToken for the approval
     */
    function _abstractSetPToken(address _asset, address _cToken)
        internal
        override
    {
        // Safe approval
        IERC20(_asset).safeApprove(_cToken, 0);
        IERC20(_asset).safeApprove(_cToken, type(uint256).max);
    }

    /**
     * @dev Get the cToken wrapped in the ICERC20 interface for this asset.
     *      Fails if the cToken doesn't exist in our mappings.
     * @param _asset Address of the asset
     * @return Corresponding cToken to this asset
     */
    function _getSafeBoxFor(address _asset) internal view returns (ISafeBox) {
        address safeBox = assetToPToken[_asset];
        require(safeBox != address(0), "safeBox does not exist");
        return ISafeBox(safeBox);
    }

    function _getCTokenFor(address _asset) internal view returns (ICERC20) {
        ISafeBox safeBox = _getSafeBoxFor(_asset);
        return ICERC20(safeBox.cToken());
    }

    /**
     * @dev Converts an underlying amount into cToken amount
     *      cTokenAmt = (underlying * 1e18) / exchangeRate
     * @param _cToken     cToken for which to change
     * @param _underlying Amount of underlying to convert
     * @return amount     Equivalent amount of cTokens
     */
    function _convertUnderlyingToCToken(ICERC20 _cToken, uint256 _underlying)
        internal
        view
        returns (uint256 amount)
    {
        uint256 exchangeRate = _cToken.exchangeRateStored();
        // e.g. 1e18*1e18 / 205316390724364402565641705 = 50e8
        // e.g. 1e8*1e18 / 205316390724364402565641705 = 0.45 or 0
        amount = (_underlying * 1e18) / exchangeRate;
    }
}
