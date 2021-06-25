// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface INoodleStaking {
    function addStakeInfo(
        address lpToken,
        uint256 _noodlePerBlock,
        uint256 _endTimeSec
    ) external;
}
