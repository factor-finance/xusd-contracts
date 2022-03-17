// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IAlphaIncentiveDistributor {
    // closed source.
    // extracted from: https://snowtrace.io/address/0x7424ddc7ac9f60b3d0f7bca9e438dc2c1d44d043 (alpha)
    //                       and 0xf40d48bb67508538bfab8091a919d2659a944b16 (wavax)
    // Returns the address of the token distributed by this contract.
    function token() external view returns (address);

    function claim(
        address _account,
        uint256 _reward,
        bytes32[] calldata _proof
    ) external;

    function claimed(address _account) external view returns (uint256);
}
