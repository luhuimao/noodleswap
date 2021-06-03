// SPDX-License-Identifier: GPL-3.0

pragma solidity = 0.8.3;

import "../interfaces/ITokenStandardInterface.sol";

//Token Transfer Library
library TransferHelper {
    
    function safeApprove(address token, address to, uint256 value) internal {
        bool success = TokenStandardInterface(token).approve(to, value);
        require(success, 'TransferHelper::safeApprove: approve failed');
    }

    function safeTransferFrom(address token, address fromAddr, address to, uint256 value) internal {
        bool success = TokenStandardInterface(token).transferFrom(fromAddr, to, value);
        require(success, 'TransferHelper::transferFrom: transferFrom failed');
    }
    
    function safeTransfer(address token, address to, uint256 value) internal {
        bool success = TokenStandardInterface(token).transfer(to, value);
        require(success, 'TransferHelper::safeTransfer: transfer failed');
    }

    function safeTransferETH(address payable to, uint256 value) internal {
        to.transfer(value);
    }
}