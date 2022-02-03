// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UMA_ERC20 is ERC20 {
    // solhint-disable-next-line no-empty-blocks
    constructor(
        string memory name,
        string memory symbol,
        uint256 amountToMint
    ) public ERC20(name, symbol) {
        _mint(msg.sender, amountToMint);
    }
}
