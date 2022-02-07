// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { ICurveGauge } from "../../strategies/ICurveGauge.sol";
import { MockWAVAX } from "../MockWAVAX.sol";
import { IMintableERC20 } from "../MintableERC20.sol";

contract MockCurveGauge is ICurveGauge {
    mapping(address => uint256) private _balances;
    address lpToken;
    address[] reward_tokens;
    uint256 amount;

    constructor(address _lpToken) {
        lpToken = _lpToken;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function deposit(uint256 _value, address _account) external override {
        IERC20(lpToken).transferFrom(msg.sender, address(this), _value);
        _balances[_account] += _value;
    }

    function withdraw(uint256 _value) external override {
        IERC20(lpToken).transfer(msg.sender, _value);
        _balances[msg.sender] -= _value;
    }

    function addRewardToken(address rewardAddress) external {
        // mock only method for testing
        reward_tokens.push(rewardAddress);
    }

    function setRewardAmount(uint256 _amount) external {
        amount = _amount;
    }

    function claim_rewards(address _sender, address _receiver)
        external
        override
    {
        address reward = reward_tokens[0];
        if (amount > 0) {
            // TODO: loop over multiple rewards
            IMintableERC20(reward).mint(amount);
            IERC20(reward).transfer(_receiver, amount);
            amount = 0;
        }
    }
}
