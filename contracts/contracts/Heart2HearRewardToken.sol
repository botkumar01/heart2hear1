// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Heart2Hear Reward Token
/// @notice Represents platform reward points for verified helper
/// contributions on Heart2Hear. This is NOT an investment product and
/// carries no guaranteed monetary value — see docs/BLOCKCHAIN_SETUP.md.
/// Minting is restricted to the backend's reward distributor wallet
/// (MINTER_ROLE), which only acts after the backend has independently
/// verified reward eligibility (spec section 34) — this contract itself
/// has no opinion on eligibility, it just records the resulting mint
/// transparently and immutably on-chain.
contract Heart2HearRewardToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event RewardIssued(address indexed helper, uint256 amount, string reason);

    constructor(address admin) ERC20("Heart2Hear Reward Point", "H2H") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Mints reward tokens to a helper's wallet. Only callable by
    /// an address holding MINTER_ROLE (the backend's distributor wallet).
    function rewardHelper(address helper, uint256 amount, string calldata reason)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        _mint(helper, amount);
        emit RewardIssued(helper, amount, reason);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
