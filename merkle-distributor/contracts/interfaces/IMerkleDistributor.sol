// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;

// Allows anyone to claim a token if they exist in a merkle root.
interface IMerkleDistributor {
    // Returns the address of the token distributed by this contract.
    function token() external view returns (address);
    // Returns the merkle root of the merkle tree containing account balances available to claim.
    function merkleRoot() external view returns (bytes32);
    // Returns the current claiming week
    function week() external view returns (uint32);
    // Returns true if the claim function is frozen
    function frozen() external view returns (bool);
    // Returns true if the index has been marked claimed.
    function isClaimed(uint256 index) external view returns (bool);
    // Claim the given amount of the token to the given address. Reverts if the inputs are invalid.
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external;
    // Claim the given amount of token to the recipient address given a signature from air drop recipient.
    function claimTo(
        uint256 index,
        uint256 amount,
        bytes32[] calldata merkleProof,
        address recipient,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    // Freezes the claim function and allow the merkleRoot to be changed.
    function freeze() external;
    // Unfreezes the claim function.
    function unfreeze() external;
    // Update the merkle root and increment the week.
    function updateMerkleRoot(bytes32 newMerkleRoot) external;

    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, uint256 amount, address indexed airdropRecipient, address indexed tokenReceiver, uint256 indexed week);
    // This event is triggered whenever the merkle root gets updated.
    event MerkleRootUpdated(bytes32 indexed merkleRoot, uint32 indexed week);
}
