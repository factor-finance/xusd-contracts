// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICERC20 } from "./ICERC20.sol";

interface ISafeBox {
    function cToken() external view returns (ICERC20);

    function uToken() external view returns (IERC20);

    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function claim(uint256 totalAmount, bytes32[] memory proof) external;

    function claimAndWithdraw(
        uint256 totalAmount,
        bytes32[] memory proof,
        uint256 withdrawAmount
    ) external;
}
