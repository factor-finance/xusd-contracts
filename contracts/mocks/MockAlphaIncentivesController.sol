// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import { MintableERC20 } from "./MintableERC20.sol";

contract MockAlphaIncentivesController {
    mapping(address => uint256) private rewards;
    address private vaultAddress;
    mapping(address => uint256) public claimed;
    address public token;
    MintableERC20 public REWARD_TOKEN;

    constructor(address _reward_token) {
        token = _reward_token;
        REWARD_TOKEN = MintableERC20(token);
    }

    function setVault(address _vaultAddress) external {
        vaultAddress = _vaultAddress;
    }

    function setRewardBalance(address user, uint256 amount) external {
        rewards[user] = amount;
    }

    /**
     * @dev Returns the total of rewards of an user, already accrued + not yet accrued
     * @param user The address of the user
     * @return The rewards
     **/
    function getRewardBalance(address user) external view returns (uint256) {
        return rewards[user];
    }

    /**
     * @dev Claims reward for an user, on all the assets of the lending pool, accumulating the pending rewards
     * @param amount Amount of rewards to claim
     * @param to Address that will be receiving the rewards
     * @return Rewards claimed
     **/
    function claim(
        address to,
        uint256 amount,
        bytes32[] calldata proof
    ) external returns (uint256) {
        if (amount == 0) {
            return 0;
        }
        require(rewards[to] == amount);
        require(proof.length > 0);
        require(vaultAddress != address(0));
        REWARD_TOKEN.mint(amount);
        require(REWARD_TOKEN.transfer(vaultAddress, amount));
        rewards[to] = 0;
        claimed[to] = claimed[to] + amount;
        return amount;
    }
}
